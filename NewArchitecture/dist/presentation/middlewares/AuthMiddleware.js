"use strict";
/**
 * Authentication Middleware
 * Handles user authentication and authorization
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
exports.AuthMiddleware = void 0;
const tsyringe_1 = require("tsyringe");
let AuthMiddleware = class AuthMiddleware {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    /**
     * Authenticate user based on session
     */
    authenticate = async (req, res, next) => {
        try {
            // Check for session-based authentication
            const sessionId = req.session?.sessionId || req.headers.authorization?.replace('Bearer ', '');
            if (!sessionId) {
                res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
                return;
            }
            // Get session from repository
            const session = await this.userRepository.getSession(sessionId);
            if (!session) {
                res.status(401).json({
                    success: false,
                    error: 'Invalid session'
                });
                return;
            }
            // Check if session is expired
            if (session.expiresAt && session.expiresAt < new Date()) {
                // Clean up expired session
                await this.userRepository.terminateSession(sessionId);
                res.status(401).json({
                    success: false,
                    error: 'Session expired'
                });
                return;
            }
            // Get user information
            const user = await this.userRepository.findById(session.userId);
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
                return;
            }
            const userData = user.toObject();
            // Check if user is active
            if (userData.status !== 'active') {
                res.status(401).json({
                    success: false,
                    error: 'User account is not active'
                });
                return;
            }
            // Attach user to request
            req.user = {
                id: userData.id,
                username: userData.username,
                role: userData.role,
                permissions: userData.permissions || []
            };
            // Update last activity (optional - could be done periodically instead)
            await this.userRepository.updateSessionActivity(sessionId);
            next();
        }
        catch (error) {
            console.error('Authentication middleware error:', error);
            res.status(500).json({
                success: false,
                error: 'Authentication failed'
            });
        }
    };
    /**
     * Authorize user based on required permissions
     */
    authorize = (requiredPermissions) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
                const userPermissions = req.user.permissions || [];
                // Check if user has required permissions
                const hasPermission = permissions.some(permission => userPermissions.includes(permission) ||
                    userPermissions.includes('*') || // Super admin permission
                    req.user?.role === 'admin' // Admin role has all permissions
                );
                if (!hasPermission) {
                    res.status(403).json({
                        success: false,
                        error: 'Insufficient permissions',
                        required: permissions,
                        current: userPermissions
                    });
                    return;
                }
                next();
            }
            catch (error) {
                console.error('Authorization middleware error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Authorization failed'
                });
            }
        };
    };
    /**
     * Authorize user based on role
     */
    requireRole = (requiredRoles) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
                if (!roles.includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: 'Insufficient role privileges',
                        required: roles,
                        current: req.user.role
                    });
                    return;
                }
                next();
            }
            catch (error) {
                console.error('Role authorization middleware error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Role authorization failed'
                });
            }
        };
    };
    /**
     * Optional authentication - user info if available, but doesn't block request
     */
    optionalAuth = async (req, res, next) => {
        try {
            const sessionId = req.session?.sessionId || req.headers.authorization?.replace('Bearer ', '');
            if (sessionId) {
                const session = await this.userRepository.getSession(sessionId);
                if (session && (!session.expiresAt || session.expiresAt >= new Date())) {
                    const user = await this.userRepository.findById(session.userId);
                    if (user && user.toObject().status === 'active') {
                        const userData = user.toObject();
                        req.user = {
                            id: userData.id,
                            username: userData.username,
                            role: userData.role,
                            permissions: userData.permissions || []
                        };
                    }
                }
            }
            next();
        }
        catch (error) {
            console.error('Optional auth middleware error:', error);
            // Continue without user info on error
            next();
        }
    };
    /**
     * Check if user owns the resource or has admin privileges
     */
    ownerOrAdmin = (getUserIdFromRequest) => {
        return (req, res, next) => {
            try {
                if (!req.user) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }
                const resourceUserId = getUserIdFromRequest(req);
                // Allow if user owns the resource or is admin
                if (req.user.id === resourceUserId || req.user.role === 'admin') {
                    next();
                    return;
                }
                res.status(403).json({
                    success: false,
                    error: 'Access denied - insufficient privileges'
                });
            }
            catch (error) {
                console.error('Owner/admin middleware error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Authorization check failed'
                });
            }
        };
    };
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], AuthMiddleware);
//# sourceMappingURL=AuthMiddleware.js.map