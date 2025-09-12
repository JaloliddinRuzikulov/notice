/**
 * Get Group List Use Case
 * Handles retrieving groups with search and pagination
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IGroupRepository, GroupSearchCriteria } from '@/core/domain/repositories/IGroupRepository';
import { Group } from '@/core/domain/entities/Group';

export interface GetGroupListRequest {
  search?: {
    name?: string;
    createdBy?: string;
    isActive?: boolean;
    hasEmployee?: string; // employeeId to check if group contains this employee
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
  includeEmployees?: boolean; // Whether to include employee details
}

export interface GetGroupListResponse {
  groups: Array<Group & {
    employees?: Array<{
      id: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      department: string;
      isActive: boolean;
    }>;
  }>;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@injectable()
export class GetGroupListUseCase implements IUseCase<GetGroupListRequest, UseCaseResult<GetGroupListResponse>> {
  constructor(
    @inject('IGroupRepository')
    private groupRepository: IGroupRepository
  ) {}

  async execute(request: GetGroupListRequest): Promise<UseCaseResult<GetGroupListResponse>> {
    try {
      let groups: Group[];

      // If search criteria provided
      if (request.search) {
        const searchCriteria: GroupSearchCriteria = {
          name: request.search.name,
          createdBy: request.search.createdBy,
          isActive: request.search.isActive
          // Note: hasEmployee is not available in GroupSearchCriteria
        };

        groups = await this.groupRepository.search(searchCriteria);
      } else {
        groups = await this.groupRepository.findAll();
      }

      // Apply manual pagination if requested
      if (request.pagination) {
        const page = request.pagination.page || 1;
        const limit = request.pagination.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedGroups = groups.slice(startIndex, endIndex);
        
        // Enhance groups with employee details if requested
        const enhancedGroups = request.includeEmployees 
          ? await this.enhanceGroupsWithEmployees(paginatedGroups)
          : paginatedGroups;

        return createSuccessResult({
          groups: enhancedGroups,
          pagination: {
            total: groups.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(groups.length / limit)
          }
        });
      }

      // Enhance groups with employee details if requested
      const enhancedGroups = request.includeEmployees 
        ? await this.enhanceGroupsWithEmployees(groups)
        : groups;

      return createSuccessResult({
        groups: enhancedGroups
      });

    } catch (error) {
      return createErrorResult(`Failed to retrieve groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async enhanceGroupsWithEmployees(groups: Group[]): Promise<Array<Group & { employees?: any[] }>> {
    const enhancedGroups = [];

    for (const group of groups) {
      const groupData = group.toObject();
      const employees = await this.groupRepository.getMembers(groupData.id);
      
      enhancedGroups.push({
        ...group,
        employees: employees.map(emp => ({
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          phoneNumber: emp.phoneNumber,
          department: emp.department,
          isActive: emp.isActive
        }))
      });
    }

    return enhancedGroups;
  }
}