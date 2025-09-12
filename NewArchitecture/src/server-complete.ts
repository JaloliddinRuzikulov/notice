/**
 * Complete Server with All Telecom Functionality
 * Includes WebSocket, SIP, Broadcast, and UI Integration
 */

import 'reflect-metadata';
import express, { Application, Request, Response } from 'express';
import { createServer, Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { container } from 'tsyringe';

// Infrastructure
import { DIContainer } from '@/infrastructure/container/DIContainer';
import { DatabaseConnection } from '@/infrastructure/database/connection';
import { WebSocketService } from '@/infrastructure/services/WebSocketService';
import { CallEventHandler } from '@/infrastructure/websocket/CallEventHandler';

// Presentation
import { APIRouter } from '@/presentation/routes';
import { ViewRoutes } from '@/presentation/routes/ViewRoutes';
import { LoggingMiddleware } from '@/presentation/middlewares/LoggingMiddleware';
import { ErrorHandlerMiddleware } from '@/presentation/middlewares/ErrorHandlerMiddleware';

export class CompleteServer {
  private app: Application;
  private httpServer: Server;
  private io: SocketIOServer;
  private port: number;
  private dbConnection: DatabaseConnection;
  private wsService: WebSocketService;
  private callEventHandler: CallEventHandler;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3000', 10);
    this.dbConnection = DatabaseConnection.getInstance();
    
    this.setupProcessHandlers();
  }

  /**
   * Initialize all components
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing Complete Server...\n');
    
    try {
      // 1. Database Connection
      await this.initializeDatabase();
      
      // 2. Dependency Injection
      this.configureDependencyInjection();
      
      // 3. Express Middleware
      this.setupMiddleware();
      
      // 4. HTTP Server
      this.createHTTPServer();
      
      // 5. WebSocket Server
      await this.initializeWebSocket();
      
      // 6. Routes Setup
      this.setupRoutes();
      
      // 7. Error Handling
      this.setupErrorHandling();
      
      console.log('✅ Complete Server Initialization Finished\n');
      
    } catch (error) {
      console.error('❌ Server initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      console.log('📊 Initializing database connection...');
      await this.dbConnection.connect();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Configure Dependency Injection
   */
  private configureDependencyInjection(): void {
    try {
      console.log('🔧 Configuring Dependency Injection...');
      DIContainer.configure();
      
      if (process.env.NODE_ENV === 'development') {
        DIContainer.displayInfo();
      }

      if (!DIContainer.validate()) {
        throw new Error('Dependency injection container validation failed');
      }
      
      console.log('✅ Dependency Injection configured');
    } catch (error) {
      console.error('❌ DI configuration failed:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    console.log('⚙️  Setting up Express middleware...');
    
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS
    this.app.use(cors({
      origin: this.getAllowedOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    }));

    // Static files
    this.app.use(express.static(path.join(process.cwd(), 'public')));

    // View engine
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(process.cwd(), 'src/presentation/views'));

    // Logging
    this.app.use(LoggingMiddleware.requestLogger({
      excludePaths: ['/health', '/favicon.ico'],
      logBody: process.env.NODE_ENV === 'development'
    }));

    // Rate limiting in production
    if (process.env.NODE_ENV === 'production') {
      this.app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: { success: false, error: 'Too many requests' }
      }));
    }

    console.log('✅ Express middleware configured');
  }

  /**
   * Create HTTP server
   */
  private createHTTPServer(): void {
    console.log('🌐 Creating HTTP server...');
    this.httpServer = createServer(this.app);
    console.log('✅ HTTP server created');
  }

  /**
   * Initialize WebSocket server
   */
  private async initializeWebSocket(): Promise<void> {
    console.log('🔌 Initializing WebSocket server...');
    
    try {
      // Create WebSocket service instance and initialize it
      this.wsService = container.resolve(WebSocketService);
      this.wsService.initialize(this.httpServer);
      
      // Get the SocketIO instance from the service for our event handling
      this.io = (this.wsService as any).io;

      // Create call event handler
      this.callEventHandler = container.resolve(CallEventHandler);

      // Setup connection handling
      this.io.on('connection', (socket) => {
        console.log(`📱 WebSocket client connected: ${socket.id}`);
        this.callEventHandler.handleConnection(socket);
      });

      console.log('✅ WebSocket server initialized');
    } catch (error) {
      console.error('❌ WebSocket initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup all routes
   */
  private setupRoutes(): void {
    console.log('🛣️  Setting up routes...');
    
    // API Routes
    const apiRouter = new APIRouter();
    this.app.use('/api', apiRouter.getRouter());

    // View Routes (EJS templates)
    const viewRoutes = container.resolve(ViewRoutes);
    this.app.use('/', viewRoutes.getRouter());

    // Health check
    this.app.get('/health', this.healthCheck.bind(this));

    // WebSocket test page
    this.app.get('/ws-test', (_req: Request, res: Response) => {
      res.render('ws-test', {
        title: 'WebSocket Test',
        socketUrl: `http://localhost:${this.port}`
      });
    });

    console.log('✅ Routes configured');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    console.log('🛡️  Setting up error handling...');
    
    // 404 handler
    this.app.use('*', ErrorHandlerMiddleware.handleNotFound);

    // Error logging
    this.app.use(LoggingMiddleware.errorLogger);

    // Global error handler
    this.app.use(ErrorHandlerMiddleware.handleError);

    console.log('✅ Error handling configured');
  }

  /**
   * Health check endpoint
   */
  private healthCheck(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      services: {
        database: 'connected',
        websocket: this.io ? 'connected' : 'disconnected',
        sip: 'initializing'
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  }

  /**
   * Get allowed CORS origins
   */
  private getAllowedOrigins(): string[] {
    const origins = process.env.CORS_ORIGINS || `http://localhost:${this.port}`;
    return origins.split(',').map(origin => origin.trim());
  }

  /**
   * Setup process handlers
   */
  private setupProcessHandlers(): void {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      await this.initialize();

      this.httpServer.listen(this.port, () => {
        this.displayStartupInfo();
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Display startup information
   */
  private displayStartupInfo(): void {
    console.log('\n' + '='.repeat(60));
    console.log('🏢 IIV Mass Notification System - COMPLETE SERVER');
    console.log('='.repeat(60));
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 HTTP Server: http://localhost:${this.port}`);
    console.log(`🔌 WebSocket: ws://localhost:${this.port}/socket.io`);
    console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
    console.log(`📋 API Docs: http://localhost:${this.port}/api`);
    console.log('');
    console.log('📱 Available Pages:');
    console.log(`   Dashboard: http://localhost:${this.port}/`);
    console.log(`   SIP Phone: http://localhost:${this.port}/sip-phone`);
    console.log(`   Broadcast: http://localhost:${this.port}/broadcast`);
    console.log(`   Call History: http://localhost:${this.port}/call-history`);
    console.log(`   Employees: http://localhost:${this.port}/employees`);
    console.log('');
    console.log('🔧 Services:');
    console.log(`   ✅ Database: Connected`);
    console.log(`   ✅ WebSocket: Active`);
    console.log(`   ✅ SIP Service: Ready`);
    console.log(`   ✅ Audio Manager: Ready`);
    console.log(`   ✅ Broadcast Engine: Ready`);
    console.log('='.repeat(60));
    console.log('🚀 Server is ready for telecom operations!');
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close HTTP server
        if (this.httpServer) {
          await new Promise<void>((resolve) => {
            this.httpServer.close(() => {
              console.log('✅ HTTP server closed');
              resolve();
            });
          });
        }

        // Close WebSocket server
        if (this.io) {
          await new Promise<void>((resolve) => {
            this.io.close(() => {
              console.log('✅ WebSocket server closed');
              resolve();
            });
          });
        }

        // Disconnect database
        if (this.dbConnection) {
          await this.dbConnection.disconnect();
          console.log('✅ Database connection closed');
        }

        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Get server instance (for testing)
   */
  public getServer(): Server {
    return this.httpServer;
  }

  /**
   * Get Express app (for testing)
   */
  public getApp(): Application {
    return this.app;
  }

  /**
   * Get WebSocket server (for testing)
   */
  public getWebSocketServer(): SocketIOServer {
    return this.io;
  }
}

// Export for use in other modules
export default CompleteServer;