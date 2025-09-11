/**
 * Professional SIP Client - MicroSIP-ga o'xshash
 * Barcha VoIP protokollarini qo'llab-quvvatlaydi
 */

class ProfessionalSIPClient {
    constructor(config) {
        this.config = {
            // SIP Configuration
            uri: config.uri || `sip:${config.extension}@${config.server}`,
            authorizationUser: config.extension,
            password: config.password,
            displayName: config.displayName || `Extension ${config.extension}`,
            
            // WebSocket Transport
            transportOptions: {
                wsServers: config.wsServers || [`wss://${window.location.hostname}:${window.location.port}/ws`],
                traceSip: config.debug || true,
                connectionTimeout: 10,
                keepAliveInterval: 30,
                maxReconnectionAttempts: 5,
                reconnectionDelay: 5
            },
            
            // Session Description Handler Options
            sessionDescriptionHandlerFactoryOptions: {
                constraints: {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: 48000,
                        channelCount: 2
                    },
                    video: false
                },
                
                // RTC Configuration
                peerConnectionOptions: {
                    iceServers: this.getIceServers(config),
                    iceTransportPolicy: 'all',
                    bundlePolicy: 'max-bundle',
                    rtcpMuxPolicy: 'require',
                    iceCandidatePoolSize: 10
                },
                
                // Codec Preferences
                codecPreferences: {
                    audio: ['opus/48000/2', 'PCMU/8000', 'PCMA/8000', 'G722/8000']
                }
            },
            
            // Registration Options
            register: true,
            registerOptions: {
                expires: 3600,
                extraContactHeaderParams: [],
                instanceId: this.generateInstanceId(),
                regId: 1
            },
            
            // Advanced Options
            userAgentString: 'Professional-WebPhone/1.0 (WebRTC)',
            noAnswerTimeout: 60000,
            hackIpInContact: true,
            hackWssInTransport: true,
            dtmfType: 'info',
            rel100: 'supported',
            replaces: 'supported',
            
            // Security
            allowLegacyNotifications: false,
            allowOutOfDialogRefers: false,
            authenticationFactory: this.customAuthenticationFactory,
            
            // Media - removed deprecated mediaHandlerFactory
            // Modern SIP.js uses sessionDescriptionHandlerFactoryOptions instead
        };
        
        // State management
        this.ua = null;
        this.sessions = new Map();
        this.currentSession = null;
        this.isRegistered = false;
        this.callHistory = [];
        
        // Audio elements
        this.localAudio = document.getElementById('localAudio') || this.createAudioElement('localAudio');
        this.remoteAudio = document.getElementById('remoteAudio') || this.createAudioElement('remoteAudio');
        this.ringtone = new Audio('/audio/ringtone.mp3');
        this.ringtone.loop = true;
        
