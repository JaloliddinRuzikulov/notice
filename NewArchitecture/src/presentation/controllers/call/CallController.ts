/**
 * Call Controller
 * Handles HTTP requests for call history and management
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { BaseController } from '../base/BaseController';
import { CreateCallRecordUseCase } from '@/application/usecases/call/CreateCallRecordUseCase';
import { GetCallHistoryUseCase } from '@/application/usecases/call/GetCallHistoryUseCase';
import { UpdateCallStatusUseCase } from '@/application/usecases/call/UpdateCallStatusUseCase';
import { CallMapper } from '@/application/mappers/call/CallMapper';
import { CreateCallRecordDTO, UpdateCallStatusDTO, CallSearchDTO } from '@/application/dto/call/CallDTO';
import { CallStatus } from '@/core/domain/entities/Call';

@injectable()
export class CallController extends BaseController {
  constructor(
    @inject(CreateCallRecordUseCase)
    private createCallRecordUseCase: CreateCallRecordUseCase,
    @inject(GetCallHistoryUseCase)
    private getCallHistoryUseCase: GetCallHistoryUseCase,
    @inject(UpdateCallStatusUseCase)
    private updateCallStatusUseCase: UpdateCallStatusUseCase,
    @inject(CallMapper)
    private callMapper: CallMapper
  ) {
    super();
  }

  /**
   * Create call record
   * POST /api/calls
   */
  async createCallRecord(req: Request, res: Response): Promise<Response> {
    try {
      const validation = this.validateRequestBody(req, [
        'employeeId', 'phoneNumber', 'startTime', 'status'
      ]);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      // Validate call status
      if (!Object.values(CallStatus).includes(req.body.status)) {
        return this.badRequest(res, 'Invalid call status');
      }

      const createDTO: CreateCallRecordDTO = this.sanitizeInput({
        employeeId: req.body.employeeId,
        phoneNumber: req.body.phoneNumber,
        broadcastId: req.body.broadcastId,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
        status: req.body.status,
        duration: req.body.duration,
        callerId: req.body.callerId,
        notes: req.body.notes
      });

      const result = await this.createCallRecordUseCase.execute(createDTO);

      if (result.success && result.data) {
        const callDTO = this.callMapper.toDTO(result.data.call);
        return this.created(res, callDTO, 'Call record created successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error creating call record:', error);
      return this.internalError(res, 'Failed to create call record');
    }
  }

  /**
   * Get call history with search and pagination
   * GET /api/calls
   */
  async getCallHistory(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.getPaginationFromQuery(req);
      
      const search: CallSearchDTO = {
        employeeId: req.query.employeeId as string,
        employeeName: req.query.employeeName as string,
        phoneNumber: req.query.phoneNumber as string,
        broadcastId: req.query.broadcastId as string,
        status: req.query.status as CallStatus,
        minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
        maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined
      };

      // Handle date range
      if (req.query.startDate && req.query.endDate) {
        search.dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string)
        };
      }

      // Remove undefined values
      Object.keys(search).forEach(key => 
        search[key as keyof CallSearchDTO] === undefined && delete search[key as keyof CallSearchDTO]
      );

      const result = await this.getCallHistoryUseCase.execute({
        search: Object.keys(search).length > 0 ? search : undefined,
        pagination
      });

      if (result.success && result.data) {
        const callDTOs = result.data.calls.map(call => this.callMapper.toDTO(call));
        
        if (result.data.pagination) {
          return this.paginated(res, callDTOs, result.data.pagination, undefined);
        } else {
          const response = this.callMapper.toHistoryResponseDTO(result.data.calls);
          return this.success(res, response);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting call history:', error);
      return this.internalError(res, 'Failed to retrieve call history');
    }
  }

  /**
   * Update call status
   * PUT /api/calls/:id/status
   */
  async updateCallStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.badRequest(res, 'Call ID is required');
      }

      const validation = this.validateRequestBody(req, ['status']);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      // Validate call status
      if (!Object.values(CallStatus).includes(req.body.status)) {
        return this.badRequest(res, 'Invalid call status');
      }

      const updateDTO: UpdateCallStatusDTO = this.sanitizeInput({
        status: req.body.status,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
        duration: req.body.duration,
        notes: req.body.notes
      });

      const result = await this.updateCallStatusUseCase.execute({
        callId: id,
        ...updateDTO
      });

      if (result.success && result.data) {
        const callDTO = this.callMapper.toDTO(result.data.call);
        return this.success(res, callDTO, 'Call status updated successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error updating call status:', error);
      return this.internalError(res, 'Failed to update call status');
    }
  }

  /**
   * Get call by ID
   * GET /api/calls/:id
   */
  async getCallById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.badRequest(res, 'Call ID is required');
      }

      // This would use a GetCallByIdUseCase (not implemented in this example)
      // For now, we'll use the history use case with a workaround
      const result = await this.getCallHistoryUseCase.execute({
        search: undefined // Would filter by ID if available
      });

      if (result.success && result.data && result.data.calls.length > 0) {
        const call = result.data.calls.find(c => c.toObject().id === id);
        
        if (call) {
          const callDTO = this.callMapper.toDTO(call);
          return this.success(res, callDTO);
        }
      }

      return this.notFound(res, 'Call record not found');

    } catch (error) {
      console.error('Error getting call by ID:', error);
      return this.internalError(res, 'Failed to retrieve call record');
    }
  }

  /**
   * Get calls by employee ID
   * GET /api/calls/employee/:employeeId
   */
  async getCallsByEmployee(req: Request, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params;
      const pagination = this.getPaginationFromQuery(req);

      if (!employeeId) {
        return this.badRequest(res, 'Employee ID is required');
      }

      const result = await this.getCallHistoryUseCase.execute({
        search: { employeeId },
        pagination
      });

      if (result.success && result.data) {
        const callDTOs = result.data.calls.map(call => this.callMapper.toDTO(call));
        
        if (result.data.pagination) {
          return this.paginated(res, callDTOs, result.data.pagination);
        } else {
          return this.success(res, callDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting calls by employee:', error);
      return this.internalError(res, 'Failed to retrieve employee calls');
    }
  }

  /**
   * Get calls by broadcast ID
   * GET /api/calls/broadcast/:broadcastId
   */
  async getCallsByBroadcast(req: Request, res: Response): Promise<Response> {
    try {
      const { broadcastId } = req.params;
      const pagination = this.getPaginationFromQuery(req);

      if (!broadcastId) {
        return this.badRequest(res, 'Broadcast ID is required');
      }

      const result = await this.getCallHistoryUseCase.execute({
        search: { broadcastId },
        pagination
      });

      if (result.success && result.data) {
        const callDTOs = result.data.calls.map(call => this.callMapper.toDTO(call));
        
        if (result.data.pagination) {
          return this.paginated(res, callDTOs, result.data.pagination);
        } else {
          return this.success(res, callDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting calls by broadcast:', error);
      return this.internalError(res, 'Failed to retrieve broadcast calls');
    }
  }

  /**
   * Get call statistics
   * GET /api/calls/statistics
   */
  async getCallStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const search: CallSearchDTO = {};

      // Handle date range for statistics
      if (req.query.startDate && req.query.endDate) {
        search.dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string)
        };
      }

      const result = await this.getCallHistoryUseCase.execute({
        search: Object.keys(search).length > 0 ? search : undefined
      });

      if (result.success && result.data && result.data.statistics) {
        return this.success(res, result.data.statistics);
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting call statistics:', error);
      return this.internalError(res, 'Failed to retrieve call statistics');
    }
  }

  /**
   * Get call report
   * GET /api/calls/report
   */
  async getCallReport(req: Request, res: Response): Promise<Response> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const result = await this.getCallHistoryUseCase.execute({
        search: { 
          dateRange: { startDate, endDate }
        }
      });

      if (result.success && result.data) {
        const reportDTO = this.callMapper.toReportDTO(result.data.calls, result.data.statistics);
        return this.success(res, reportDTO);
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error generating call report:', error);
      return this.internalError(res, 'Failed to generate call report');
    }
  }
}