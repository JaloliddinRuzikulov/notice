/**
 * Bidirectional RTP Handler
 * Handles both sending and receiving RTP streams with full DTMF support
 */

const dgram = require('dgram');
const EventEmitter = require('events');
const fs = require('fs');

class BidirectionalRTPHandler extends EventEmitter {
    constructor() {
        super();
        this.sessions = new Map();
        this.dtmfBuffer = new Map();
        this.stats = {
            packetsReceived: 0,
            packetsSent: 0,
            dtmfDetected: 0,
            errors: 0
        };
    }

    /**
     * Create a new RTP session
     */
    createSession(sessionId, localPort, remoteHost, remotePort) {
        console.log(`[BiRTP] Creating session ${sessionId} - Local:${localPort} -> Remote:${remoteHost}:${remotePort}`);
        
        if (this.sessions.has(sessionId)) {
            this.endSession(sessionId);
        }

        const socket = dgram.createSocket('udp4');
        const session = {
            id: sessionId,
            socket,
            localPort,
            remoteHost,
            remotePort,
            sequenceNumber: Math.floor(Math.random() * 65536),
            timestamp: Math.floor(Math.random() * 4294967296),
            ssrc: Math.floor(Math.random() * 4294967296),
            active: true,
            lastPacketTime: Date.now(),
            dtmfEvents: [],
            audioBuffer: [],
            receiveStats: {
                packets: 0,
                bytes: 0,
                dtmf: 0
            }
        };

        // Bind socket
        socket.bind(localPort, () => {
            console.log(`[BiRTP] Session ${sessionId} bound to port ${localPort}`);
        });

        // Handle incoming RTP packets
        socket.on('message', (msg, rinfo) => {
            if (!session.active) return;
            
            session.lastPacketTime = Date.now();
            session.receiveStats.packets++;
            session.receiveStats.bytes += msg.length;
            this.stats.packetsReceived++;

            // Process RTP packet
            this.processIncomingRTP(sessionId, msg, rinfo);
        });

        socket.on('error', (err) => {
            console.error(`[BiRTP] Socket error for session ${sessionId}:`, err.message);
            this.stats.errors++;
            this.emit('error', { sessionId, error: err });
        });

        this.sessions.set(sessionId, session);
        
        // Start keep-alive
        session.keepAlive = setInterval(() => {
            if (Date.now() - session.lastPacketTime > 30000) {
                console.log(`[BiRTP] Session ${sessionId} inactive, ending`);
                this.endSession(sessionId);
            }
        }, 10000);

        return session;
    }

    /**
     * Process incoming RTP packet
     */
    processIncomingRTP(sessionId, packet, rinfo) {
        if (packet.length < 12) return;

        // Parse RTP header
        const version = (packet[0] >> 6) & 0x03;
        if (version !== 2) return; // Not RTP v2

        const padding = (packet[0] >> 5) & 0x01;
        const extension = (packet[0] >> 4) & 0x01;
        const cc = packet[0] & 0x0F;
        const marker = (packet[1] >> 7) & 0x01;
        const payloadType = packet[1] & 0x7F;
        const sequenceNumber = packet.readUInt16BE(2);
        const timestamp = packet.readUInt32BE(4);
        const ssrc = packet.readUInt32BE(8);

        // Calculate header length
        let headerLength = 12 + (cc * 4);
        if (extension) {
            if (packet.length < headerLength + 4) return;
            const extensionLength = packet.readUInt16BE(headerLength + 2) * 4;
            headerLength += 4 + extensionLength;
        }

        if (packet.length < headerLength) return;
        const payload = packet.slice(headerLength);

        // Check for DTMF (RFC 2833/4733)
        if (payloadType === 101 || (payloadType >= 96 && payloadType <= 127)) {
            this.processDTMFPayload(sessionId, payload, payloadType, marker, timestamp);
        } else if (payloadType === 0 || payloadType === 8) {
            // Audio payload (PCMU/PCMA)
            this.processAudioPayload(sessionId, payload, payloadType);
        }

        // Emit raw packet event for debugging
        this.emit('rtp-packet', {
            sessionId,
            payloadType,
            sequenceNumber,
            timestamp,
            marker,
            size: packet.length,
            from: `${rinfo.address}:${rinfo.port}`
        });
    }

