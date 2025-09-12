/**
 * Group Controller
 * Handles HTTP requests for employee group management
 */
import { Request, Response } from 'express';
import { BaseController } from '../base/BaseController';
import { CreateGroupUseCase } from '@/application/usecases/group/CreateGroupUseCase';
import { UpdateGroupUseCase } from '@/application/usecases/group/UpdateGroupUseCase';
import { GetGroupListUseCase } from '@/application/usecases/group/GetGroupListUseCase';
import { DeleteGroupUseCase } from '@/application/usecases/group/DeleteGroupUseCase';
import { GroupMapper } from '@/application/mappers/group/GroupMapper';
export declare class GroupController extends BaseController {
    private createGroupUseCase;
    private updateGroupUseCase;
    private getGroupListUseCase;
    private deleteGroupUseCase;
    private groupMapper;
    constructor(createGroupUseCase: CreateGroupUseCase, updateGroupUseCase: UpdateGroupUseCase, getGroupListUseCase: GetGroupListUseCase, deleteGroupUseCase: DeleteGroupUseCase, groupMapper: GroupMapper);
    /**
     * Create new group
     * POST /api/groups
     */
    createGroup(req: Request, res: Response): Promise<Response>;
    /**
     * Get group list with search and pagination
     * GET /api/groups
     */
    getGroups(req: Request, res: Response): Promise<Response>;
    /**
     * Get group by ID
     * GET /api/groups/:id
     */
    getGroupById(req: Request, res: Response): Promise<Response>;
    /**
     * Update group
     * PUT /api/groups/:id
     */
    updateGroup(req: Request, res: Response): Promise<Response>;
    /**
     * Delete group (soft delete)
     * DELETE /api/groups/:id
     */
    deleteGroup(req: Request, res: Response): Promise<Response>;
    /**
     * Add employees to group
     * POST /api/groups/:id/employees
     */
    addEmployeesToGroup(req: Request, res: Response): Promise<Response>;
    /**
     * Remove employees from group
     * DELETE /api/groups/:id/employees
     */
    removeEmployeesFromGroup(req: Request, res: Response): Promise<Response>;
    /**
     * Get group statistics
     * GET /api/groups/statistics
     */
    getGroupStatistics(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=GroupController.d.ts.map