const EventEmitter = require('events');
const dgram = require('dgram');

/**
 * Alternative DTMF Detection System
 * Tries multiple methods to detect DTMF when Asterisk won't cooperate
 */
class AlternativeDTMFDetector extends EventEmitter {
    constructor() {
        super();
        this.activeCalls = new Map();
        this.dtmfSockets = [];
        this.detectionMethods = {
            sipInfo: 0,
            rfc2833: 0,
            inband: 0,
            timeout: 0
        };
    }

    /**
     * Start monitoring all possible DTMF sources
     */
    startMonitoring() {
        console.log('[ALT-DTMF] Starting alternative DTMF detection...');
        
        // 1. Monitor additional SIP ports
        const sipPorts = [5060, 5061, 5062, 5070, 5080];
        sipPorts.forEach(port => {
            try {
                const socket = dgram.createSocket('udp4');
                socket.on('message', (msg, rinfo) => {
                    this.processSIPMessage(msg, rinfo, port);
                });
                
                socket.on('error', (err) => {
                    if (err.code !== 'EADDRINUSE') {
                        console.error(`[ALT-DTMF] Socket error on port ${port}:`, err.message);
                    }
                });
                
                socket.bind(port, () => {
                    console.log(`[ALT-DTMF] Monitoring SIP port ${port}`);
                });
                
                this.dtmfSockets.push(socket);
            } catch (e) {
                // Port already in use
            }
        });
        
        // 2. Monitor extended RTP range
        const rtpPorts = [];
        for (let i = 10000; i <= 10020; i += 2) {
            rtpPorts.push(i);
        }
        
        rtpPorts.forEach(port => {
            try {
                const socket = dgram.createSocket('udp4');
                socket.on('message', (msg, rinfo) => {
                    this.processRTPPacket(msg, rinfo, port);
                });
                
                socket.bind(port, () => {
                    console.log(`[ALT-DTMF] Monitoring RTP port ${port}`);
                });
                
                this.dtmfSockets.push(socket);
            } catch (e) {
                // Port already in use
            }
        });
        
        // 3. Start timeout-based detection
        this.startTimeoutDetection();
        
        // 4. Monitor system logs for DTMF hints
        this.startLogMonitoring();
        
        console.log('[ALT-DTMF] Alternative detection started with', this.dtmfSockets.length, 'sockets');
    }

    /**
     * Process SIP messages for DTMF
     */
    processSIPMessage(msg, rinfo, port) {
        const message = msg.toString();
        
        // Look for INFO method
        if (message.includes('INFO sip:')) {
            console.log(`[ALT-DTMF] INFO message detected on port ${port} from ${rinfo.address}`);
            
            // Check for DTMF signals
            if (message.match(/Signal=(\d+)/i) || 
                message.match(/dtmf.*?(\d)/i) ||
                message.includes('application/dtmf')) {
                
                const digit = this.extractDTMFDigit(message);
                if (digit) {
                    console.log(`[ALT-DTMF] 🎯 DTMF '${digit}' detected via SIP INFO!`);
                    this.detectionMethods.sipInfo++;
                    this.emitDTMF(digit, 'sip-info-alt', rinfo);
                }
            }
        }
        
        // Also check NOTIFY messages
        if (message.includes('NOTIFY') && message.includes('telephone-event')) {
            console.log(`[ALT-DTMF] NOTIFY with telephone-event detected`);
            const digit = this.extractDTMFDigit(message);
            if (digit) {
                this.emitDTMF(digit, 'sip-notify', rinfo);
            }
        }
    }

    /**
     * Process RTP packets for RFC 2833 DTMF
     */
    processRTPPacket(msg, rinfo, port) {
        if (msg.length < 12) return;
        
        const payloadType = msg[1] & 0x7F;
        
        // Check all possible DTMF payload types
        if ((payloadType >= 96 && payloadType <= 127) || payloadType === 101) {
            const payload = msg.slice(12);
            
            if (payload.length >= 4) {
                const event = payload[0];
                const endBit = (payload[1] & 0x80) !== 0;
                
                // Only process valid DTMF events on end bit
                if (event <= 15 && endBit) {
                    const digit = event <= 9 ? event.toString() :
                                 event === 10 ? '*' :
                                 event === 11 ? '#' :
                                 String.fromCharCode(65 + event - 12);
                    
                    console.log(`[ALT-DTMF] 🎯 RFC 2833 DTMF '${digit}' detected on port ${port}!`);
                    this.detectionMethods.rfc2833++;
                    this.emitDTMF(digit, 'rfc2833-alt', rinfo);
                }
            }
        }
    }