        // Statistics
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            totalDuration: 0,
            averageQuality: 0
        };
        
        // Event handlers
        this.eventHandlers = {
            onRegistered: null,
            onUnregistered: null,
            onCallReceived: null,
            onCallConnected: null,
            onCallEnded: null,
            onCallFailed: null,
            onDTMFReceived: null,
            onQualityReport: null
        };
    }
    
    // ICE Server Configuration
    getIceServers(config) {
        const servers = [
            // Public STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:stun.voip.eutelia.it:3478' }
        ];
        
        // Add custom STUN server if provided
        if (config.stunServer) {
            servers.push({ urls: `stun:${config.stunServer}` });
        }
        
        // Add TURN server if provided
        if (config.turnServer) {
            servers.push({
                urls: `turn:${config.turnServer}`,
                username: config.turnUsername,
                credential: config.turnPassword
            });
        }
        
        return servers;
    }
    
    // Generate unique instance ID
    generateInstanceId() {
        return '<urn:uuid:' + this.generateUUID() + '>';
    }
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Create audio element
    createAudioElement(id) {
        const audio = document.createElement('audio');
        audio.id = id;
        audio.autoplay = true;
        document.body.appendChild(audio);
        return audio;
    }
    
    // Custom authentication factory
    customAuthenticationFactory(ua) {
        return {
            authenticate: function(challenge) {
                return ua.credentials;
            }
        };
    }
    
    // Initialize and start UA
    async initialize() {
        try {
            console.log('🚀 Initializing Professional SIP Client...');
            
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                } 
            });
            
            // Test audio and release
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Microphone access granted');
            
            // Check if SIP.js is loaded
            if (typeof SIP === 'undefined') {
                throw new Error('SIP.js library not loaded');
            }
            
            // Create User Agent - simplified config for compatibility
            const uaConfig = {
                uri: this.config.uri,
                authorizationUser: this.config.authorizationUser,
                password: this.config.password,
                displayName: this.config.displayName,
                transportOptions: this.config.transportOptions,
                register: this.config.register,
                registerOptions: this.config.registerOptions,
                userAgentString: this.config.userAgentString,
                dtmfType: this.config.dtmfType,
                sessionDescriptionHandlerFactoryOptions: this.config.sessionDescriptionHandlerFactoryOptions
            };
            
            this.ua = new SIP.UA(uaConfig);
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Start UA
            this.ua.start();
            
            return true;
        } catch (error) {
            console.error('❌ Initialization error:', error);
            throw error;
        }
    }
    
    // Setup all event handlers
    setupEventHandlers() {
        // Registration events
        this.ua.on('registered', () => {
            console.log('✅ SIP Registered');
            this.isRegistered = true;
            this.updateStatus('Registered');
            if (this.eventHandlers.onRegistered) {
                this.eventHandlers.onRegistered();
            }
        });
        
        this.ua.on('unregistered', () => {
            console.log('❌ SIP Unregistered');
            this.isRegistered = false;
            this.updateStatus('Unregistered');
            if (this.eventHandlers.onUnregistered) {
                this.eventHandlers.onUnregistered();
            }
        });
        
        this.ua.on('registrationFailed', (response, cause) => {
            console.error('❌ Registration failed:', cause);
            this.updateStatus(`Registration failed: ${cause}`);
        });
        
        // Call events
        this.ua.on('invite', (session) => {
            console.log('📞 Incoming call from:', session.remoteIdentity.displayName);
            this.handleIncomingCall(session);
        });
        
        // Transport events
        this.ua.on('transportCreated', (transport) => {
            console.log('🔌 Transport created');
            
            transport.on('connected', () => {
                console.log('✅ WebSocket connected');
            });
            
            transport.on('disconnected', () => {
                console.log('❌ WebSocket disconnected');
            });
        });
        
        // Message events
        this.ua.on('message', (message) => {
            console.log('💬 SIP MESSAGE received:', message.body);
        });
    }
    
    // Handle incoming call
    handleIncomingCall(session) {
        this.ringtone.play().catch(e => console.log('Ringtone error:', e));
        
        const callInfo = {
            id: session.request.call_id,
            from: session.remoteIdentity.displayName || session.remoteIdentity.uri.user,
            number: session.remoteIdentity.uri.user,
            startTime: new Date(),
            direction: 'incoming'
        };
        
        this.sessions.set(callInfo.id, { session, info: callInfo });
        
        if (this.eventHandlers.onCallReceived) {
            this.eventHandlers.onCallReceived(callInfo);
        }
        
        // Session event handlers
        this.setupSessionHandlers(session, callInfo);
    }
    
    // Setup session event handlers
    setupSessionHandlers(session, callInfo) {
        // Progress events
        session.on('progress', (response) => {
            console.log('🔔 Call progress:', response.status_code);
            this.updateStatus('Ringing...');
        });
        
        // Accepted event
        session.on('accepted', () => {
            console.log('✅ Call accepted');
            this.ringtone.pause();
            this.currentSession = session;
            callInfo.connectedTime = new Date();
            
            this.updateStatus('Connected');
            this.stats.successfulCalls++;
            
            // Setup media
            this.setupMedia(session);
            
            // Start quality monitoring
            this.startQualityMonitoring(session);
            
            if (this.eventHandlers.onCallConnected) {
                this.eventHandlers.onCallConnected(callInfo);
            }
        });
        
        // Terminated event
        session.on('bye', () => {
            console.log('👋 Call ended');
            this.handleCallEnd(session, callInfo);
        });
        
        // Failed event
        session.on('failed', (response, cause) => {
            console.log('❌ Call failed:', cause);
            this.ringtone.pause();
            this.stats.failedCalls++;
            
            if (this.eventHandlers.onCallFailed) {
                this.eventHandlers.onCallFailed({ cause, callInfo });
            }
            
            this.sessions.delete(callInfo.id);
        });
        
        // DTMF events
        session.on('dtmf', (request, dtmf) => {
            console.log('📱 DTMF received:', dtmf.tone);
            if (this.eventHandlers.onDTMFReceived) {
                this.eventHandlers.onDTMFReceived(dtmf.tone);
            }
        });
        
        // Refer events (transfer)
        session.on('refer', (request) => {
            console.log('🔄 Call transfer request');
            session.followRefer(handleRefer);
        });
    }
    
    // Setup media streams
    setupMedia(session) {
        const pc = session.sessionDescriptionHandler.peerConnection;
        
        // Handle remote stream
        const remoteStream = new MediaStream();
        pc.getReceivers().forEach(receiver => {
            if (receiver.track && receiver.track.kind === 'audio') {
                remoteStream.addTrack(receiver.track);
            }
        });
        
        this.remoteAudio.srcObject = remoteStream;
        
        // Handle local stream
        pc.getSenders().forEach(sender => {
            if (sender.track && sender.track.kind === 'audio') {
                const localStream = new MediaStream([sender.track]);
                this.localAudio.srcObject = localStream;
                this.localAudio.muted = true; // Prevent echo
            }
        });
    }
    
    // Start quality monitoring
    startQualityMonitoring(session) {
        const pc = session.sessionDescriptionHandler.peerConnection;
        
        const qualityInterval = setInterval(async () => {
            if (pc.connectionState === 'connected') {
                const stats = await pc.getStats();
                const quality = this.analyzeCallQuality(stats);
                
                if (this.eventHandlers.onQualityReport) {
                    this.eventHandlers.onQualityReport(quality);
                }
            } else {
                clearInterval(qualityInterval);
            }
        }, 5000); // Every 5 seconds
        
        session.qualityInterval = qualityInterval;
    }
    
    // Analyze call quality from WebRTC stats
    analyzeCallQuality(stats) {
        let quality = {
            packetLoss: 0,
            jitter: 0,
            roundTripTime: 0,
            audioLevel: 0,
            codec: '',
            bitrate: 0,
            score: 5 // 1-5 score
        };
        
        stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                quality.packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost) * 100;
                quality.jitter = report.jitter;
                quality.audioLevel = report.audioLevel;
            }
            
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                quality.roundTripTime = report.currentRoundTripTime * 1000; // Convert to ms
            }
            
            if (report.type === 'codec' && report.mimeType.includes('audio')) {
                quality.codec = report.mimeType.split('/')[1];
            }
        });
        
        // Calculate quality score (1-5)
        if (quality.packetLoss < 1 && quality.roundTripTime < 150) {
            quality.score = 5;
        } else if (quality.packetLoss < 3 && quality.roundTripTime < 300) {
            quality.score = 4;
        } else if (quality.packetLoss < 5 && quality.roundTripTime < 500) {
            quality.score = 3;
        } else if (quality.packetLoss < 10) {
            quality.score = 2;
        } else {
            quality.score = 1;
        }
        
        return quality;
    }
    
    // Handle call end
    handleCallEnd(session, callInfo) {
        this.ringtone.pause();
        
        if (session.qualityInterval) {
            clearInterval(session.qualityInterval);
        }
        
        callInfo.endTime = new Date();
        if (callInfo.connectedTime) {
            callInfo.duration = Math.round((callInfo.endTime - callInfo.connectedTime) / 1000);
            this.stats.totalDuration += callInfo.duration;
        }
        
        this.callHistory.push(callInfo);
        this.sessions.delete(callInfo.id);
        
        if (this.currentSession === session) {
            this.currentSession = null;
        }
        
        this.updateStatus('Ready');
        
        if (this.eventHandlers.onCallEnded) {
            this.eventHandlers.onCallEnded(callInfo);
        }
    }
    
    // Make outgoing call
    async makeCall(number, options = {}) {
        if (!this.isRegistered) {
            throw new Error('Not registered');
        }
        
        console.log(`📞 Calling ${number}...`);
        
        const callInfo = {
            id: this.generateUUID(),
            to: number,
            number: number,
            startTime: new Date(),
            direction: 'outgoing'
        };
        
        const inviteOptions = {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            },
            extraHeaders: options.extraHeaders || []
        };
        
        // Add custom headers if needed
        if (options.callerId) {
            inviteOptions.extraHeaders.push(`P-Asserted-Identity: ${options.callerId}`);
        }
        
        const session = this.ua.invite(`sip:${number}@${this.config.uri.split('@')[1]}`, inviteOptions);
        
        this.sessions.set(callInfo.id, { session, info: callInfo });
        this.currentSession = session;
        this.stats.totalCalls++;
        
        this.setupSessionHandlers(session, callInfo);
        
        return session;
    }
    
    // Answer incoming call
    answerCall(callId, options = {}) {
        const call = this.sessions.get(callId);
        if (!call) {
            throw new Error('Call not found');
        }
        
        console.log('📞 Answering call...');
        
        const answerOptions = {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: true,
                    video: false
                }
            }
        };
        
        call.session.accept(answerOptions);
        this.currentSession = call.session;
    }
    
    // Reject incoming call
    rejectCall(callId) {
        const call = this.sessions.get(callId);
        if (!call) {
            throw new Error('Call not found');
        }
        
        console.log('❌ Rejecting call...');
        call.session.reject();
        this.ringtone.pause();
        this.sessions.delete(callId);
    }
    
    // Hang up current call
    hangup() {
        if (!this.currentSession) {
            return;
        }
        
        console.log('📴 Hanging up...');
        this.currentSession.terminate();
    }
    
    // Send DTMF
    sendDTMF(digit) {
        if (!this.currentSession) {
            throw new Error('No active call');
        }
        
        console.log(`📱 Sending DTMF: ${digit}`);
        this.currentSession.dtmf(digit, {
            duration: 100,
            interToneGap: 70
        });
    }
    
    // Transfer call
    transferCall(target, options = {}) {
        if (!this.currentSession) {
            throw new Error('No active call');
        }
        
        console.log(`🔄 Transferring call to ${target}...`);
        
        if (options.blind) {
            // Blind transfer
            this.currentSession.refer(target);
        } else {
            // Attended transfer
            // First make a call to target
            this.makeCall(target).then(newSession => {
                newSession.on('accepted', () => {
                    // Then transfer
                    this.currentSession.refer(newSession);
                });
            });
        }
    }
    
    // Hold/Unhold call
    toggleHold() {
        if (!this.currentSession) {
            throw new Error('No active call');
        }
        
        if (this.currentSession.localHold) {
            console.log('▶️ Resuming call...');
            this.currentSession.unhold();
        } else {
            console.log('⏸️ Holding call...');
            this.currentSession.hold();
        }
    }
    
    // Mute/Unmute microphone
    toggleMute() {
        if (!this.currentSession) {
            throw new Error('No active call');
        }
        
        const pc = this.currentSession.sessionDescriptionHandler.peerConnection;
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
        
        if (sender && sender.track) {
            sender.track.enabled = !sender.track.enabled;
            console.log(sender.track.enabled ? '🔊 Unmuted' : '🔇 Muted');
            return !sender.track.enabled;
        }
        
        return false;
    }
    
    // Update UI status
    updateStatus(status) {
        console.log(`📊 Status: ${status}`);
        const statusEl = document.getElementById('sip-status');
        if (statusEl) {
            statusEl.textContent = status;
            statusEl.className = this.isRegistered ? 'status-success' : 'status-error';
        }
    }
    
    // Get call statistics
    getStatistics() {
        const avgDuration = this.stats.totalCalls > 0 ? 
            Math.round(this.stats.totalDuration / this.stats.successfulCalls) : 0;
        
        return {
            ...this.stats,
            averageDuration: avgDuration,
            successRate: this.stats.totalCalls > 0 ? 
                Math.round(this.stats.successfulCalls / this.stats.totalCalls * 100) : 0
        };
    }
    
    // Get call history
    getCallHistory() {
        return this.callHistory;
    }
    
    // Destroy and cleanup
    destroy() {
        if (this.currentSession) {
            this.currentSession.terminate();
        }
        
        this.sessions.forEach(call => {
            call.session.terminate();
        });
        
        if (this.ua) {
            this.ua.stop();
        }
        
        this.ringtone.pause();
    }
}

// Export for use
window.ProfessionalSIPClient = ProfessionalSIPClient;