    /**
     * Process DTMF payload (RFC 2833/4733)
     */
    processDTMFPayload(sessionId, payload, payloadType, marker, timestamp) {
        if (payload.length < 4) return;

        const event = payload[0];
        const endOfEvent = (payload[1] & 0x80) !== 0;
        const volume = payload[1] & 0x3F;
        const duration = payload.readUInt16BE(2);

        // Convert event to digit
        let digit;
        if (event <= 9) {
            digit = event.toString();
        } else if (event === 10) {
            digit = '*';
        } else if (event === 11) {
            digit = '#';
        } else if (event >= 12 && event <= 15) {
            digit = String.fromCharCode(65 + event - 12); // A-D
        } else {
            return; // Invalid event
        }

        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Use timestamp to detect unique DTMF events
        const eventKey = `${timestamp}-${event}`;
        
        if (endOfEvent && !this.dtmfBuffer.has(eventKey)) {
            // New DTMF event detected
            this.dtmfBuffer.set(eventKey, true);
            
            // Clean old events
            setTimeout(() => {
                this.dtmfBuffer.delete(eventKey);
            }, 5000);

            session.receiveStats.dtmf++;
            this.stats.dtmfDetected++;

            console.log(`[BiRTP] 🎯 DTMF detected: '${digit}' (event=${event}, duration=${duration}ms, vol=${volume})`);

            // Store DTMF event
            const dtmfEvent = {
                digit,
                event,
                duration,
                volume,
                timestamp: Date.now(),
                rtpTimestamp: timestamp
            };
            
            session.dtmfEvents.push(dtmfEvent);
            
            // Emit DTMF event
            this.emit('dtmf', {
                sessionId,
                digit,
                duration,
                volume,
                method: 'rfc2833'
            });

            // Special handling for digit '1' - broadcast confirmation
            if (digit === '1') {
                this.emit('broadcast-confirmed', {
                    sessionId,
                    method: 'rfc2833-bidirectional',
                    timestamp: new Date()
                });
            }
        }
    }

    /**
     * Process audio payload
     */
    processAudioPayload(sessionId, payload, payloadType) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Store audio for analysis if needed
        if (session.audioBuffer.length < 1000) {
            session.audioBuffer.push({
                payload,
                payloadType,
                timestamp: Date.now()
            });
        }

