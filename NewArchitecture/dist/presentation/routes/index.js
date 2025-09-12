"use strict";
/**
 * Main Router
 * Combines all route modules and provides API routing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIRouter = void 0;
const express_1 = require("express");
const EmployeeRoutes_1 = require("./employee/EmployeeRoutes");
const UserRoutes_1 = require("./user/UserRoutes");
const BroadcastRoutes_1 = require("./broadcast/BroadcastRoutes");
const CallRoutes_1 = require("./call/CallRoutes");
const GroupRoutes_1 = require("./group/GroupRoutes");
const AudioFileRoutes_1 = require("./audiofile/AudioFileRoutes");
const LoggingMiddleware_1 = require("@/presentation/middlewares/LoggingMiddleware");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
class APIRouter {
    router;
    constructor() {
        this.router = (0, express_1.Router)();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Health check endpoint (minimal logging)
        this.router.get('/health', LoggingMiddleware_1.LoggingMiddleware.healthCheckLogger, (req, res) => {
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
                        groups: '/api/groups',
                        audioFiles: '/api/audio-files'
                    },
                    documentation: '/api/docs' // Future implementation
                }
            });
        });
    }
    setupRoutes() {
        // Authentication routes
        this.router.use('/auth', new UserRoutes_1.UserRoutes().getRouter());
        // Employee management routes
        this.router.use('/employees', new EmployeeRoutes_1.EmployeeRoutes().getRouter());
        // Broadcast management routes
        this.router.use('/broadcasts', new BroadcastRoutes_1.BroadcastRoutes().getRouter());
        // Call history routes
        this.router.use('/calls', new CallRoutes_1.CallRoutes().getRouter());
        // Group management routes
        this.router.use('/groups', new GroupRoutes_1.GroupRoutes().getRouter());
        // Audio file management routes
        this.router.use('/audio-files', new AudioFileRoutes_1.AudioFileRoutes().getRouter());
        // Catch-all route for undefined endpoints
        this.router.use('*', ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.handleNotFound);
    }
    setupErrorHandling() {
        // Global error handler (must be last middleware)
        this.router.use(ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.handleError);
    }
    getRouter() {
        return this.router;
    }
}
exports.APIRouter = APIRouter;
exports.default = APIRouter;
//# sourceMappingURL=index.js.map