/**
 * Execute Broadcast Use Case
 * Handles executing mass notification broadcasts with SIP calls
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { ISipService } from '@/infrastructure/services/SipService';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IEmployeeRepository } from '@/core/domain/repositories/IEmployeeRepository';
import { IAudioManager } from '@/infrastructure/services/AudioManager';
import { IWebSocketService } from '@/infrastructure/services/WebSocketService';
import { Broadcast, BroadcastStatus } from '@/core/domain/entities/Broadcast';
import { Call, CallType, CallDirection, CallStatus } from '@/core/domain/entities/Call';
import { Employee } from '@/core/domain/entities/Employee';

export interface ExecuteBroadcastRequest {
  broadcastId: string;
  maxConcurrentCalls?: number;
  callTimeout?: number; // seconds
  retryFailedCalls?: boolean;
  maxRetries?: number;
}

export interface ExecuteBroadcastResponse {
  broadcast: Broadcast;
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  executionTime: number;
  statistics: BroadcastStatistics;
}

interface BroadcastStatistics {
  totalRecipients: number;
  successful: number;
  failed: number;
  busy: number;
  noAnswer: number;
  answered: number;
  averageCallDuration: number;
  totalDuration: number;
}

@injectable()
export class ExecuteBroadcastUseCase implements IUseCase<ExecuteBroadcastRequest, UseCaseResult<ExecuteBroadcastResponse>> {
  private isExecuting: boolean = false;
  private currentBroadcast: Broadcast | null = null;

  constructor(
    @inject('ISipService') private sipService: ISipService,
    @inject('IBroadcastRepository') private broadcastRepository: IBroadcastRepository,
    @inject('ICallRepository') private callRepository: ICallRepository,
    @inject('IEmployeeRepository') private employeeRepository: IEmployeeRepository,
    @inject('IAudioManager') private audioManager: IAudioManager,
    @inject('IWebSocketService') private wsService: IWebSocketService
  ) {}

  async execute(request: ExecuteBroadcastRequest): Promise<UseCaseResult<ExecuteBroadcastResponse>> {
    const startTime = Date.now();

    try {
      // 1. Validate request and prevent concurrent executions
      if (this.isExecuting) {
        return createErrorResult('Another broadcast is currently executing');
      }

      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // 2. Get broadcast details
      const broadcast = await this.broadcastRepository.findById(request.broadcastId);
      if (!broadcast) {
        return createErrorResult('Broadcast not found');
      }

      const broadcastObj = broadcast.toObject();
      
      // 3. Check broadcast status
      if (broadcastObj.status !== BroadcastStatus.PENDING && broadcastObj.status !== BroadcastStatus.IN_PROGRESS) {
        return createErrorResult(`Broadcast cannot be executed in ${broadcastObj.status} state`);
      }

      // 4. Check SIP service
      if (!this.sipService.isConnected()) {
        return createErrorResult('SIP service is not connected');
      }

      this.isExecuting = true;
      this.currentBroadcast = broadcast;

      // 5. Update broadcast status
      await this.broadcastRepository.updateStatus(request.broadcastId, BroadcastStatus.IN_PROGRESS);
      this.wsService.broadcastBroadcastStatus(request.broadcastId, BroadcastStatus.IN_PROGRESS, {
        message: 'Broadcast execution started'
      });

      // 6. Get target employees
      const targetEmployees = await this.getTargetEmployees(broadcastObj);
      if (targetEmployees.length === 0) {
        await this.broadcastRepository.updateStatus(request.broadcastId, BroadcastStatus.FAILED);
        return createErrorResult('No target employees found');
      }

      // 7. Execute broadcast calls
      const statistics = await this.executeBroadcastCalls(broadcast, targetEmployees, request);

      // 8. Update broadcast completion
      const finalStatus = statistics.failed > 0 ? BroadcastStatus.FAILED : BroadcastStatus.COMPLETED;
      await this.broadcastRepository.updateStatus(request.broadcastId, finalStatus);

      // Update statistics
      const updatedBroadcast = await this.broadcastRepository.findById(request.broadcastId);

      const executionTime = Date.now() - startTime;

      // 9. Broadcast completion
      this.wsService.broadcastBroadcastStatus(request.broadcastId, finalStatus, {
        message: 'Broadcast execution completed',
        statistics,
        executionTime
      });

      return createSuccessResult({
        broadcast: updatedBroadcast!,
        totalCalls: statistics.totalRecipients,
        completedCalls: statistics.successful,
        failedCalls: statistics.failed,
        executionTime,
        statistics
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Update broadcast status to failed
      if (request.broadcastId) {
        await this.broadcastRepository.updateStatus(request.broadcastId, BroadcastStatus.FAILED);
        this.wsService.broadcastBroadcastStatus(request.broadcastId, BroadcastStatus.FAILED, {
          error: errorMessage
        });
      }

      return createErrorResult(`Broadcast execution failed: ${errorMessage}`);
    } finally {
      this.isExecuting = false;
      this.currentBroadcast = null;
    }
  }

  private async validateRequest(request: ExecuteBroadcastRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!request.broadcastId?.trim()) {
      errors.push('Broadcast ID is required');
    }

    if (request.maxConcurrentCalls && request.maxConcurrentCalls < 1) {
      errors.push('Max concurrent calls must be at least 1');
    }

    if (request.callTimeout && request.callTimeout < 10) {
      errors.push('Call timeout must be at least 10 seconds');
    }

    if (request.maxRetries && request.maxRetries < 0) {
      errors.push('Max retries cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async getTargetEmployees(broadcastObj: any): Promise<Employee[]> {
    const targetEmployees: Employee[] = [];
    
    // Get employees from recipients list
    for (const recipient of broadcastObj.recipients || []) {
      if (recipient.employeeId) {
        const employee = await this.employeeRepository.findById(recipient.employeeId);
        if (employee && employee.toObject().isActive && employee.phoneNumber) {
          targetEmployees.push(employee);
        }
      }
    }

    // Get employees by departments
    if (broadcastObj.departmentIds?.length > 0) {
      for (const department of broadcastObj.departmentIds) {
        const employees = await this.employeeRepository.search({
          department: department,
          isActive: true
        });
        targetEmployees.push(...employees.filter(emp => emp.phoneNumber));
      }
    }

    // Get employees by districts
    if (broadcastObj.districtIds?.length > 0) {
      for (const district of broadcastObj.districtIds) {
        const employees = await this.employeeRepository.search({
          district: district,
          isActive: true
        });
        targetEmployees.push(...employees.filter(emp => emp.phoneNumber));
      }
    }

    // Remove duplicates
    const uniqueEmployees = targetEmployees.filter((employee, index, self) => 
      index === self.findIndex(e => e.toObject().id === employee.toObject().id)
    );

    return uniqueEmployees;
  }

  private async executeBroadcastCalls(
    broadcast: Broadcast, 
    targetEmployees: Employee[], 
    options: ExecuteBroadcastRequest
  ): Promise<BroadcastStatistics> {
    const statistics: BroadcastStatistics = {
      totalRecipients: targetEmployees.length,
      successful: 0,
      failed: 0,
      busy: 0,
      noAnswer: 0,
      answered: 0,
      averageCallDuration: 0,
      totalDuration: 0
    };

    const maxConcurrent = options.maxConcurrentCalls || 1;
    const callTimeout = (options.callTimeout || 30) * 1000;
    const maxRetries = options.maxRetries || 1;

    const broadcastObj = broadcast.toObject();

    // Process employees in batches
    for (let i = 0; i < targetEmployees.length; i += maxConcurrent) {
      const batch = targetEmployees.slice(i, i + maxConcurrent);
      const promises = batch.map(employee => 
        this.makeCallToEmployee(employee, broadcast, callTimeout, maxRetries, statistics)
      );

      await Promise.allSettled(promises);

      // Update progress
      const progress = Math.min(100, Math.round(((i + batch.length) / targetEmployees.length) * 100));
      this.wsService.broadcastBroadcastStatus(broadcastObj.id!, BroadcastStatus.IN_PROGRESS, {
        progress,
        completedCalls: statistics.successful + statistics.failed,
        totalCalls: statistics.totalRecipients
      });
    }

    // Calculate average duration
    if (statistics.successful > 0) {
      statistics.averageCallDuration = Math.round(statistics.totalDuration / statistics.successful);
    }

    return statistics;
  }

  private async makeCallToEmployee(
    employee: Employee, 
    broadcast: Broadcast, 
    timeout: number, 
    maxRetries: number, 
    statistics: BroadcastStatistics
  ): Promise<void> {
    const employeeObj = employee.toObject();
    const broadcastObj = broadcast.toObject();
    let attempts = 0;
    let lastError: string | null = null;

    while (attempts <= maxRetries) {
      attempts++;

      try {
        // Create call record
        const callRecord = Call.create({
          callId: `broadcast_${broadcastObj.id}_${employeeObj.id}_${Date.now()}_${attempts}`,
          from: 'system',
          to: employee.phoneNumber,
          direction: CallDirection.OUTBOUND,
          type: CallType.BROADCAST,
          status: CallStatus.INITIATED,
          broadcastId: broadcastObj.id,
          employeeId: employeeObj.id,
          startTime: new Date(),
          metadata: {
            broadcastTitle: broadcastObj.title,
            employeeName: employee.fullName,
            employeeDepartment: employeeObj.department,
            attempt: attempts,
            maxRetries: maxRetries
          }
        });

        // Save call record
        const savedCall = await this.callRepository.save(callRecord);

        // Make SIP call
        const sipCall = await this.sipService.makeCall(employee.phoneNumber);
        
        // Wait for call completion or timeout
        const result = await this.waitForCallCompletion(sipCall.callId, timeout);

        // Update call record based on result
        if (result.status === 'answered') {
          callRecord.answer();
          if (broadcastObj.audioFileUrl) {
            // Play audio message
            await this.audioManager.playAudio(broadcastObj.audioFileUrl);
          }
          callRecord.complete();
          statistics.successful++;
          statistics.answered++;
        } else if (result.status === 'busy') {
          callRecord.markBusy();
          statistics.busy++;
          statistics.failed++;
        } else if (result.status === 'no-answer') {
          callRecord.markNoAnswer();
          statistics.noAnswer++;
          statistics.failed++;
        } else {
          callRecord.fail(result.reason || 'Call failed');
          statistics.failed++;
        }

        // Update call in database
        await this.callRepository.update(savedCall.toObject().id!, callRecord);

        // Add duration to statistics
        if (callRecord.duration) {
          statistics.totalDuration += callRecord.duration;
        }

        // Success - break retry loop
        break;

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempts <= maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    // If all retries failed
    if (attempts > maxRetries && lastError) {
      statistics.failed++;
      console.error(`Failed to call ${employee.fullName} after ${maxRetries} attempts:`, lastError);
    }
  }

  private async waitForCallCompletion(callId: string, timeout: number): Promise<{ status: string; reason?: string }> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ status: 'no-answer', reason: 'Call timeout' });
      }, timeout);

      const handleCallEvent = (eventData: any) => {
        if (eventData.callId === callId) {
          clearTimeout(timeoutId);
          
          if (eventData.status === CallStatus.ANSWERED) {
            resolve({ status: 'answered' });
          } else if (eventData.status === CallStatus.BUSY) {
            resolve({ status: 'busy' });
          } else if (eventData.status === CallStatus.FAILED) {
            resolve({ status: 'failed', reason: eventData.reason });
          } else if (eventData.status === CallStatus.NO_ANSWER) {
            resolve({ status: 'no-answer' });
          }
        }
      };

      // Listen for call status updates
      this.sipService.on('callAnswered', handleCallEvent);
      this.sipService.on('callFailed', handleCallEvent);
      this.sipService.on('callEnded', handleCallEvent);
    });
  }
}