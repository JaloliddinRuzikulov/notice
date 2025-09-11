const EventEmitter = require('events');

class DTMFHandler extends EventEmitter {
    constructor() {
        super();
        this.activeCalls = new Map();
        this.dtmfHistory = new Map();
    }

    // Register a call for DTMF detection
    registerCall(callId, phoneNumber, broadcastId, employeeId) {
        console.log(`[DTMF] Registering call ${callId} for ${phoneNumber}`);
        this.activeCalls.set(callId, {
            phoneNumber,
            broadcastId,
            employeeId,
            startTime: Date.now(),
            dtmfDetected: false
        });
    }

    // Handle RFC 2833/4733 DTMF (RTP telephone-event)
    handleRFC2833(rtpPacket, callId) {
        if (!rtpPacket || rtpPacket.length < 16) return;

        const payloadType = rtpPacket[1] & 0x7F;
        
        // Common DTMF payload types
        if (payloadType >= 96 && payloadType <= 127) {
            const payload = rtpPacket.slice(12);
            if (payload.length >= 4) {
                const event = payload[0];
                const endBit = (payload[1] & 0x80) !== 0;
                const duration = (payload[2] << 8) | payload[3];

                // Only process end packets to avoid duplicates
                if (endBit && event <= 15) {
                    const digit = this.eventToDigit(event);
                    console.log(`[DTMF] RFC 2833 detected: ${digit} for call ${callId}`);
                    this.processDTMF(callId, digit, 'rfc2833');
                }
            }
        }
    }

    // Handle SIP INFO DTMF
    handleSIPInfo(sipMessage, callId) {
        // Extract DTMF from various formats
        let digit = null;

        // Format 1: Signal=X
        const signalMatch = sipMessage.match(/Signal=(\d+)/i);
        if (signalMatch) {
            digit = signalMatch[1];
        }

        // Format 2: application/dtmf-relay
        if (!digit && sipMessage.includes('application/dtmf')) {
            const digitMatch = sipMessage.match(/\r\n\r\n(\d)/);
            if (digitMatch) {
                digit = digitMatch[1];
            }
        }

        // Format 3: dtmf in body
        if (!digit) {
            const bodyMatch = sipMessage.match(/\r\n\r\n.*?(\d)/s);
            if (bodyMatch) {
                digit = bodyMatch[1];
            }
        }

        if (digit) {
            console.log(`[DTMF] SIP INFO detected: ${digit} for call ${callId}`);
            this.processDTMF(callId, digit, 'sip-info');
        }
    }

    // Handle inband DTMF (audio tones)
    handleInbandDTMF(audioData, callId) {
        // This would require FFT analysis - placeholder for now
        // In production, use a library like goertzel-node
        console.log(`[DTMF] Inband audio analysis not implemented`);
    }

    // Process detected DTMF
    processDTMF(callId, digit, method) {
        const call = this.activeCalls.get(callId);
        if (!call) {
            console.log(`[DTMF] Warning: Call ${callId} not found`);
            return;
        }

        // Store DTMF history
        if (!this.dtmfHistory.has(callId)) {
            this.dtmfHistory.set(callId, []);
        }
        this.dtmfHistory.get(callId).push({
            digit,
            method,
            timestamp: Date.now()
        });

        console.log(`[DTMF] ✅ Digit '${digit}' detected via ${method} for ${call.phoneNumber}`);

        // Emit DTMF event
        this.emit('dtmf', {
            callId,
            digit,
            method,
            phoneNumber: call.phoneNumber,
            broadcastId: call.broadcastId,
            employeeId: call.employeeId
        });

        // Special handling for digit '1' (broadcast confirmation)
        if (digit === '1' && !call.dtmfDetected) {
            call.dtmfDetected = true;
            console.log(`[DTMF] 🎉 Broadcast confirmed by ${call.phoneNumber}`);
            
            this.emit('broadcast-confirmed', {
                callId,
                phoneNumber: call.phoneNumber,
                broadcastId: call.broadcastId,
                employeeId: call.employeeId,
                method,
                timestamp: new Date()
            });
        }
    }

    // Convert DTMF event code to digit
    eventToDigit(event) {
        if (event <= 9) return event.toString();
        if (event === 10) return '*';
        if (event === 11) return '#';
        if (event >= 12 && event <= 15) return String.fromCharCode(65 + event - 12); // A-D
        return '?';
    }

    // Clean up call data
    unregisterCall(callId) {
        const history = this.dtmfHistory.get(callId);
        if (history && history.length > 0) {
            console.log(`[DTMF] Call ${callId} had ${history.length} DTMF events`);
        }
        
        this.activeCalls.delete(callId);
        this.dtmfHistory.delete(callId);
    }

    // Get DTMF history for a call
    getHistory(callId) {
        return this.dtmfHistory.get(callId) || [];
    }

    // Check if call was confirmed
    isConfirmed(callId) {
        const call = this.activeCalls.get(callId);
        return call ? call.dtmfDetected : false;
    }
}

module.exports = DTMFHandler;