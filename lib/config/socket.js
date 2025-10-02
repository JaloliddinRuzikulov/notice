const { Server } = require('socket.io');
const DTMFHandler = require('../dtmf-handler');

/**
 * Configure Socket.IO server
 * @param {https.Server} server - HTTPS server instance
 * @param {number} port - Server port for CORS configuration
 * @returns {Server} Socket.IO server instance
 */
function configureSocketIO(server, port) {
    const io = new Server(server, {
        cors: {
            origin: [
                `https://172.27.64.10:${port}`,
                `https://localhost:${port}`,
                `https://10.105.1.45:${port}`,
                'https://172.27.64.10:8444',
                'https://localhost:8444'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Make io global for SIP backend
    global.io = io;

    // Initialize DTMF handler
    global.dtmfHandler = new DTMFHandler();

    // Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log('New Socket.IO connection:', socket.id);

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected:', socket.id);
        });
    });

    return io;
}

module.exports = { configureSocketIO };
