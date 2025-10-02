const express = require('express');
const https = require('https');
require('dotenv').config();

// Import configurations
const { configureExpress } = require('./lib/config/express');
const { configureSession } = require('./lib/config/session');
const { getHTTPSOptions } = require('./lib/config/ssl');
const { configureSocketIO } = require('./lib/config/socket');

// Import utilities
const { loadRoutes } = require('./lib/routes-loader');
const { setupErrorHandlers, setupGlobalErrorHandlers } = require('./lib/error-handlers');
const { startMemoryMonitoring } = require('./lib/monitoring');
const { setupShutdownHandlers, initializeSIPBackend, printStartupBanner } = require('./lib/server-lifecycle');

// Initialize database
const database = require('./lib/database');
database.initialize().then(() => {
    console.log('Database initialized successfully');
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8444;

// Configure Express middleware
configureExpress(app, PORT);

// Configure session
configureSession(app);

// Create HTTPS server
const httpsOptions = getHTTPSOptions();
const server = https.createServer(httpsOptions, app);

// Configure Socket.IO
configureSocketIO(server, PORT);

// Load all routes
loadRoutes(app);

// Setup error handlers
setupErrorHandlers(app);
setupGlobalErrorHandlers();

// Setup monitoring
startMemoryMonitoring();

// Setup graceful shutdown
setupShutdownHandlers(server);

// Start server
server.listen(PORT, '0.0.0.0', async () => {
    printStartupBanner(PORT);
    await initializeSIPBackend();
});