        // Could implement inband DTMF detection here if needed
    }

    /**
     * Send RTP packet
     */
    sendRTP(sessionId, payload, payloadType = 0, marker = false) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.active) return;

        // Create RTP header
        const header = Buffer.alloc(12);
        
        // V=2, P=0, X=0, CC=0
        header[0] = 0x80;
        
        // M=marker, PT=payloadType
        header[1] = (marker ? 0x80 : 0x00) | (payloadType & 0x7F);
        
        // Sequence number
        header.writeUInt16BE(session.sequenceNumber, 2);
        session.sequenceNumber = (session.sequenceNumber + 1) & 0xFFFF;
        
        // Timestamp
        header.writeUInt32BE(session.timestamp, 4);
        
        // SSRC
        header.writeUInt32BE(session.ssrc, 8);
        
        // Combine header and payload
        const packet = Buffer.concat([header, payload]);
        
        // Send packet
        session.socket.send(packet, session.remotePort, session.remoteHost, (err) => {
            if (err) {
                console.error(`[BiRTP] Send error for session ${sessionId}:`, err.message);
                this.stats.errors++;
            } else {
                this.stats.packetsSent++;
            }
        });
    }

    /**
     * Send DTMF digit using RFC 2833
     */
    sendDTMF(sessionId, digit, duration = 250) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.active) return;

        console.log(`[BiRTP] Sending DTMF '${digit}' for session ${sessionId}`);

        // Convert digit to event
        let event;
        if (digit >= '0' && digit <= '9') {
            event = parseInt(digit);
        } else if (digit === '*') {
            event = 10;
        } else if (digit === '#') {
            event = 11;
        } else if (digit >= 'A' && digit <= 'D') {
            event = 12 + digit.charCodeAt(0) - 65;
        } else {
            console.error(`[BiRTP] Invalid DTMF digit: ${digit}`);
            return;
        }

        // RFC 2833 payload
        const payload = Buffer.alloc(4);
        payload[0] = event;
        payload[1] = 0x0A; // Volume = 10
        payload.writeUInt16BE(duration * 8, 2); // Duration in timestamp units

        // Send multiple packets
        let packetCount = 0;
        const interval = setInterval(() => {
            if (packetCount >= 5) {
                // Send final packet with end bit
                payload[1] = 0x8A; // End bit + Volume
                this.sendRTP(sessionId, payload, 101, true);
                clearInterval(interval);
            } else {
                this.sendRTP(sessionId, payload, 101, false);
                packetCount++;
            }
        }, 20);
    }

    /**
     * Stream audio file
     */
    async streamAudioFile(sessionId, filePath, sampleRate = 8000) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.active) return;

        console.log(`[BiRTP] Streaming audio file ${filePath} for session ${sessionId}`);

        try {
            const audioData = await fs.promises.readFile(filePath);
            
            // Skip WAV header if present
            let offset = 0;
            if (audioData.length > 44 && audioData.toString('ascii', 0, 4) === 'RIFF') {
                offset = 44;
            }

            const payloadSize = 160; // 20ms at 8kHz
            let position = offset;

            session.audioInterval = setInterval(() => {
                if (position >= audioData.length || !session.active) {
                    clearInterval(session.audioInterval);
                    console.log(`[BiRTP] Audio streaming completed for session ${sessionId}`);
                    this.emit('audio-complete', { sessionId });
                    return;
                }

                const chunk = audioData.slice(position, position + payloadSize);
                this.sendRTP(sessionId, chunk, 0, false);
                
                position += payloadSize;
                session.timestamp += payloadSize;
            }, 20); // 20ms intervals
        } catch (error) {
            console.error(`[BiRTP] Error streaming audio:`, error);
            this.emit('error', { sessionId, error });
        }
    }

    /**
     * Get session statistics
     */
    getSessionStats(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        return {
            active: session.active,
            localPort: session.localPort,
            remoteEndpoint: `${session.remoteHost}:${session.remotePort}`,
            packetsReceived: session.receiveStats.packets,
            bytesReceived: session.receiveStats.bytes,
            dtmfDetected: session.receiveStats.dtmf,
            dtmfEvents: session.dtmfEvents,
            lastActivity: new Date(session.lastPacketTime)
        };
    }

    /**
     * Get global statistics
     */
    getGlobalStats() {
        return {
            activeSessions: this.sessions.size,
            totalPacketsReceived: this.stats.packetsReceived,
            totalPacketsSent: this.stats.packetsSent,
            totalDTMFDetected: this.stats.dtmfDetected,
            totalErrors: this.stats.errors
        };
    }

    /**
     * End a session
     */
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        console.log(`[BiRTP] Ending session ${sessionId}`);
        
        session.active = false;
        
        if (session.keepAlive) {
            clearInterval(session.keepAlive);
        }
        
        if (session.audioInterval) {
            clearInterval(session.audioInterval);
        }
        
        if (session.socket) {
            session.socket.close();
        }
        
        this.sessions.delete(sessionId);
        this.emit('session-ended', { sessionId });
    }

    /**
     * End all sessions
     */
    endAllSessions() {
        console.log(`[BiRTP] Ending all ${this.sessions.size} sessions`);
        for (const sessionId of this.sessions.keys()) {
            this.endSession(sessionId);
        }
    }
}

module.exports = BidirectionalRTPHandler;