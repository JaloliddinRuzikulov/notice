/**
 * Graceful shutdown handler
 * @param {https.Server} server - HTTPS server instance
 */
async function gracefulShutdown(server) {
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

/**
 * Setup shutdown handlers
 * @param {https.Server} server - HTTPS server instance
 */
function setupShutdownHandlers(server) {
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));
}

/**
 * Initialize SIP backend
 */
async function initializeSIPBackend() {
    const { getSIPBackend } = require('./sip-backend');
    const sipConfig = {
        username: process.env.SIP_USERNAME || '5530',
        password: process.env.SIP_PASSWORD || '554466asd',
        domain: process.env.SIP_DOMAIN || '10.105.0.3',
        instanceId: 'default'
    };
    global.sipBackend = await getSIPBackend(sipConfig);
    console.log('✅ Server started successfully with SIP enabled');
}

/**
 * Print server startup banner
 * @param {number} port - Server port
 */
function printStartupBanner(port) {
    console.log(`
========================================
Qashqadaryo IIB Xabarnoma Tizimi
========================================
HTTPS Server: https://0.0.0.0:${port}
Local access: https://localhost:${port}
Network access: https://172.27.64.10:${port}

Login ma'lumotlari .env faylida

WebSocket: wss://172.27.64.10:${port}/ws
========================================
    `);
}

module.exports = {
    setupShutdownHandlers,
    initializeSIPBackend,
    printStartupBanner
};