    /**
     * Extract DTMF digit from various formats
     */
    extractDTMFDigit(message) {
        // Try different patterns
        const patterns = [
            /Signal=(\d+)/i,
            /digit.*?(\d)/i,
            /dtmf.*?(\d)/i,
            /Content-Type:.*dtmf.*?\r\n\r\n(\d)/s,
            /\r\n\r\n(\d)\r\n/
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }

    /**
     * Timeout-based detection for calls
     */
    startTimeoutDetection() {
        // If audio plays for full duration without hangup, assume confirmation
        setInterval(() => {
            for (const [callId, call] of this.activeCalls) {
                if (!call.dtmfDetected && Date.now() - call.startTime > 30000) {
                    console.log(`[ALT-DTMF] Timeout detection for call ${callId}`);
                    this.detectionMethods.timeout++;
                    // Don't emit false DTMF, just log
                }
            }
        }, 5000);
    }

    /**
     * Monitor system logs
     */
    startLogMonitoring() {
        const { spawn } = require('child_process');
        
        // Monitor syslog for Asterisk DTMF messages
        try {
            const tail = spawn('tail', ['-f', '/var/log/syslog']);
            tail.stdout.on('data', (data) => {
                const log = data.toString();
                if (log.includes('DTMF') || log.includes('dtmf')) {
                    console.log(`[ALT-DTMF] System log DTMF hint:`, log.trim());
                }
            });
        } catch (e) {
            // Syslog not available
        }
    }

    /**
     * Register a call for monitoring
     */
    registerCall(callId, phoneNumber, broadcastId) {
        console.log(`[ALT-DTMF] Registering call ${callId} for ${phoneNumber}`);
        this.activeCalls.set(callId, {
            phoneNumber,
            broadcastId,
            startTime: Date.now(),
            dtmfDetected: false
        });
    }

    /**
     * Emit DTMF event
     */
    emitDTMF(digit, method, source) {
        console.log(`[ALT-DTMF] emitDTMF called: digit=${digit}, method=${method}, activeCalls=${this.activeCalls.size}`);
        
        // If no active calls tracked, still emit the event for any listener
        if (this.activeCalls.size === 0) {
            console.log('[ALT-DTMF] No active calls tracked, emitting generic DTMF event');
            this.emit('dtmf-detected', {
                callId: 'unknown',
                digit,
                method,
                phoneNumber: 'unknown',
                broadcastId: 'unknown',
                source: source ? `${source.address}:${source.port}` : 'unknown',
                timestamp: new Date()
            });
            
            // Special handling for digit '1' - emit generic confirmation
            if (digit === '1') {
                this.emit('broadcast-confirmed-alt', {
                    callId: 'unknown',
                    phoneNumber: 'unknown',
                    broadcastId: 'unknown',
                    method,
                    timestamp: new Date()
                });
            }
            return;
        }
        
        // Find matching call
        for (const [callId, call] of this.activeCalls) {
            if (!call.dtmfDetected) {
                call.dtmfDetected = true;
                
                this.emit('dtmf-detected', {
                    callId,
                    digit,
                    method,
                    phoneNumber: call.phoneNumber,
                    broadcastId: call.broadcastId,
                    source: source ? `${source.address}:${source.port}` : 'unknown',
                    timestamp: new Date()
                });
                
                // Special handling for digit '1'
                if (digit === '1') {
                    this.emit('broadcast-confirmed-alt', {
                        callId,
                        phoneNumber: call.phoneNumber,
                        broadcastId: call.broadcastId,
                        method,
                        timestamp: new Date()
                    });
                }
                
                break; // Only match first call
            }
        }
    }

    /**
     * Unregister a call
     */
    unregisterCall(callId) {
        this.activeCalls.delete(callId);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            activeCalls: this.activeCalls.size,
            detectionMethods: this.detectionMethods,
            sockets: this.dtmfSockets.length
        };
    }

    /**
     * Stop monitoring
     */
    stop() {
        console.log('[ALT-DTMF] Stopping alternative detection...');
        this.dtmfSockets.forEach(socket => {
            try {
                socket.close();
            } catch (e) {
                // Already closed
            }
        });
        this.dtmfSockets = [];
    }
}

module.exports = AlternativeDTMFDetector;