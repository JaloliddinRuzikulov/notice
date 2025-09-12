/**
 * Get Broadcast List Use Case
 * Handles retrieving broadcast list with search and pagination
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IBroadcastRepository, BroadcastSearchCriteria } from '@/core/domain/repositories/IBroadcastRepository';
import { Broadcast, BroadcastStatus, BroadcastType } from '@/core/domain/entities/Broadcast';

export interface GetBroadcastListRequest {
  search?: {
    name?: string;
    type?: BroadcastType;
    status?: BroadcastStatus;
    createdBy?: string;
    dateRange?: {
      startDate: Date;
      endDate: Date;
    };
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface GetBroadcastListResponse {
  broadcasts: Broadcast[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@injectable()
export class GetBroadcastListUseCase implements IUseCase<GetBroadcastListRequest, UseCaseResult<GetBroadcastListResponse>> {
  constructor(
    @inject('IBroadcastRepository')
    private broadcastRepository: IBroadcastRepository
  ) {}

  async execute(request: GetBroadcastListRequest): Promise<UseCaseResult<GetBroadcastListResponse>> {
    try {
      let broadcasts: Broadcast[];

      // If search criteria provided
      if (request.search) {
        const searchCriteria: BroadcastSearchCriteria = {
          title: request.search.name, // Using 'title' instead of 'name'
          type: request.search.type,
          status: request.search.status,
          createdBy: request.search.createdBy,
          startDate: request.search.dateRange?.startDate,
          endDate: request.search.dateRange?.endDate
        };

        broadcasts = await this.broadcastRepository.search(searchCriteria);
      } else {
        broadcasts = await this.broadcastRepository.findAll();
      }

      // Apply manual pagination if requested
      if (request.pagination) {
        const page = request.pagination.page || 1;
        const limit = request.pagination.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedBroadcasts = broadcasts.slice(startIndex, endIndex);
        
        return createSuccessResult({
          broadcasts: paginatedBroadcasts,
          pagination: {
            total: broadcasts.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(broadcasts.length / limit)
          }
        });
      }

      return createSuccessResult({
        broadcasts
      });

    } catch (error) {
      return createErrorResult(`Failed to retrieve broadcasts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}