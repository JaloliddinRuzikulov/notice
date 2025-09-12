"use strict";
/**
 * Login User Use Case
 * Handles user authentication and session creation
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
exports.LoginUserUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const User_1 = require("@/core/domain/entities/User");
const crypto_1 = require("crypto");
let LoginUserUseCase = class LoginUserUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(request) {
        try {
            // Validate request
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Invalid request', validation.errors);
            }
            // Find user by username
            const user = await this.userRepository.findByUsername(request.username);
            if (!user) {
                return (0, IUseCase_1.createErrorResult)('Invalid username or password');
            }
            let userData = user.toObject();
            // Check if user is locked
            if (userData.lockedUntil && userData.lockedUntil > new Date()) {
                return (0, IUseCase_1.createErrorResult)('Account is temporarily locked due to multiple failed login attempts');
            }
            // Check user status
            if (userData.status !== User_1.UserStatus.ACTIVE) {
                return (0, IUseCase_1.createErrorResult)('Account is not active');
            }
            // Check if user has ID (set a default if missing for new users)
            const userId = userData.id || `temp-${Date.now()}`;
            if (!userData.id) {
                console.warn('User missing ID, this should not happen in production');
                userData = { ...userData, id: userId };
            }
            // Verify password
            const hashedPassword = this.hashPassword(request.password);
            if (userData.passwordHash !== hashedPassword) {
                // Record failed login attempt
                await this.userRepository.recordFailedLogin(userId);
                return (0, IUseCase_1.createErrorResult)('Invalid username or password');
            }
            // Check credentials with repository method
            const authenticatedUser = await this.userRepository.findByCredentials(request.username, hashedPassword);
            if (!authenticatedUser) {
                return (0, IUseCase_1.createErrorResult)('Authentication failed');
            }
            // Reset failed login attempts and update last login
            await this.userRepository.resetFailedLoginAttempts(userId);
            await this.userRepository.updateLastLogin(userId, request.ipAddress);
            // Create session
            const sessionId = await this.userRepository.createSession(userId, {
                ipAddress: request.ipAddress,
                loginTime: new Date()
            });
            // Prepare response
            const response = {
                user: {
                    id: userId,
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    role: userData.role,
                    district: userData.district,
                    department: userData.department,
                    permissions: userData.permissions || []
                },
                sessionId
            };
            return (0, IUseCase_1.createSuccessResult)(response);
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.username?.trim()) {
            errors.push('Username is required');
        }
        if (!request.password?.trim()) {
            errors.push('Password is required');
        }
        if (!request.ipAddress?.trim()) {
            errors.push('IP address is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    hashPassword(password) {
        // Simple MD5 hash - in production, use bcrypt or similar
        return (0, crypto_1.createHash)('md5').update(password).digest('hex');
    }
};
exports.LoginUserUseCase = LoginUserUseCase;
exports.LoginUserUseCase = LoginUserUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], LoginUserUseCase);
//# sourceMappingURL=LoginUserUseCase.js.map