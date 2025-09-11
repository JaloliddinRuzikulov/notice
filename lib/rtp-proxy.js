/**
 * Simple RTP/SRTP Proxy for SIP Audio
 * Bridges backend UDP SIP audio to WebRTC frontend
 */

const dgram = require('dgram');
const crypto = require('crypto');
const EventEmitter = require('events');

class RTPProxy extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = {
            localRTPPort: config.localRTPPort || 10000,
            localRTCPPort: config.localRTCPPort || 10001,
            ...config
        };
        
        this.sessions = new Map();
        this.rtpSocket = null;
        this.rtcpSocket = null;
    }
    
    async initialize() {
        // Create RTP socket
        this.rtpSocket = dgram.createSocket('udp4');
        this.rtpSocket.on('message', this.handleRTPPacket.bind(this));
        
        // Create RTCP socket
        this.rtcpSocket = dgram.createSocket('udp4');
        this.rtcpSocket.on('message', this.handleRTCPPacket.bind(this));
        
        // Bind sockets
        await new Promise((resolve, reject) => {
            this.rtpSocket.bind(this.config.localRTPPort, (err) => {
                if (err) reject(err);
                else {
                    console.log(`RTP Proxy listening on port ${this.config.localRTPPort}`);
                    resolve();
                }
            });
        });
        
        await new Promise((resolve, reject) => {
            this.rtcpSocket.bind(this.config.localRTCPPort, (err) => {
                if (err) reject(err);
                else {
                    console.log(`RTCP Proxy listening on port ${this.config.localRTCPPort}`);
                    resolve();
                }
            });
        });
    }
    
    createSession(sessionId, remoteIP, remoteRTPPort) {
        const session = {
            id: sessionId,
            remoteIP: remoteIP,
            remoteRTPPort: remoteRTPPort,
            remoteRTCPPort: remoteRTPPort + 1,
            stats: {
                packetsReceived: 0,
                packetsSent: 0,
                bytesReceived: 0,
                bytesSent: 0,
                lastActivity: Date.now()
            },
            webrtcConnection: null
        };
        
        this.sessions.set(sessionId, session);
        console.log(`RTP session created: ${sessionId} -> ${remoteIP}:${remoteRTPPort}`);
        
        return session;
    }
    
    handleRTPPacket(msg, rinfo) {
        // Find session by remote address
        let session = null;
        for (const [id, s] of this.sessions) {
            if (s.remoteIP === rinfo.address && s.remoteRTPPort === rinfo.port) {
                session = s;
                break;
            }
        }
        
        if (!session) {
            // Create new session if needed
            const sessionId = crypto.randomBytes(8).toString('hex');
            session = this.createSession(sessionId, rinfo.address, rinfo.port);
        }
        
        // Update stats
        session.stats.packetsReceived++;
        session.stats.bytesReceived += msg.length;
        session.stats.lastActivity = Date.now();
        
        // Parse RTP header
        const rtpHeader = this.parseRTPHeader(msg);
        
        // Emit event for WebRTC to handle
        this.emit('rtp-packet', {
            sessionId: session.id,
            packet: msg,
            header: rtpHeader,
            remoteInfo: rinfo
        });
        
        // Log every 100 packets
        if (session.stats.packetsReceived % 100 === 0) {
            console.log(`RTP session ${session.id}: ${session.stats.packetsReceived} packets received`);
        }
    }
    
    handleRTCPPacket(msg, rinfo) {
        // Similar to RTP but for control packets
        this.emit('rtcp-packet', {
            packet: msg,
            remoteInfo: rinfo
        });
    }
    
    parseRTPHeader(buffer) {
        if (buffer.length < 12) return null;
        
        const header = {
            version: (buffer[0] >> 6) & 0x03,
            padding: (buffer[0] >> 5) & 0x01,
            extension: (buffer[0] >> 4) & 0x01,
            csrcCount: buffer[0] & 0x0f,
            marker: (buffer[1] >> 7) & 0x01,
            payloadType: buffer[1] & 0x7f,
            sequenceNumber: buffer.readUInt16BE(2),
            timestamp: buffer.readUInt32BE(4),
            ssrc: buffer.readUInt32BE(8)
        };
        
        return header;
    }
    
    sendRTPPacket(sessionId, packet, remoteIP, remotePort) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        this.rtpSocket.send(packet, remotePort, remoteIP, (err) => {
            if (!err) {
                session.stats.packetsSent++;
                session.stats.bytesSent += packet.length;
            }
        });
    }
    
    bridgeToWebRTC(sessionId, webrtcConnection) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;
        
        session.webrtcConnection = webrtcConnection;
        console.log(`Session ${sessionId} bridged to WebRTC`);
        
        return true;
    }
    
    getSessionStats(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? session.stats : null;
    }
    
    removeSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            console.log(`Removing RTP session: ${sessionId}`);
            this.sessions.delete(sessionId);
        }
    }
    
    cleanup() {
        // Remove inactive sessions
        const now = Date.now();
        const timeout = 60000; // 1 minute
        
        for (const [id, session] of this.sessions) {
            if (now - session.stats.lastActivity > timeout) {
                this.removeSession(id);
            }
        }
    }
    
    close() {
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        if (this.rtcpSocket) {
            this.rtcpSocket.close();
        }
        this.sessions.clear();
    }
}

module.exports = RTPProxy;