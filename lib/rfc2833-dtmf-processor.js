const EventEmitter = require('events');

class RFC2833DTMFProcessor extends EventEmitter {
    constructor() {
        super();
        this.activeStreams = new Map();
        this.dtmfBuffer = new Map();
    }

    /**
     * Process RTP packet for RFC 2833 DTMF
     * @param {Buffer} rtpPacket - RTP packet
     * @param {string} callId - Call identifier
     * @param {object} rinfo - Remote info {address, port}
     */
    processRTPPacket(rtpPacket, callId, rinfo) {
        if (!rtpPacket || rtpPacket.length < 12) return;

        // RTP header parsing
        const version = (rtpPacket[0] >> 6) & 0x03;
        if (version !== 2) return; // Not RTP v2

        const payloadType = rtpPacket[1] & 0x7F;
        const sequenceNumber = (rtpPacket[2] << 8) | rtpPacket[3];
        const timestamp = (rtpPacket[4] << 24) | (rtpPacket[5] << 16) | 
                         (rtpPacket[6] << 8) | rtpPacket[7];
        
        // Check if this is telephone-event (typically PT 96-127)
        if (payloadType >= 96 && payloadType <= 127) {
            const payload = rtpPacket.slice(12);
            
            if (payload.length >= 4) {
                this.processDTMFPayload(payload, callId, {
                    payloadType,
                    sequenceNumber,
                    timestamp,
                    source: `${rinfo.address}:${rinfo.port}`
                });
            }
        }
    }

    /**
     * Process DTMF payload according to RFC 2833
     */
    processDTMFPayload(payload, callId, metadata) {
        const event = payload[0];
        const endBit = (payload[1] & 0x80) !== 0;
        const reserved = (payload[1] & 0x40) !== 0;
        const volume = payload[1] & 0x3F;
        const duration = (payload[2] << 8) | payload[3];

        // Validate event (0-15 are valid DTMF events)
        if (event > 15) return;

        // Get or create buffer for this call
        if (!this.dtmfBuffer.has(callId)) {
            this.dtmfBuffer.set(callId, new Map());
        }
        const callBuffer = this.dtmfBuffer.get(callId);

        // Create unique key for this DTMF event
        const eventKey = `${event}_${metadata.timestamp}`;
        
        // Get or create event tracking
        let eventData = callBuffer.get(eventKey);
        if (!eventData) {
            eventData = {
                event,
                startTime: Date.now(),
                packets: [],
                processed: false
            };
            callBuffer.set(eventKey, eventData);
        }

        // Add packet info
        eventData.packets.push({
            sequenceNumber: metadata.sequenceNumber,
            endBit,
            volume,
            duration,
            timestamp: Date.now()
        });

        // Process on end bit (RFC 2833 spec)
        if (endBit && !eventData.processed) {
            eventData.processed = true;
            
            const digit = this.eventToDigit(event);
            console.log(`[RFC2833] DTMF detected: '${digit}' for call ${callId}`);
            console.log(`[RFC2833] Duration: ${duration}ms, Volume: ${volume}`);
            console.log(`[RFC2833] Source: ${metadata.source}`);
            
            // Emit DTMF event
            this.emit('dtmf', {
                callId,
                digit,
                event,
                duration,
                volume,
                method: 'rfc2833',
                source: metadata.source,
                timestamp: new Date()
            });

            // Clean up old events for this call
            this.cleanupCallBuffer(callId);
        }
    }

    /**
     * Convert RFC 2833 event to digit
     */
    eventToDigit(event) {
        if (event <= 9) return event.toString();
        if (event === 10) return '*';
        if (event === 11) return '#';
        if (event === 12) return 'A';
        if (event === 13) return 'B';
        if (event === 14) return 'C';
        if (event === 15) return 'D';
        return '?';
    }

    /**
     * Clean up old DTMF events
     */
    cleanupCallBuffer(callId) {
        const callBuffer = this.dtmfBuffer.get(callId);
        if (!callBuffer) return;

        const now = Date.now();
        const OLD_THRESHOLD = 30000; // 30 seconds

        for (const [key, data] of callBuffer) {
            if (now - data.startTime > OLD_THRESHOLD) {
                callBuffer.delete(key);
            }
        }

        // Remove empty buffers
        if (callBuffer.size === 0) {
            this.dtmfBuffer.delete(callId);
        }
    }

    /**
     * Clear all data for a call
     */
    clearCall(callId) {
        this.dtmfBuffer.delete(callId);
        this.activeStreams.delete(callId);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            activeCalls: this.dtmfBuffer.size,
            totalBufferedEvents: Array.from(this.dtmfBuffer.values())
                .reduce((sum, buffer) => sum + buffer.size, 0)
        };
    }
}

module.exports = RFC2833DTMFProcessor;