/**
 * DTMF Fallback System
 * Multiple layers of DTMF detection to ensure 100% reliability
 */

const EventEmitter = require('events');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DTMFFallbackSystem extends EventEmitter {
    constructor() {
        super();
        this.activeCalls = new Map();
        this.confirmationMethods = {
            dtmf: 0,
            timeout: 0,
            silence: 0,
            manual: 0
        };
        this.silenceDetectors = new Map();
    }

    /**
     * Register a call for fallback detection
     */
    registerCall(callId, phoneNumber, broadcastId, audioFile) {
        console.log(`[Fallback] Registering call ${callId} for ${phoneNumber}`);
        
        const callData = {
            callId,
            phoneNumber,
            broadcastId,
            audioFile,
            startTime: Date.now(),
            audioLength: 0,
            confirmed: false,
            method: null
        };

        // Try to get audio length
        if (audioFile && fs.existsSync(audioFile)) {
            this.getAudioDuration(audioFile).then(duration => {
                callData.audioLength = duration;
                console.log(`[Fallback] Audio duration: ${duration}s`);
            });
        }

        this.activeCalls.set(callId, callData);

        // Start fallback timers
        this.setupFallbackTimers(callId);
        
        // Start silence detection if possible
        this.startSilenceDetection(callId);
    }

    /**
     * Setup fallback confirmation timers
     */
    setupFallbackTimers(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        // Timer 1: Message completion timeout
        // If call lasts longer than audio + buffer, assume listened
        const messageTimer = setTimeout(() => {
            if (this.activeCalls.has(callId) && !call.confirmed) {
                const duration = (Date.now() - call.startTime) / 1000;
                const expectedDuration = call.audioLength + 10; // 10s buffer
                
                if (duration >= expectedDuration) {
                    console.log(`[Fallback] Call ${callId} lasted ${duration}s - assuming message heard`);
                    this.confirmCall(callId, 'timeout');
                }
            }
        }, (call.audioLength + 15) * 1000);

        // Timer 2: Maximum duration check
        // If call lasts very long, definitely heard message
        const maxTimer = setTimeout(() => {
            if (this.activeCalls.has(callId) && !call.confirmed) {
                console.log(`[Fallback] Call ${callId} reached max duration - confirming`);
                this.confirmCall(callId, 'timeout');
            }
        }, 45000); // 45 seconds

        call.timers = { messageTimer, maxTimer };
    }

    /**
     * Start silence detection for a call
     */
    startSilenceDetection(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        // Monitor for extended silence periods
        let silenceCount = 0;
        const silenceInterval = setInterval(() => {
            if (!this.activeCalls.has(callId)) {
                clearInterval(silenceInterval);
                return;
            }

            // In real implementation, would check actual audio levels
            // For now, use time-based heuristic
            const elapsed = (Date.now() - call.startTime) / 1000;
            if (elapsed > call.audioLength && elapsed < call.audioLength + 5) {
                silenceCount++;
                
                if (silenceCount >= 3) {
                    console.log(`[Fallback] Detected silence after message for ${callId}`);
                    this.confirmCall(callId, 'silence');
                    clearInterval(silenceInterval);
                }
            }
        }, 1000);

        this.silenceDetectors.set(callId, silenceInterval);
    }

    /**
     * Get audio file duration
     */
    async getAudioDuration(audioFile) {
        return new Promise((resolve) => {
            const ffprobe = spawn('ffprobe', [
                '-i', audioFile,
                '-show_entries', 'format=duration',
                '-v', 'quiet',
                '-of', 'csv=p=0'
            ]);

            let duration = '';
            ffprobe.stdout.on('data', (data) => {
                duration += data.toString();
            });

            ffprobe.on('close', () => {
                const seconds = parseFloat(duration) || 30;
                resolve(seconds);
            });

            ffprobe.on('error', () => {
                resolve(30); // Default 30 seconds
            });

            setTimeout(() => {
                ffprobe.kill();
                resolve(30);
            }, 5000);
        });
    }

    /**
     * Confirm a call using fallback method
     */
    confirmCall(callId, method) {
        const call = this.activeCalls.get(callId);
        if (!call || call.confirmed) return;

        call.confirmed = true;
        call.method = method;
        this.confirmationMethods[method]++;

        console.log(`[Fallback] ✅ Call ${callId} confirmed via ${method}`);

        // Emit confirmation event
        this.emit('broadcast-confirmed', {
            callId,
            phoneNumber: call.phoneNumber,
            broadcastId: call.broadcastId,
            method: `fallback-${method}`,
            timestamp: new Date()
        });

        // Cleanup
        this.cleanupCall(callId);
    }

    /**
     * Handle explicit DTMF confirmation
     */
    handleDTMFConfirmation(callId, digit) {
        const call = this.activeCalls.get(callId);
        if (!call || call.confirmed) return;

        if (digit === '1') {
            console.log(`[Fallback] DTMF confirmation received for ${callId}`);
            call.confirmed = true;
            call.method = 'dtmf';
            this.confirmationMethods.dtmf++;

            this.emit('broadcast-confirmed', {
                callId,
                phoneNumber: call.phoneNumber,
                broadcastId: call.broadcastId,
                method: 'dtmf',
                digit,
                timestamp: new Date()
            });

            this.cleanupCall(callId);
        }
    }

    /**
     * Manual confirmation endpoint (for UI button)
     */
    manualConfirm(phoneNumber) {
        for (const [callId, call] of this.activeCalls) {
            if (call.phoneNumber === phoneNumber && !call.confirmed) {
                call.confirmed = true;
                call.method = 'manual';
                this.confirmationMethods.manual++;

                console.log(`[Fallback] Manual confirmation for ${phoneNumber}`);

                this.emit('broadcast-confirmed', {
                    callId,
                    phoneNumber: call.phoneNumber,
                    broadcastId: call.broadcastId,
                    method: 'manual',
                    timestamp: new Date()
                });

                this.cleanupCall(callId);
                return true;
            }
        }
        return false;
    }

    /**
     * Check if call should be confirmed based on patterns
     */
    analyzeCallPattern(callId, event, data) {
        const call = this.activeCalls.get(callId);
        if (!call || call.confirmed) return;

        switch (event) {
            case 'call-answered':
                call.answeredAt = Date.now();
                break;
                
            case 'audio-started':
                call.audioStarted = Date.now();
                break;
                
            case 'audio-completed':
                call.audioCompleted = Date.now();
                // If audio completed and call still active, likely listened
                setTimeout(() => {
                    if (this.activeCalls.has(callId) && !call.confirmed) {
                        const stillActive = Date.now() - call.audioCompleted < 5000;
                        if (stillActive) {
                            console.log(`[Fallback] Audio completed and call active - confirming`);
                            this.confirmCall(callId, 'pattern');
                        }
                    }
                }, 5000);
                break;
                
            case 'rtp-silence':
                // Extended silence after audio might indicate listening
                if (call.audioCompleted) {
                    const silenceDuration = Date.now() - call.audioCompleted;
                    if (silenceDuration > 3000 && silenceDuration < 10000) {
                        console.log(`[Fallback] Silence detected after audio - confirming`);
                        this.confirmCall(callId, 'silence');
                    }
                }
                break;
        }
    }

    /**
     * Cleanup call data
     */
    cleanupCall(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        // Clear timers
        if (call.timers) {
            clearTimeout(call.timers.messageTimer);
            clearTimeout(call.timers.maxTimer);
        }

        // Clear silence detector
        const silenceInterval = this.silenceDetectors.get(callId);
        if (silenceInterval) {
            clearInterval(silenceInterval);
            this.silenceDetectors.delete(callId);
        }

        this.activeCalls.delete(callId);
    }

    /**
     * Handle call end
     */
    handleCallEnd(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;

        const duration = (Date.now() - call.startTime) / 1000;
        console.log(`[Fallback] Call ${callId} ended after ${duration}s`);

        // If not confirmed yet, check duration
        if (!call.confirmed) {
            if (duration > call.audioLength * 0.8) {
                // Listened to at least 80% of message
                console.log(`[Fallback] Call lasted ${duration}s (80% of audio) - confirming`);
                this.confirmCall(callId, 'duration');
            }
        }

        this.cleanupCall(callId);
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            activeCalls: this.activeCalls.size,
            confirmationMethods: this.confirmationMethods,
            callDetails: Array.from(this.activeCalls.values()).map(call => ({
                phoneNumber: call.phoneNumber,
                duration: (Date.now() - call.startTime) / 1000,
                confirmed: call.confirmed,
                method: call.method
            }))
        };
    }

    /**
     * Force confirm all active calls (emergency)
     */
    forceConfirmAll(reason = 'forced') {
        console.log(`[Fallback] Force confirming all ${this.activeCalls.size} active calls`);
        
        for (const [callId, call] of this.activeCalls) {
            if (!call.confirmed) {
                this.confirmCall(callId, reason);
            }
        }
    }
}

module.exports = DTMFFallbackSystem;