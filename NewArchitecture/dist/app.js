"use strict";
/**
 * Main Application Entry Point
 * Express application with Clean Architecture setup
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_session_1 = __importDefault(require("express-session"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const DIContainer_1 = require("@/infrastructure/container/DIContainer");
const connection_1 = require("@/infrastructure/database/connection");
const routes_1 = require("@/presentation/routes");
const LoggingMiddleware_1 = require("@/presentation/middlewares/LoggingMiddleware");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
class App {
    app;
    port;
    dbConnection;
    constructor() {
        this.app = (0, express_1.default)();
        this.port = parseInt(process.env.PORT || '3000', 10);
        this.dbConnection = connection_1.DatabaseConnection.getInstance();
        this.setupProcessHandlers();
        this.setupMiddlewares();
        this.setupDependencyInjection();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    /**
     * Setup global process handlers
     */
    setupProcessHandlers() {
        // Handle unhandled promise rejections
        process.on('unhandledRejection', ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.handleUnhandledRejection);
        // Handle uncaught exceptions
        process.on('uncaughtException', ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.handleUncaughtException);
        // Graceful shutdown handlers
        const gracefulShutdown = ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.gracefulShutdown(this.app);
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);
    }
    /**
     * Setup Express middlewares
     */
    setupMiddlewares() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: this.getAllowedOrigins(),
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            maxAge: 86400 // 24 hours
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Session configuration
        this.app.use((0, express_session_1.default)({
            secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'strict'
            },
            name: 'iiv.notice.sid'
        }));
        // Request logging
        this.app.use(LoggingMiddleware_1.LoggingMiddleware.requestLogger({
            excludePaths: ['/health', '/favicon.ico'],
            logBody: process.env.NODE_ENV === 'development',
            logHeaders: process.env.NODE_ENV === 'development'
        }));
        // Security logging
        this.app.use(LoggingMiddleware_1.LoggingMiddleware.securityLogger);
        // Performance monitoring
        this.app.use(LoggingMiddleware_1.LoggingMiddleware.performanceLogger(2000)); // Log requests > 2 seconds
        // Global rate limiting
        if (process.env.NODE_ENV === 'production') {
            this.app.use((0, express_rate_limit_1.default)({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // Limit each IP to 1000 requests per windowMs
                message: {
                    success: false,
                    error: 'Too many requests from this IP, please try again later.'
                },
                standardHeaders: true,
                legacyHeaders: false,
            }));
        }
        // Trust proxy (for accurate IP addresses)
        if (process.env.NODE_ENV === 'production') {
            this.app.set('trust proxy', 1);
        }
    }
    /**
     * Setup Dependency Injection
     */
    setupDependencyInjection() {
        try {
            DIContainer_1.DIContainer.configure();
            if (process.env.NODE_ENV === 'development') {
                DIContainer_1.DIContainer.displayInfo();
            }
            // Validate container configuration
            if (!DIContainer_1.DIContainer.validate()) {
                throw new Error('Dependency injection container validation failed');
            }
        }
        catch (error) {
            console.error('Failed to setup dependency injection:', error);
            process.exit(1);
        }
    }
    /**
     * Setup API routes
     */
    setupRoutes() {
        // API routes
        this.app.use('/api', new routes_1.APIRouter().getRouter());
        // Root endpoint
        this.app.get('/', (_req, res) => {
            res.json({
                success: true,
                message: 'IIV Notice System API',
                version: process.env.npm_package_version || '1.0.0',
                status: 'running',
                timestamp: new Date().toISOString(),
                endpoints: {
                    health: '/api/health',
                    info: '/api/info',
                    docs: '/api/docs'
                }
            });
        });
        // Health check endpoint (before error handlers)
        this.app.get('/health', (_req, res) => {
            res.status(200).json({
                success: true,
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(process.uptime()),
                memory: process.memoryUsage(),
                database: 'connected' // This could be made dynamic
            });
        });
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use('*', ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.handleNotFound);
        // Error logging middleware
        this.app.use(LoggingMiddleware_1.LoggingMiddleware.errorLogger);
        // Global error handler (must be last)
        this.app.use(ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.handleError);
    }
    /**
     * Get allowed CORS origins
     */
    getAllowedOrigins() {
        const origins = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001';
        return origins.split(',').map(origin => origin.trim());
    }
    /**
     * Initialize database connection
     */
    async initializeDatabase() {
        try {
            console.log('Initializing database connection...');
            await this.dbConnection.connect();
            console.log('✓ Database connection established');
        }
        catch (error) {
            console.error('✗ Database connection failed:', error);
            throw error;
        }
    }
    /**
     * Start the server
     */
    async start() {
        try {
            // Initialize database
            await this.initializeDatabase();
            // Start HTTP server
            const server = this.app.listen(this.port, () => {
                console.log('\n🚀 IIV Notice System API Server Started');
                console.log('=====================================');
                console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`🌐 Server running on: http://localhost:${this.port}`);
                console.log(`🏥 Health check: http://localhost:${this.port}/health`);
                console.log(`📋 API endpoints: http://localhost:${this.port}/api`);
                console.log(`📊 API info: http://localhost:${this.port}/api/info`);
                console.log('=====================================\n');
            });
            // Setup graceful shutdown for the server
            const gracefulShutdown = (signal) => {
                console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
                server.close(async (err) => {
                    if (err) {
                        console.error('❌ Error during server shutdown:', err);
                        process.exit(1);
                    }
                    try {
                        await this.dbConnection.disconnect();
                        console.log('✅ Database connection closed');
                        console.log('✅ Server shut down gracefully');
                        process.exit(0);
                    }
                    catch (dbError) {
                        console.error('❌ Error closing database connection:', dbError);
                        process.exit(1);
                    }
                });
                // Force close after 30 seconds
                setTimeout(() => {
                    console.error('❌ Could not close connections in time, forcefully shutting down');
                    process.exit(1);
                }, 30000);
            };
            process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
            process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    /**
     * Get Express application instance
     */
    getApp() {
        return this.app;
    }
    /**
     * Stop the server (mainly for testing)
     */
    async stop() {
        try {
            await this.dbConnection.disconnect();
            console.log('✓ Server stopped');
        }
        catch (error) {
            console.error('Error stopping server:', error);
            throw error;
        }
    }
}
exports.App = App;
exports.default = App;
//# sourceMappingURL=app.js.map