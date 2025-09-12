"use strict";
/**
 * Get User Profile Use Case
 * Handles retrieving user profile information
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
exports.GetUserProfileUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let GetUserProfileUseCase = class GetUserProfileUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(request) {
        try {
            // Validate request
            if (!request.userId?.trim()) {
                return (0, IUseCase_1.createErrorResult)('User ID is required');
            }
            // Find user by ID
            const user = await this.userRepository.findById(request.userId);
            if (!user) {
                return (0, IUseCase_1.createErrorResult)('User not found');
            }
            const userData = user.toObject();
            // Prepare response (exclude sensitive information)
            const response = {
                user: {
                    id: userData.id,
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    district: userData.district,
                    department: userData.department,
                    permissions: userData.permissions || [],
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLoginAt,
                    lastLoginIP: userData.lastLoginIp
                }
            };
            return (0, IUseCase_1.createSuccessResult)(response);
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to retrieve user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.GetUserProfileUseCase = GetUserProfileUseCase;
exports.GetUserProfileUseCase = GetUserProfileUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], GetUserProfileUseCase);
//# sourceMappingURL=GetUserProfileUseCase.js.map