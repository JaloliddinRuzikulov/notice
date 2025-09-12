/**
 * Group Controller
 * Handles HTTP requests for employee group management
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { BaseController } from '../base/BaseController';
import { CreateGroupUseCase } from '@/application/usecases/group/CreateGroupUseCase';
import { UpdateGroupUseCase } from '@/application/usecases/group/UpdateGroupUseCase';
import { GetGroupListUseCase } from '@/application/usecases/group/GetGroupListUseCase';
import { DeleteGroupUseCase } from '@/application/usecases/group/DeleteGroupUseCase';
import { GroupMapper } from '@/application/mappers/group/GroupMapper';
import { CreateGroupDTO, UpdateGroupDTO, GroupSearchDTO } from '@/application/dto/group/GroupDTO';

@injectable()
export class GroupController extends BaseController {
  constructor(
    @inject(CreateGroupUseCase)
    private createGroupUseCase: CreateGroupUseCase,
    @inject(UpdateGroupUseCase)
    private updateGroupUseCase: UpdateGroupUseCase,
    @inject(GetGroupListUseCase)
    private getGroupListUseCase: GetGroupListUseCase,
    @inject(DeleteGroupUseCase)
    private deleteGroupUseCase: DeleteGroupUseCase,
    @inject(GroupMapper)
    private groupMapper: GroupMapper
  ) {
    super();
  }

  /**
   * Create new group
   * POST /api/groups
   */
  async createGroup(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      const validation = this.validateRequestBody(req, ['name', 'employeeIds']);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      // Validate employeeIds
      if (!Array.isArray(req.body.employeeIds) || req.body.employeeIds.length === 0) {
        return this.badRequest(res, 'At least one employee must be assigned to the group');
      }

      const createDTO: CreateGroupDTO = this.sanitizeInput({
        name: req.body.name,
        description: req.body.description,
        employeeIds: req.body.employeeIds
      });

      // Validate employee IDs using mapper
      const employeeValidation = this.groupMapper.validateEmployeeIds(createDTO.employeeIds);
      if (!employeeValidation.isValid) {
        return this.badRequest(res, 'Employee validation failed', employeeValidation.errors);
      }

      const result = await this.createGroupUseCase.execute({
        ...createDTO,
        createdBy: user.id
      });

      if (result.success && result.data) {
        const groupDTO = this.groupMapper.toDTO(result.data.group);
        return this.created(res, groupDTO, 'Group created successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error creating group:', error);
      return this.internalError(res, 'Failed to create group');
    }
  }

  /**
   * Get group list with search and pagination
   * GET /api/groups
   */
  async getGroups(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.getPaginationFromQuery(req);
      const includeEmployees = req.query.includeEmployees === 'true';
      
      const search: GroupSearchDTO = {
        name: req.query.name as string,
        createdBy: req.query.createdBy as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        hasEmployee: req.query.hasEmployee as string
      };

      // Remove undefined values
      Object.keys(search).forEach(key => 
        search[key as keyof GroupSearchDTO] === undefined && delete search[key as keyof GroupSearchDTO]
      );

      const result = await this.getGroupListUseCase.execute({
        search: Object.keys(search).length > 0 ? search : undefined,
        pagination,
        includeEmployees
      });

      if (result.success && result.data) {
        const groupDTOs = result.data.groups.map(group => 
          includeEmployees && 'employees' in group 
            ? group as any // Already enhanced with employees
            : this.groupMapper.toDTO(group)
        );
        
        if (result.data.pagination) {
          return this.paginated(res, groupDTOs, result.data.pagination);
        } else {
          return this.success(res, groupDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting groups:', error);
      return this.internalError(res, 'Failed to retrieve groups');
    }
  }

  /**
   * Get group by ID
   * GET /api/groups/:id
   */
  async getGroupById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const includeEmployees = req.query.includeEmployees === 'true';

      if (!id) {
        return this.badRequest(res, 'Group ID is required');
      }

      // This would use a GetGroupByIdUseCase (not implemented in this example)
      // For now, we'll use the list use case with a workaround
      const result = await this.getGroupListUseCase.execute({
        includeEmployees
      });

      if (result.success && result.data && result.data.groups.length > 0) {
        const group = result.data.groups.find(g => g.toObject().id === id);
        
        if (group) {
          const groupDTO = includeEmployees && 'employees' in group 
            ? group as any
            : this.groupMapper.toDTO(group);
          return this.success(res, groupDTO);
        }
      }

      return this.notFound(res, 'Group not found');

    } catch (error) {
      console.error('Error getting group by ID:', error);
      return this.internalError(res, 'Failed to retrieve group');
    }
  }

  /**
   * Update group
   * PUT /api/groups/:id
   */
  async updateGroup(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const { id } = req.params;

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!id) {
        return this.badRequest(res, 'Group ID is required');
      }

      const updateDTO: UpdateGroupDTO = this.sanitizeInput({
        name: req.body.name,
        description: req.body.description,
        employeeIds: req.body.employeeIds,
        isActive: req.body.isActive
      });

      // Remove undefined values
      Object.keys(updateDTO).forEach(key => 
        updateDTO[key as keyof UpdateGroupDTO] === undefined && delete updateDTO[key as keyof UpdateGroupDTO]
      );

      // Validate employee IDs if they are being updated
      if (updateDTO.employeeIds) {
        const employeeValidation = this.groupMapper.validateEmployeeIds(updateDTO.employeeIds);
        if (!employeeValidation.isValid) {
          return this.badRequest(res, 'Employee validation failed', employeeValidation.errors);
        }
      }

      const result = await this.updateGroupUseCase.execute({
        groupId: id,
        updatedBy: user.id,
        ...updateDTO
      });

      if (result.success && result.data) {
        const groupDTO = this.groupMapper.toDTO(result.data.group);
        return this.success(res, groupDTO, 'Group updated successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error updating group:', error);
      return this.internalError(res, 'Failed to update group');
    }
  }

  /**
   * Delete group (soft delete)
   * DELETE /api/groups/:id
   */
  async deleteGroup(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const { id } = req.params;
      const force = req.query.force === 'true';

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!id) {
        return this.badRequest(res, 'Group ID is required');
      }

      const result = await this.deleteGroupUseCase.execute({
        groupId: id,
        deletedBy: user.id,
        force
      });

      if (result.success) {
        return this.noContent(res, 'Group deleted successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error deleting group:', error);
      return this.internalError(res, 'Failed to delete group');
    }
  }

  /**
   * Add employees to group
   * POST /api/groups/:id/employees
   */
  async addEmployeesToGroup(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const { id } = req.params;

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!id) {
        return this.badRequest(res, 'Group ID is required');
      }

      const validation = this.validateRequestBody(req, ['employeeIds']);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      if (!Array.isArray(req.body.employeeIds) || req.body.employeeIds.length === 0) {
        return this.badRequest(res, 'At least one employee ID must be provided');
      }

      // This would require a separate use case for adding employees to a group
      // For now, we'll use the update use case to simulate this functionality
      return res.status(501).json({
        success: false,
        error: 'Add employees to group not implemented yet'
      });

    } catch (error) {
      console.error('Error adding employees to group:', error);
      return this.internalError(res, 'Failed to add employees to group');
    }
  }

  /**
   * Remove employees from group
   * DELETE /api/groups/:id/employees
   */
  async removeEmployeesFromGroup(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const { id } = req.params;

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!id) {
        return this.badRequest(res, 'Group ID is required');
      }

      const validation = this.validateRequestBody(req, ['employeeIds']);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      if (!Array.isArray(req.body.employeeIds) || req.body.employeeIds.length === 0) {
        return this.badRequest(res, 'At least one employee ID must be provided');
      }

      // This would require a separate use case for removing employees from a group
      // For now, we'll use the update use case to simulate this functionality
      return res.status(501).json({
        success: false,
        error: 'Remove employees from group not implemented yet'
      });

    } catch (error) {
      console.error('Error removing employees from group:', error);
      return this.internalError(res, 'Failed to remove employees from group');
    }
  }

  /**
   * Get group statistics
   * GET /api/groups/statistics
   */
  async getGroupStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.getGroupListUseCase.execute({});

      if (result.success && result.data) {
        const statisticsDTO = this.groupMapper.toStatisticsDTO(result.data.groups);
        return this.success(res, statisticsDTO);
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting group statistics:', error);
      return this.internalError(res, 'Failed to retrieve group statistics');
    }
  }
}