const express = require('express');
const https = require('https');
require('dotenv').config();

// Import configurations
const { configureExpress } = require('./lib/config/express');
const { configureSession } = require('./lib/config/session');
const { getHTTPSOptions } = require('./lib/config/ssl');
const { configureSocketIO } = require('./lib/config/socket');

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

// Import middleware
const { auth, requirePermission } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// ==================== ROUTES ====================

// Auth routes (login, logout)
app.use('/', require('./routes/auth'));

// View routes (pages)
app.use('/', require('./routes/views'));

// Special API routes
app.use('/api', require('./routes/api/special'));

// Main API routes
app.use('/api/sip', auth, requirePermission('sipPhone'), require('./routes/sip'));
app.use('/api/sip-accounts', auth, require('./routes/sip-accounts'));
app.use('/api/broadcast', auth, requirePermission('broadcast'), require('./routes/broadcast-simple'));

// Use database version for production, JSON version as fallback
const useDatabase = false; // process.env.USE_DATABASE !== 'false';
console.log('[SERVER] Using employees route:', useDatabase ? 'employees-db' : 'employees');
app.use('/api/employees', auth, requirePermission('employees'),
    require(useDatabase ? './routes/employees-db' : './routes/employees'));

app.use('/api/groups', auth, requirePermission('groups'), require('./routes/groups'));
app.use('/api/departments', auth, requirePermission('departments'), require('./routes/departments'));
app.use('/api/districts', auth, requirePermission('districts'), require('./routes/districts'));
app.use('/api/users', auth, requirePermission('users'), require('./routes/users'));
app.use('/api/test', auth, require('./routes/test'));
app.use('/api/excel-template', auth, require('./routes/excel-template'));
app.use('/api/phonebook', auth, requirePermission('phonebook'), require('./routes/phonebook'));
app.use('/api/system', auth, requirePermission('reports'), require('./routes/system-stats'));
app.use('/api/test-auth', require('./routes/test-auth'));

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ==================== ERROR HANDLING ====================

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// ==================== MONITORING ====================

// Memory monitoring (every 5 minutes)
setInterval(() => {
    const usage = process.memoryUsage();
    console.log('[MEMORY]', new Date().toISOString(), {
        rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
    });
}, 300000);

// ==================== GRACEFUL SHUTDOWN ====================

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    console.log('\n[SHUTDOWN] Graceful shutdown initiated...');

    // Stop accepting new connections
    server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed');
    });

    // Clean up resources
    if (global.wsToUdpProxy) {
        global.wsToUdpProxy.closeAll();
        console.log('[SHUTDOWN] WebSocket proxy cleaned up');
    }

    if (global.sipBackend) {
        global.sipBackend.destroy();
        console.log('[SHUTDOWN] SIP backend destroyed');
    }

    // Close Socket.IO
    if (global.io) {
        global.io.close();
        console.log('[SHUTDOWN] Socket.IO closed');
    }

    // Wait a bit for cleanup
    setTimeout(() => {
        console.log('[SHUTDOWN] Process exiting...');
        process.exit(0);
    }, 2000);
}

// ==================== START SERVER ====================

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`
========================================
Qashqadaryo IIB Xabarnoma Tizimi
========================================
HTTPS Server: https://0.0.0.0:${PORT}
Local access: https://localhost:${PORT}
Network access: https://172.27.64.10:${PORT}

Login ma'lumotlari .env faylida

WebSocket: wss://172.27.64.10:${PORT}/ws
========================================
    `);

    // Initialize SIP backend
    const { getSIPBackend } = require('./lib/sip-backend');
    const sipConfig = {
        username: process.env.SIP_USERNAME || '5530',
        password: process.env.SIP_PASSWORD || '554466asd',
        domain: process.env.SIP_DOMAIN || '10.105.0.3',
        instanceId: 'default'
    };
    global.sipBackend = await getSIPBackend(sipConfig);
    console.log('✅ Server started successfully with SIP enabled');
});
