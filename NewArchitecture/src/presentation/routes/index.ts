/**
 * Main Router
 * Combines all route modules and provides API routing
 */

import { Router } from 'express';
import { EmployeeRoutes } from './employee/EmployeeRoutes';
import { UserRoutes } from './user/UserRoutes';
import { BroadcastRoutes } from './broadcast/BroadcastRoutes';
import { CallRoutes } from './call/CallRoutes';
// import { GroupRoutes } from './group/GroupRoutes';
import { AudioFileRoutes } from './audiofile/AudioFileRoutes';
import { LoggingMiddleware } from '@/presentation/middlewares/LoggingMiddleware';
import { ErrorHandlerMiddleware } from '@/presentation/middlewares/ErrorHandlerMiddleware';

export class APIRouter {
  private router: Router;

  constructor() {
    this.router = Router();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Health check endpoint (minimal logging)
    this.router.get('/health', LoggingMiddleware.healthCheckLogger, (req, res) => {
      res.status(200).json({
        success: true,
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API info endpoint
    this.router.get('/info', (req, res) => {
      res.json({
        success: true,
        data: {
          name: 'IIV Notice System API',
          version: process.env.npm_package_version || '1.0.0',
          description: 'Clean Architecture TypeScript API for mass notification system',
          endpoints: {
            auth: '/api/auth',
            employees: '/api/employees',
            broadcasts: '/api/broadcasts',
            calls: '/api/calls',
            // groups: '/api/groups',
            audioFiles: '/api/audio-files'
          },
          documentation: '/api/docs' // Future implementation
        }
      });
    });
  }

  private setupRoutes(): void {
    // Authentication routes
    this.router.use('/auth', new UserRoutes().getRouter());

    // Employee management routes
    this.router.use('/employees', new EmployeeRoutes().getRouter());

    // Broadcast management routes
    this.router.use('/broadcasts', new BroadcastRoutes().getRouter());

    // Call history routes
    this.router.use('/calls', new CallRoutes().getRouter());

    // Group management routes (temporarily disabled)
    // this.router.use('/groups', new GroupRoutes().getRouter());

    // Audio file management routes
    this.router.use('/audio-files', new AudioFileRoutes().getRouter());

    // Catch-all route for undefined endpoints
    this.router.use('*', ErrorHandlerMiddleware.handleNotFound);
  }

  private setupErrorHandling(): void {
    // Global error handler (must be last middleware)
    this.router.use(ErrorHandlerMiddleware.handleError);
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default APIRouter;