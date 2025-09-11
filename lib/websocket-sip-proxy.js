const WebSocket = require('ws');
const dgram = require('dgram');
const crypto = require('crypto');

class WebSocketSIPProxy {
    constructor(server) {
        this.wss = new WebSocket.Server({ 
            server: server,
            path: '/ws',
            perMessageDeflate: false
        });
        
        this.sipServer = process.env.SIP_SERVER || '10.105.0.3';
        this.sipPort = 5060;
        this.connections = new Map();
        
        this.wss.on('connection', this.handleConnection.bind(this));
        console.log('WebSocket SIP Proxy initialized on /ws');
        
        // Clean up inactive connections periodically
        setInterval(() => {
            this.connections.forEach((conn, id) => {
                if (Date.now() - conn.lastActivity > 300000) { // 5 minutes
                    console.log('Cleaning up inactive connection:', id);
                    if (conn.ws.readyState === WebSocket.OPEN) {
                        conn.ws.close();
                    }
                    if (conn.udpSocket) {
                        conn.udpSocket.close();
                    }
                    this.connections.delete(id);
                }
            });
        }, 60000);
    }

    handleConnection(ws, req) {
        const connectionId = crypto.randomBytes(8).toString('hex');
        const clientIP = req.socket.remoteAddress;
        console.log(`New WebSocket connection: ${connectionId} from ${clientIP}`);
        
        // Create UDP socket for this WebSocket connection
        const udpSocket = dgram.createSocket('udp4');
        let localPort = null;
        
        // Store connection info
        const connection = {
            ws: ws,
            udpSocket: udpSocket,
            lastActivity: Date.now(),
            clientIP: clientIP
        };
        
        this.connections.set(connectionId, connection);
        
        // Bind to random port
        udpSocket.bind(0, () => {
            localPort = udpSocket.address().port;
            console.log(`UDP socket bound to port ${localPort} for connection ${connectionId}`);
        });
        
        // Forward UDP messages to WebSocket
        udpSocket.on('message', (msg, rinfo) => {
            connection.lastActivity = Date.now();
            
            if (ws.readyState === WebSocket.OPEN) {
                let message = msg.toString();
                console.log(`UDP->WS from ${rinfo.address}:${rinfo.port}: ${message.split('\r\n')[0]}`);
                
                // Fix Via header issues
                if (message.includes('Via:')) {
                    // Remove rport and received parameters that cause mismatch
                    message = message.replace(/;rport=\d+/g, '');
                    message = message.replace(/;received=[^;,\s]+/g, '');
                }
                
                // Handle 100 Trying without headers
                if (message.startsWith('SIP/2.0 100 Trying') && message.split('\r\n').length < 3) {
                    console.log('Fixing incomplete 100 Trying response');
                    // Skip this response as it's malformed
                    return;
                }
                
                ws.send(message);
                console.log(`Relayed to WS client: ${connectionId}`);
            }
        });
        
        // Forward WebSocket messages to UDP
        ws.on('message', (data) => {
            connection.lastActivity = Date.now();
            const message = data.toString();
            console.log(`WS->UDP [${connectionId}]: ${message.split('\r\n')[0]}`);
            
            // Send to SIP server
            udpSocket.send(data, this.sipPort, this.sipServer, (err) => {
                if (err) {
                    console.error('UDP send error:', err);
                } else {
                    console.log(`Sent to Asterisk: ${this.sipServer}:${this.sipPort}`);
                }
            });
        });
        
        ws.on('close', () => {
            console.log(`WebSocket closed: ${connectionId}`);
            udpSocket.close();
            this.connections.delete(connectionId);
        });
        
        ws.on('error', (err) => {
            console.error(`WebSocket error on ${connectionId}:`, err);
            udpSocket.close();
            this.connections.delete(connectionId);
        });
        
        // Send keep-alive pings
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            } else {
                clearInterval(pingInterval);
            }
        }, 30000);
    }
}

module.exports = WebSocketSIPProxy;