/**
 * Get Call History Use Case
 * Handles retrieving call history with search and pagination
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { ICallRepository, CallSearchCriteria } from '@/core/domain/repositories/ICallRepository';
import { Call, CallStatus } from '@/core/domain/entities/Call';

export interface GetCallHistoryRequest {
  search?: {
    employeeId?: string;
    employeeName?: string;
    phoneNumber?: string;
    broadcastId?: string;
    status?: CallStatus;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
    minDuration?: number;
    maxDuration?: number;
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface GetCallHistoryResponse {
  calls: Call[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  statistics?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
  };
}

@injectable()
export class GetCallHistoryUseCase implements IUseCase<GetCallHistoryRequest, UseCaseResult<GetCallHistoryResponse>> {
  constructor(
    @inject('ICallRepository')
    private callRepository: ICallRepository
  ) {}

  async execute(request: GetCallHistoryRequest): Promise<UseCaseResult<GetCallHistoryResponse>> {
    try {
      let calls: Call[];

      // If search criteria provided
      if (request.search) {
        const searchCriteria: CallSearchCriteria = {
          employeeId: request.search.employeeId,
          // Note: employeeName is not available in CallSearchCriteria, using from/to for phone numbers
          from: request.search.phoneNumber,
          to: request.search.phoneNumber,
          broadcastId: request.search.broadcastId,
          status: request.search.status,
          startDate: request.search.dateRange?.startDate,
          endDate: request.search.dateRange?.endDate
          // Note: minDuration and maxDuration are not available in CallSearchCriteria
        };

        calls = await this.callRepository.search(searchCriteria);
      } else {
        calls = await this.callRepository.findAll();
      }

      // Apply manual pagination if requested
      if (request.pagination) {
        const page = request.pagination.page || 1;
        const limit = request.pagination.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedCalls = calls.slice(startIndex, endIndex);
        
        // Calculate statistics
        const statistics = await this.calculateStatistics(request.search);

        return createSuccessResult({
          calls: paginatedCalls,
          pagination: {
            total: calls.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(calls.length / limit)
          },
          statistics
        });
      }

      // Calculate statistics
      const statistics = await this.calculateStatistics(request.search);

      return createSuccessResult({
        calls,
        statistics
      });

    } catch (error) {
      return createErrorResult(`Failed to retrieve call history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async calculateStatistics(searchCriteria?: GetCallHistoryRequest['search']) {
    let calls: Call[];

    if (searchCriteria) {
      const criteria: CallSearchCriteria = {
        employeeId: searchCriteria.employeeId,
        from: searchCriteria.phoneNumber,
        to: searchCriteria.phoneNumber,
        broadcastId: searchCriteria.broadcastId,
        status: searchCriteria.status,
        startDate: searchCriteria.dateRange?.startDate,
        endDate: searchCriteria.dateRange?.endDate
      };
      calls = await this.callRepository.search(criteria);
    } else {
      calls = await this.callRepository.findAll();
    }

    const totalCalls = calls.length;
    const successfulCalls = calls.filter(call => 
      call.toObject().status === CallStatus.COMPLETED
    ).length;
    const failedCalls = calls.filter(call => 
      call.toObject().status === CallStatus.FAILED
    ).length;

    const totalDuration = calls.reduce((sum, call) => sum + (call.toObject().duration || 0), 0);
    const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageDuration
    };
  }
}