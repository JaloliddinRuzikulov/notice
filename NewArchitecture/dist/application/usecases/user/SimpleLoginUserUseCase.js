"use strict";
/**
 * Simple Login User Use Case
 * Basic authentication without complex session management
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
exports.SimpleLoginUserUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const User_1 = require("@/core/domain/entities/User");
const crypto_1 = require("crypto");
let SimpleLoginUserUseCase = class SimpleLoginUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(request) {
        try {
            // Basic validation
            if (!request.username?.trim()) {
                return (0, IUseCase_1.createErrorResult)('Username is required');
            }
            if (!request.password?.trim()) {
                return (0, IUseCase_1.createErrorResult)('Password is required');
            }
            // Find user by username
            const user = await this.userRepository.findByUsername(request.username);
            if (!user) {
                return (0, IUseCase_1.createErrorResult)('Invalid username or password');
            }
            // Check user status
            if (user.status !== User_1.UserStatus.ACTIVE) {
                return (0, IUseCase_1.createErrorResult)('User account is inactive');
            }
            // Verify password
            const hashedPassword = this.hashPassword(request.password);
            if (user.passwordHash !== hashedPassword) {
                return (0, IUseCase_1.createErrorResult)('Invalid username or password');
            }
            // Ensure user has ID
            if (!user.id) {
                return (0, IUseCase_1.createErrorResult)('Invalid user data');
            }
            // Create successful response
            const response = {
                user: {
                    id: user.id,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role.toString(),
                    permissions: user.permissions
                },
                success: true
            };
            return (0, IUseCase_1.createSuccessResult)(response);
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    hashPassword(password) {
        return (0, crypto_1.createHash)('sha256').update(password + 'salt').digest('hex');
    }
};
exports.SimpleLoginUserUseCase = SimpleLoginUserUseCase;
exports.SimpleLoginUserUseCase = SimpleLoginUserUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], SimpleLoginUserUseCase);
//# sourceMappingURL=SimpleLoginUserUseCase.js.map