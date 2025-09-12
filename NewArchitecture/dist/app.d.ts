/**
 * Main Application Entry Point
 * Express application with Clean Architecture setup
 */
import { Application } from 'express';
export declare class App {
    private app;
    private port;
    private dbConnection;
    constructor();
    /**
     * Setup global process handlers
     */
    private setupProcessHandlers;
    /**
     * Setup Express middlewares
     */
    private setupMiddlewares;
    /**
     * Setup Dependency Injection
     */
    private setupDependencyInjection;
    /**
     * Setup API routes
     */
    private setupRoutes;
    /**
     * Setup error handling
     */
    private setupErrorHandling;
    /**
     * Get allowed CORS origins
     */
    private getAllowedOrigins;
    /**
     * Initialize database connection
     */
    initializeDatabase(): Promise<void>;
    /**
     * Start the server
     */
    start(): Promise<void>;
    /**
     * Get Express application instance
     */
    getApp(): Application;
    /**
     * Stop the server (mainly for testing)
     */
    stop(): Promise<void>;
}
export default App;
//# sourceMappingURL=app.d.ts.map