/**
 * Alternative DTMF Detection Strategy
 * 
 * Since direct DTMF detection via SIP INFO might not be working,
 * we can use these alternative methods:
 * 
 * 1. Call duration - if user listens to entire message, consider it confirmed
 * 2. Call patterns - detect hang up timing
 * 3. RTP analysis - monitor audio stream for DTMF tones
 */

class DTMFAlternative {
    constructor() {
        this.callTimings = new Map();
        this.messagesDurations = new Map();
    }
    
    // Start tracking a call
    startTracking(callId, audioDuration) {
        this.callTimings.set(callId, {
            startTime: Date.now(),
            audioDuration: audioDuration || 30, // default 30 seconds
            events: []
        });
    }
    
    // Record call event
    recordEvent(callId, event) {
        const timing = this.callTimings.get(callId);
        if (timing) {
            timing.events.push({
                time: Date.now(),
                event: event
            });
        }
    }
    
    // Analyze call pattern for confirmation
    analyzeCallPattern(callId) {
        const timing = this.callTimings.get(callId);
        if (!timing) return { confirmed: false, reason: 'No timing data' };
        
        const callDuration = (Date.now() - timing.startTime) / 1000; // in seconds
        const audioDuration = timing.audioDuration;
        
        // Strategy 1: If user listened to at least 80% of the message
        if (callDuration >= audioDuration * 0.8) {
            return {
                confirmed: true,
                reason: 'Listened to most of the message',
                confidence: 0.8
            };
        }
        
        // Strategy 2: If call lasted more than 20 seconds
        if (callDuration >= 20) {
            return {
                confirmed: true,
                reason: 'Long call duration',
                confidence: 0.6
            };
        }
        
        // Strategy 3: Check for specific hang-up patterns
        const events = timing.events;
        const hangupEvent = events.find(e => e.event === 'hangup');
        
        if (hangupEvent) {
            const timeBeforeHangup = (hangupEvent.time - timing.startTime) / 1000;
            
            // If user hung up right after message (within 2 seconds)
            if (Math.abs(timeBeforeHangup - audioDuration) <= 2) {
                return {
                    confirmed: true,
                    reason: 'Hung up after message completed',
                    confidence: 0.7
                };
            }
        }
        
        return {
            confirmed: false,
            reason: 'Call too short or ended early',
            confidence: 0
        };
    }
    
    // Monitor RTP stream for DTMF tones (RFC 2833)
    monitorRTPStream(rtpSocket, onDTMF) {
        rtpSocket.on('message', (msg) => {
            if (msg.length < 12) return;
            
            const payloadType = msg[1] & 0x7F;
            
            // Check for telephone-event payload types
            if (payloadType >= 96 && payloadType <= 127) {
                if (msg.length >= 16) {
                    const event = msg[12];
                    const endBit = (msg[13] >> 7) & 0x01;
                    
                    if (endBit) { // Only report when key is released
                        const dtmfMap = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'];
                        const digit = event < dtmfMap.length ? dtmfMap[event] : null;
                        
                        if (digit && onDTMF) {
                            onDTMF(digit);
                        }
                    }
                }
            }
        });
    }
    
    // Clean up old tracking data
    cleanup() {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutes
        
        for (const [callId, timing] of this.callTimings) {
            if (now - timing.startTime > maxAge) {
                this.callTimings.delete(callId);
            }
        }
    }
}

module.exports = new DTMFAlternative();