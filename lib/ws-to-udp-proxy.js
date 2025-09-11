/**
 * WebSocket to UDP Proxy for SIP
 * Bridges WebRTC SIP (WebSocket) to Asterisk (UDP)
 */

const WebSocket = require('ws');
const dgram = require('dgram');
const crypto = require('crypto');

class WSToUDPProxy {
    constructor(config) {
        this.config = {
            asteriskHost: config.asteriskHost || '10.105.0.3',
            asteriskPort: config.asteriskPort || 5060,
            localPort: config.localPort || 0,
            ...config
        };
        
        this.connections = new Map();
        this.udpSocket = dgram.createSocket('udp4');
    }
    
    initialize(wss) {
        // Setup UDP socket
        this.udpSocket.on('message', this.handleUDPMessage.bind(this));
        this.udpSocket.on('error', (err) => {
            console.error('UDP Socket error:', err);
        });
        
        this.udpSocket.bind(this.config.localPort, () => {
            console.log(`UDP proxy listening on port ${this.udpSocket.address().port}`);
        });
        
        // Handle WebSocket connections
        wss.on('connection', this.handleWSConnection.bind(this));
        
        console.log('WebSocket to UDP proxy initialized');
    }
    
    handleWSConnection(ws, req) {
        const connectionId = crypto.randomBytes(8).toString('hex');
        console.log(`New WebSocket connection: ${connectionId} from ${req.socket.remoteAddress}`);
        
        const connection = {
            id: connectionId,
            ws: ws,
            remoteAddress: req.socket.remoteAddress,
            lastActivity: Date.now()
        };
        
        this.connections.set(connectionId, connection);
        
        // WebSocket message handler
        ws.on('message', (data) => {
            this.handleWSMessage(connectionId, data);
        });
        
        // WebSocket close handler
        ws.on('close', () => {
            console.log(`WebSocket closed: ${connectionId}`);
            this.connections.delete(connectionId);
        });
        
        // WebSocket error handler
        ws.on('error', (err) => {
            console.error(`WebSocket error ${connectionId}:`, err);
        });
        
        // Send initial response
        ws.send('SIP/2.0 100 Trying\r\n\r\n');
    }
    
    handleWSMessage(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        connection.lastActivity = Date.now();
        
        try {
            let message = data.toString();
            console.log(`WS->UDP [${connectionId}]:`, message.split('\r\n')[0]);
            
            // Modify headers for UDP transport
            message = this.modifyForUDP(message, connection);
            
            // Send to Asterisk via UDP
            const buffer = Buffer.from(message);
            this.udpSocket.send(buffer, this.config.asteriskPort, this.config.asteriskHost, (err) => {
                if (err) {
                    console.error('UDP send error:', err);
                } else {
                    console.log(`Sent to Asterisk: ${this.config.asteriskHost}:${this.config.asteriskPort}`);
                }
            });
            
        } catch (error) {
            console.error('WS message handling error:', error);
        }
    }
    
    handleUDPMessage(msg, rinfo) {
        console.log(`UDP->WS from ${rinfo.address}:${rinfo.port}:`, msg.toString().split('\r\n')[0]);
        
        try {
            let message = msg.toString();
            
            // Find matching WebSocket connection
            const connection = this.findConnectionForMessage(message);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
                // Modify headers for WebSocket transport
                message = this.modifyForWS(message);
                
                // Send to WebSocket client
                connection.ws.send(message);
                console.log(`Relayed to WS client: ${connection.id}`);
            } else {
                console.log('No matching WebSocket connection found');
            }
            
        } catch (error) {
            console.error('UDP message handling error:', error);
        }
    }
    
    modifyForUDP(message, connection) {
        const lines = message.split('\r\n');
        const modified = [];
        
        for (let line of lines) {
            // Update Via header
            if (line.startsWith('Via:')) {
                // Add received and rport parameters
                const localAddr = this.getLocalAddress();
                line = line.replace(/;rport/, `;rport=${connection.ws._socket.remotePort};received=${connection.remoteAddress}`);
                
                // Add branch if missing
                if (!line.includes('branch=')) {
                    line += ';branch=z9hG4bK' + crypto.randomBytes(8).toString('hex');
                }
            }
            
            // Update Contact header
            if (line.startsWith('Contact:')) {
                const match = line.match(/<sip:([^@]+)@([^>]+)>/);
                if (match) {
                    const user = match[1];
                    const localAddr = this.getLocalAddress();
                    const localPort = this.udpSocket.address().port;
                    line = `Contact: <sip:${user}@${localAddr}:${localPort};transport=udp>`;
                }
            }
            
            // Remove WebSocket specific headers
            if (line.startsWith('Sec-WebSocket-') || 
                line.startsWith('Upgrade:') || 
                line.startsWith('Connection:')) {
                continue;
            }
            
            modified.push(line);
        }
        
        return modified.join('\r\n');
    }
    
    modifyForWS(message) {
        const lines = message.split('\r\n');
        const modified = [];
        
        for (let line of lines) {
            // Update Via to show WebSocket transport
            if (line.startsWith('Via:')) {
                line = line.replace(/transport=udp/i, 'transport=ws');
            }
            
            // Update Contact for WebSocket
            if (line.startsWith('Contact:')) {
                line = line.replace(/transport=udp/i, 'transport=ws');
            }
            
            modified.push(line);
        }
        
        return modified.join('\r\n');
    }
    
    findConnectionForMessage(message) {
        // Try to find connection by Call-ID or From tag
        const callIdMatch = message.match(/Call-ID:\s*([^\r\n]+)/i);
        const fromMatch = message.match(/From:.*tag=([^\s;]+)/i);
        
        if (callIdMatch || fromMatch) {
            // For now, return the first active connection
            // In production, maintain a mapping of Call-ID to connection
            for (const [id, conn] of this.connections) {
                if (Date.now() - conn.lastActivity < 300000) { // 5 minutes
                    return conn;
                }
            }
        }
        
        return null;
    }
    
    getLocalAddress() {
        const interfaces = require('os').networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }
    
    // Cleanup old connections
    cleanup() {
        const now = Date.now();
        for (const [id, conn] of this.connections) {
            if (now - conn.lastActivity > 60000) { // 1 minute (reduced from 5 minutes)
                console.log(`Cleaning up inactive connection: ${id}`);
                if (conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.close();
                }
                // Close UDP socket if exists
                if (conn.udpSocket) {
                    conn.udpSocket.close();
                }
                this.connections.delete(id);
            }
        }
    }
    
    // Add method to close all connections (for graceful shutdown)
    closeAll() {
        console.log('[WSToUDPProxy] Closing all connections...');
        for (const [id, conn] of this.connections) {
            if (conn.ws.readyState === WebSocket.OPEN) {
                conn.ws.close();
            }
            if (conn.udpSocket) {
                conn.udpSocket.close();
            }
        }
        this.connections.clear();
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

module.exports = WSToUDPProxy;