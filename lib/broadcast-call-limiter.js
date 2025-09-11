/**
 * Broadcast Call Limiter
 * Limits call duration and handles various timeout scenarios
 */

class BroadcastCallLimiter {
    constructor() {
        // Configuration
        this.config = {
            maxRingTime: 30000,         // 30 seconds max ring time
            maxCallDuration: 15000,     // 15 seconds max after answer
            dtmfTimeout: 10000,         // 10 seconds to press 1 after answer
            confirmEndDelay: 2000,      // 2 seconds delay after confirmation
            silenceTimeout: 5000        // 5 seconds of silence detection
        };
        
        // Active call tracking
        this.activeCalls = new Map();
    }

    /**
     * Start tracking a call
     */
    startCall(callId, employeeName) {
        const callData = {
            id: callId,
            employeeName,
            startTime: Date.now(),
            answered: false,
            answerTime: null,
            confirmed: false,
            timers: {
                maxRing: null,
                maxDuration: null,
                dtmfTimeout: null,
                silenceDetect: null
            }
        };
        
        this.activeCalls.set(callId, callData);
        console.log(`[LIMITER] Started tracking call ${callId} for ${employeeName}`);
        
        // Set max ring time
        callData.timers.maxRing = setTimeout(() => {
            this.handleTimeout(callId, 'ring');
        }, this.config.maxRingTime);
        
        return callData;
    }

    /**
     * Handle call answered
     */
    callAnswered(callId, sipInstance) {
        const call = this.activeCalls.get(callId);
        if (!call) return;
        
        call.answered = true;
        call.answerTime = Date.now();
        
        // Clear ring timeout
        if (call.timers.maxRing) {
            clearTimeout(call.timers.maxRing);
            call.timers.maxRing = null;
        }
        
        console.log(`[LIMITER] Call ${callId} answered - setting timeouts`);
        
        // Set max call duration
        call.timers.maxDuration = setTimeout(() => {
            if (!call.confirmed) {
                console.log(`[LIMITER] Max call duration (${this.config.maxCallDuration}ms) reached for ${call.employeeName}`);
                this.endCall(callId, sipInstance, 'duration_limit');
            }
        }, this.config.maxCallDuration);
        
        // Set DTMF timeout
        call.timers.dtmfTimeout = setTimeout(() => {
            if (!call.confirmed) {
                console.log(`[LIMITER] DTMF timeout (${this.config.dtmfTimeout}ms) for ${call.employeeName}`);
                // Don't end call, just log
            }
        }, this.config.dtmfTimeout);
    }

    /**
     * Handle DTMF confirmation
     */
    callConfirmed(callId, sipInstance) {
        const call = this.activeCalls.get(callId);
        if (!call) return;
        
        call.confirmed = true;
        
        // Clear all timeouts
        this.clearTimers(call);
        
        console.log(`[LIMITER] Call ${callId} confirmed - ending in ${this.config.confirmEndDelay}ms`);
        
        // End call after short delay
        setTimeout(() => {
            this.endCall(callId, sipInstance, 'confirmed');
        }, this.config.confirmEndDelay);
    }

    /**
     * Handle call ended
     */
    callEnded(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;
        
        // Clear all timers
        this.clearTimers(call);
        
        // Calculate stats
        const stats = {
            totalDuration: Date.now() - call.startTime,
            ringDuration: call.answerTime ? call.answerTime - call.startTime : Date.now() - call.startTime,
            talkDuration: call.answerTime ? Date.now() - call.answerTime : 0,
            confirmed: call.confirmed
        };
        
        console.log(`[LIMITER] Call ${callId} ended - Stats:`, {
            ringTime: `${(stats.ringDuration / 1000).toFixed(1)}s`,
            talkTime: `${(stats.talkDuration / 1000).toFixed(1)}s`,
            confirmed: stats.confirmed
        });
        
        this.activeCalls.delete(callId);
        return stats;
    }

    /**
     * Clear all timers for a call
     */
    clearTimers(call) {
        Object.values(call.timers).forEach(timer => {
            if (timer) clearTimeout(timer);
        });
        call.timers = {
            maxRing: null,
            maxDuration: null,
            dtmfTimeout: null,
            silenceDetect: null
        };
    }

    /**
     * Handle timeout
     */
    handleTimeout(callId, type) {
        const call = this.activeCalls.get(callId);
        if (!call) return;
        
        console.log(`[LIMITER] Timeout (${type}) for call ${callId}`);
        
        switch (type) {
            case 'ring':
                console.log(`[LIMITER] Max ring time reached for ${call.employeeName}`);
                break;
            case 'duration':
                console.log(`[LIMITER] Max call duration reached for ${call.employeeName}`);
                break;
            case 'dtmf':
                console.log(`[LIMITER] DTMF timeout for ${call.employeeName}`);
                break;
        }
    }

    /**
     * End call
     */
    endCall(callId, sipInstance, reason) {
        console.log(`[LIMITER] Ending call ${callId} - Reason: ${reason}`);
        if (sipInstance && sipInstance.endCall) {
            sipInstance.endCall(callId);
        }
    }

    /**
     * Get active calls count
     */
    getActiveCallsCount() {
        return this.activeCalls.size;
    }

    /**
     * Get call stats
     */
    getCallStats(callId) {
        return this.activeCalls.get(callId);
    }
}

module.exports = BroadcastCallLimiter;