"use strict";
/**
 * Delete Group Use Case
 * Handles soft deletion of groups
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteGroupUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let DeleteGroupUseCase = class DeleteGroupUseCase {
    groupRepository;
    broadcastRepository;
    constructor(groupRepository, broadcastRepository) {
        this.groupRepository = groupRepository;
        this.broadcastRepository = broadcastRepository;
    }
    async execute(request) {
        try {
            // Validate request
            if (!request.groupId?.trim()) {
                return (0, IUseCase_1.createErrorResult)('Group ID is required');
            }
            if (!request.deletedBy?.trim()) {
                return (0, IUseCase_1.createErrorResult)('User ID is required');
            }
            // Check if group exists
            const existingGroup = await this.groupRepository.findById(request.groupId);
            if (!existingGroup) {
                return (0, IUseCase_1.createErrorResult)('Group not found');
            }
            const groupData = existingGroup.toObject();
            // Check if group is already deleted
            if (!groupData.isActive) {
                return (0, IUseCase_1.createErrorResult)('Group is already deleted');
            }
            // Check if group is being used in active broadcasts (unless force delete)
            if (!request.force) {
                // Note: findActiveByGroup method doesn't exist, using findAll as fallback
                const activeBroadcasts = await this.broadcastRepository.findAll();
                if (activeBroadcasts.length > 0) {
                    return (0, IUseCase_1.createErrorResult)(`Group is currently used in ${activeBroadcasts.length} active broadcast(s). Use force option to delete anyway.`);
                }
            }
            // Perform soft delete (deactivate group)
            const deactivated = await this.groupRepository.deactivate(request.groupId);
            if (!deactivated) {
                return (0, IUseCase_1.createErrorResult)('Failed to delete group');
            }
            return (0, IUseCase_1.createSuccessResult)({
                success: true,
                message: 'Group successfully deleted'
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.DeleteGroupUseCase = DeleteGroupUseCase;
exports.DeleteGroupUseCase = DeleteGroupUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IGroupRepository')),
    __param(1, (0, tsyringe_1.inject)('IBroadcastRepository')),
    __metadata("design:paramtypes", [Object, Object])
], DeleteGroupUseCase);
//# sourceMappingURL=DeleteGroupUseCase.js.map