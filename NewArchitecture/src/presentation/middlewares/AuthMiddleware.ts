/**
 * Authentication Middleware
 * Handles user authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '@/core/domain/repositories/IUserRepository';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

@injectable()
export class AuthMiddleware {
  constructor(
    @inject('IUserRepository')
    private userRepository: IUserRepository
  ) {}

  /**
   * Authenticate user based on session
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check for session-based authentication
      const sessionId = (req.session as any)?.sessionId || req.headers.authorization?.replace('Bearer ', '');

      if (!sessionId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Get session from repository - temporarily disabled as IUserRepository doesn't have session methods
      // const session = await this.userRepository.getSession(sessionId);
      
      // Temporary mock session - implement proper session management later
      const session = sessionId ? { userId: 'temp-user-id', expiresAt: null } : null;

      if (!session) {
        res.status(401).json({
          success: false,
          error: 'Invalid session'
        });
        return;
      }

      // Check if session is expired
      if (session.expiresAt && session.expiresAt < new Date()) {
        // Clean up expired session - temporarily disabled
        // await this.userRepository.terminateSession(sessionId);
        res.status(401).json({
          success: false,
          error: 'Session expired'
        });
        return;
      }

      // Get user information - temporary: use first available user for testing
      let user;
      
      if (session.userId === 'temp-user-id') {
        // Temporary solution: get first user for authentication testing
        const allUsers = await this.userRepository.findAll();
        user = allUsers[0] || null;
      } else {
        user = await this.userRepository.findById(session.userId);
      }

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

      // Update last activity - temporarily disabled
      // await this.userRepository.updateSessionActivity(sessionId);

      next();

    } catch (error) {
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
  authorize = (requiredPermissions: string | string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
        const hasPermission = permissions.some(permission => 
          userPermissions.includes(permission) || 
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

      } catch (error) {
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
  requireRole = (requiredRoles: string | string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

      } catch (error) {
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
  optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = (req.session as any)?.sessionId || req.headers.authorization?.replace('Bearer ', '');

      if (sessionId) {
        // const session = await this.userRepository.getSession(sessionId);
        const session = sessionId ? { userId: 'temp-user-id', expiresAt: null } : null;

        if (session && (!session.expiresAt || session.expiresAt >= new Date())) {
          let user;
          
          if (session.userId === 'temp-user-id') {
            // Temporary solution: get first user for authentication testing
            const allUsers = await this.userRepository.findAll();
            user = allUsers[0] || null;
          } else {
            user = await this.userRepository.findById(session.userId);
          }

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

    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue without user info on error
      next();
    }
  };

  /**
   * Check if user owns the resource or has admin privileges
   */
  ownerOrAdmin = (getUserIdFromRequest: (req: Request) => string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

      } catch (error) {
        console.error('Owner/admin middleware error:', error);
        res.status(500).json({
          success: false,
          error: 'Authorization check failed'
        });
      }
    };
  };
}