const EventEmitter = require('events');

class RTPDTMFDetector extends EventEmitter {
    constructor() {
        super();
        this.lastDTMFEvent = null;
        this.dtmfPayloadType = 101; // Common RFC 2833 payload type
    }

    /**
     * Process RTP packet for DTMF events
     * RFC 2833/4733 DTMF format:
     * - Payload type: typically 101
     * - Event (1 byte): DTMF digit (0-15)
     * - E bit (1 bit): End of event
     * - Volume (6 bits)
     * - Duration (16 bits)
     */
    processRTPPacket(packet) {
        if (packet.length < 12) return; // Too short for RTP
        
        // Parse RTP header
        const payloadType = packet[1] & 0x7F;
        const marker = (packet[1] & 0x80) >> 7;
        
        // Check if this is DTMF payload
        if (payloadType === this.dtmfPayloadType || payloadType === 96 || payloadType === 97 || payloadType === 98 || payloadType === 99 || payloadType === 100 || payloadType === 101) {
            const payload = packet.slice(12); // Skip RTP header
            
            if (payload.length >= 4) {
                const event = payload[0];
                const endBit = (payload[1] & 0x80) >> 7;
                const volume = payload[1] & 0x3F;
                const duration = (payload[2] << 8) | payload[3];
                
                // Map event to DTMF digit
                let digit = '';
                if (event <= 9) {
                    digit = event.toString();
                } else if (event === 10) {
                    digit = '*';
                } else if (event === 11) {
                    digit = '#';
                } else if (event >= 12 && event <= 15) {
                    digit = ['A', 'B', 'C', 'D'][event - 12];
                }
                
                // Only emit on end of DTMF event to avoid duplicates
                if (endBit && digit) {
                    console.log(`[RTP-DTMF] Detected digit: ${digit} (duration: ${duration}ms)`);
                    this.emit('dtmf', {
                        digit: digit,
                        duration: duration,
                        timestamp: Date.now()
                    });
                    this.lastDTMFEvent = digit;
                }
            }
        }
    }
    
    /**
     * Try to detect DTMF in any RTP-like packet
     * This is more aggressive detection for debugging
     */
    detectDTMFPattern(data) {
        // Look for DTMF-like patterns in the data
        if (data.length < 16) return;
        
        // Check various payload type positions
        for (let i = 1; i < data.length - 4; i++) {
            const possiblePT = data[i] & 0x7F;
            
            // Common DTMF payload types
            if (possiblePT >= 96 && possiblePT <= 101) {
                // Check if next bytes look like DTMF
                if (i + 12 + 4 <= data.length) {
                    const event = data[i + 12];
                    const flags = data[i + 13];
                    
                    // Valid DTMF events are 0-15
                    if (event <= 15) {
                        console.log(`[RTP-DTMF-DEBUG] Possible DTMF at offset ${i}: PT=${possiblePT}, Event=${event}, Flags=${flags.toString(16)}`);
                    }
                }
            }
        }
    }
}

module.exports = RTPDTMFDetector;