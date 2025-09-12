/**
 * Main Application Entry Point
 * Express application with Clean Architecture setup
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { DIContainer } from '@/infrastructure/container/DIContainer';
import { DatabaseConnection } from '@/infrastructure/database/connection';
import { APIRouter } from '@/presentation/routes';
import { LoggingMiddleware } from '@/presentation/middlewares/LoggingMiddleware';
import { ErrorHandlerMiddleware } from '@/presentation/middlewares/ErrorHandlerMiddleware';

export class App {
  private app: Application;
  private port: number;
  private dbConnection: DatabaseConnection;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.dbConnection = DatabaseConnection.getInstance();
    
    this.setupProcessHandlers();
    this.setupMiddlewares();
    // Don't setup DI and routes here - they need database connection
  }

  /**
   * Setup global process handlers
   */
  private setupProcessHandlers(): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', ErrorHandlerMiddleware.handleUnhandledRejection);

    // Handle uncaught exceptions
    process.on('uncaughtException', ErrorHandlerMiddleware.handleUncaughtException);

    // Graceful shutdown handlers
    const gracefulShutdown = ErrorHandlerMiddleware.gracefulShutdown(this.app);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }

  /**
   * Setup Express middlewares
   */
  private setupMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
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
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400 // 24 hours
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session configuration
    this.app.use(session({
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
    this.app.use(LoggingMiddleware.requestLogger({
      excludePaths: ['/health', '/favicon.ico'],
      logBody: process.env.NODE_ENV === 'development',
      logHeaders: process.env.NODE_ENV === 'development'
    }));

    // Security logging
    this.app.use(LoggingMiddleware.securityLogger);

    // Performance monitoring
    this.app.use(LoggingMiddleware.performanceLogger(2000)); // Log requests > 2 seconds

    // Global rate limiting
    if (process.env.NODE_ENV === 'production') {
      this.app.use(rateLimit({
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
  private setupDependencyInjection(): void {
    try {
      DIContainer.configure();
      
      if (process.env.NODE_ENV === 'development') {
        DIContainer.displayInfo();
      }

      // Validate container configuration
      if (!DIContainer.validate()) {
        throw new Error('Dependency injection container validation failed');
      }
    } catch (error) {
      console.error('Failed to setup dependency injection:', error);
      process.exit(1);
    }
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // API routes
    this.app.use('/api', new APIRouter().getRouter());

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
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
    this.app.get('/health', (_req: Request, res: Response) => {
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
  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', ErrorHandlerMiddleware.handleNotFound);

    // Error logging middleware
    this.app.use(LoggingMiddleware.errorLogger);

    // Global error handler (must be last)
    this.app.use(ErrorHandlerMiddleware.handleError);
  }

  /**
   * Get allowed CORS origins
   */
  private getAllowedOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001';
    return origins.split(',').map(origin => origin.trim());
  }

  /**
   * Initialize database connection
   */
  public async initializeDatabase(): Promise<void> {
    try {
      console.log('Initializing database connection...');
      await this.dbConnection.connect();
      console.log('✓ Database connection established');
    } catch (error) {
      console.error('✗ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize database first
      await this.initializeDatabase();

      // Setup dependency injection after database is connected
      this.setupDependencyInjection();

      // Setup routes after DI is configured
      this.setupRoutes();
      this.setupErrorHandling();

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
      const gracefulShutdown = (signal: string) => {
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
          } catch (dbError) {
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

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Get Express application instance
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Stop the server (mainly for testing)
   */
  public async stop(): Promise<void> {
    try {
      await this.dbConnection.disconnect();
      console.log('✓ Server stopped');
    } catch (error) {
      console.error('Error stopping server:', error);
      throw error;
    }
  }
}

export default App;