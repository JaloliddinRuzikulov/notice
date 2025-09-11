// SIP Phone implementation with full DTMF support
class SIPPhone {
    constructor(config) {
        this.config = config || {
            uri: 'sip:5530@10.105.0.3',
            wsServer: 'wss://172.27.64.10:8444/ws',
            authorizationUser: '5530',
            password: '5530',
            displayName: 'Qashqadaryo IIB'
        };
        
        this.userAgent = null;
        this.currentSession = null;
        this.isRegistered = false;
        this.callHistory = [];
        this.dtmfQueue = [];
        this.broadcastId = null;
    }

    // Initialize SIP phone
    async initialize() {
        try {
            // SKIP BACKEND CHECK - GO STRAIGHT TO WEBRTC
            console.log('Skipping backend SIP - using WebRTC only for audio');
            this.useBackend = false;
            
            // Fall back to WebRTC
            console.log('Initializing WebRTC SIP phone');
            this.useBackend = false;
            
            // Create user agent
            this.userAgent = new SIP.UA({
                uri: this.config.uri,
                transportOptions: {
                    wsServers: [this.config.wsServer],
                    traceSip: true
                },
                authorizationUser: this.config.authorizationUser,
                password: this.config.password,
                displayName: this.config.displayName,
                register: true,
                sessionDescriptionHandlerFactoryOptions: {
                    constraints: {
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        },
                        video: false
                    },
                    peerConnectionOptions: {
                        iceServers: [
                            { urls: 'stun:stun.l.google.com:19302' },
                            { urls: 'stun:10.105.0.3:3478' }
                        ],
                        iceTransportPolicy: 'all',
                        rtcpMuxPolicy: 'require'
                    }
                }
            });

            // Setup event handlers
            this.setupEventHandlers();
            
            // Start user agent
            this.userAgent.start();
            
            return true;
        } catch (error) {
            console.error('SIP initialization error:', error);
            return false;
        }
    }

    // Setup event handlers
    setupEventHandlers() {
        // Registration events
        this.userAgent.on('registered', () => {
            console.log('SIP registered');
            this.isRegistered = true;
            this.updateStatus('registered');
        });

        this.userAgent.on('unregistered', () => {
            console.log('SIP unregistered');
            this.isRegistered = false;
            this.updateStatus('unregistered');
        });

        this.userAgent.on('registrationFailed', (response, cause) => {
            console.error('Registration failed:', cause);
            this.isRegistered = false;
            this.updateStatus('registration_failed');
        });

        // Incoming call handler
        this.userAgent.on('invite', (session) => {
            console.log('Incoming call from:', session.remoteIdentity.displayName);
            this.handleIncomingCall(session);
        });
    }

    // Make outgoing call for broadcast
    async makeBroadcastCall(phoneNumber, audioFile, broadcastId) {
        if (!this.isRegistered) {
            console.error('Not registered');
            return false;
        }

        try {
            this.broadcastId = broadcastId;
            const uri = `sip:${phoneNumber}@10.105.0.3`;
            
            // Add custom headers for broadcast
            const extraHeaders = [
                'X-Broadcast-ID: ' + broadcastId,
                'X-Audio-File: ' + audioFile
            ];
            
            this.currentSession = this.userAgent.invite(uri, {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false
                    }
                },
                extraHeaders: extraHeaders
            });

            this.setupSessionHandlers(this.currentSession, true);
            
            // Add to call history
            this.addToHistory({
                type: 'broadcast',
                number: phoneNumber,
                timestamp: new Date(),
                broadcastId: broadcastId
            });

            return true;
        } catch (error) {
            console.error('Broadcast call error:', error);
            return false;
        }
    }

    // Make regular outgoing call
    async makeCall(phoneNumber) {
        if (!this.isRegistered) {
            console.error('Not registered');
            return false;
        }

        try {
            // Use backend SIP if available
            if (this.useBackend) {
                console.log('Using hybrid mode: Backend SIP + WebRTC audio');
                
                // Start backend call for signaling
                const response = await fetch('/api/sip/call', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phoneNumber })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log('Backend call initiated:', result);
                    this.updateCallStatus('calling');
                    
                    // Store call ID for hangup
                    this.currentCallId = result.callId;
                    
                    // Add to call history
                    this.addToHistory({
                        type: 'outgoing',
                        number: phoneNumber,
                        timestamp: new Date(),
                        callId: result.callId
                    });
                    
                    // Listen for backend call events
                    this.listenForBackendEvents(result.callId);
                    
                    return true;
                } else {
                    throw new Error(result.message);
                }
            }
            
            // WebRTC fallback
            console.log('Using WebRTC for audio call');
            const uri = `sip:${phoneNumber}@10.105.0.3`;
            this.currentSession = this.userAgent.invite(uri, {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        },
                        video: false
                    },
                    offerOptions: {
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: false
                    }
                }
            });

            this.setupSessionHandlers(this.currentSession);
            
            // Add to call history
            this.addToHistory({
                type: 'outgoing',
                number: phoneNumber,
                timestamp: new Date()
            });

            return true;
        } catch (error) {
            console.error('Call error:', error);
            return false;
        }
    }

    // Handle incoming call
    handleIncomingCall(session) {
        this.currentSession = session;
        this.setupSessionHandlers(session);

        // Show incoming call UI
        if (window.showIncomingCall) {
            window.showIncomingCall(session.remoteIdentity.displayName);
        }

        // Add to call history
        this.addToHistory({
            type: 'incoming',
            number: session.remoteIdentity.displayName,
            timestamp: new Date()
        });
    }

    // Setup session event handlers
    setupSessionHandlers(session, isBroadcast = false) {
        session.on('progress', () => {
            console.log('Call progress');
            this.updateCallStatus('ringing');
        });

        session.on('accepted', () => {
            console.log('Call accepted');
            this.updateCallStatus('connected');
            this.startCallTimer();
            
            // Setup audio properly
            const pc = session.sessionDescriptionHandler.peerConnection;
            
            // Get remote audio stream
            const remoteStreams = pc.getRemoteStreams();
            console.log('Remote streams count:', remoteStreams.length);
            
            if (remoteStreams.length > 0) {
                const remoteStream = remoteStreams[0];
                const remoteAudio = document.getElementById('remoteAudio');
                if (remoteAudio) {
                    remoteAudio.srcObject = remoteStream;
                    remoteAudio.play().then(() => {
                        console.log('Remote audio playing');
                    }).catch(e => {
                        console.error('Remote audio play error:', e);
                    });
                }
                
                // Log audio tracks
                const audioTracks = remoteStream.getAudioTracks();
                console.log('Remote audio tracks:', audioTracks.length);
                audioTracks.forEach(track => {
                    console.log('Track:', track.label, 'enabled:', track.enabled);
                });
            }
            
            // Check local audio
            const localStreams = pc.getLocalStreams();
            console.log('Local streams count:', localStreams.length);
            if (localStreams.length > 0) {
                const localAudioTracks = localStreams[0].getAudioTracks();
                console.log('Local audio tracks:', localAudioTracks.length);
                localAudioTracks.forEach(track => {
                    console.log('Local track enabled:', track.enabled);
                });
            }
            
            // Monitor connection state
            pc.onconnectionstatechange = () => {
                console.log('WebRTC connection state:', pc.connectionState);
            };
            
            pc.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pc.iceConnectionState);
            };
            
            // For broadcast calls, play audio after connection
            if (isBroadcast && this.broadcastId) {
                this.playBroadcastMessage();
            }
        });

        session.on('failed', (response, cause) => {
            console.error('Call failed:', cause);
            this.updateCallStatus('failed');
            this.endCall();
        });

        session.on('bye', () => {
            console.log('Call ended');
            this.updateCallStatus('ended');
            this.endCall();
        });

        // DTMF events
        session.on('dtmf', (request, dtmf) => {
            console.log('DTMF received:', dtmf);
            this.handleDTMFReceived(dtmf);
        });
    }

    // Play broadcast message
    playBroadcastMessage() {
        console.log('Playing broadcast message for:', this.broadcastId);
        // In real implementation, this would trigger audio playback on Asterisk
    }

    // Send DTMF with multiple methods
    async sendDTMF(digit) {
        if (!this.currentSession) {
            console.error('No active call');
            return false;
        }

        try {
            // Method 1: RFC2833 (WebRTC)
            const pc = this.currentSession.sessionDescriptionHandler.peerConnection;
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
            if (sender && sender.dtmf) {
                sender.dtmf.insertDTMF(digit, 100, 70);
                console.log('DTMF sent via RFC2833:', digit);
            }
            
            // Method 2: SIP INFO
            this.currentSession.dtmf(digit);
            console.log('DTMF sent via SIP INFO:', digit);
            
            // Trigger confirmation event if digit is '1'
            if (digit === '1') {
                this.triggerConfirmation();
            }
            
            return true;
        } catch (error) {
            console.error('DTMF error:', error);
            return false;
        }
    }

    // Handle received DTMF
    handleDTMFReceived(digit) {
        console.log('Processing DTMF:', digit);
        
        // Store DTMF digit
        this.dtmfQueue.push({
            digit: digit,
            timestamp: new Date()
        });

        // Check for confirmation (digit 1)
        if (digit === '1') {
            this.triggerConfirmation();
        }
    }

    // Trigger confirmation event
    triggerConfirmation() {
        console.log('Confirmation received!');
        
        const phoneNumber = this.currentSession.remoteIdentity.uri.user;
        
        // Send confirmation to server
        if (this.broadcastId) {
            fetch('/api/broadcast/confirm', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    broadcastId: this.broadcastId,
                    phoneNumber: phoneNumber,
                    digit: '1'
                })
            }).then(response => response.json())
              .then(data => {
                  console.log('Confirmation sent:', data);
              })
              .catch(error => {
                  console.error('Confirmation error:', error);
              });
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('sipConfirmation', {
            detail: {
                phoneNumber: phoneNumber,
                timestamp: new Date(),
                broadcastId: this.broadcastId
            }
        }));
    }

    // Answer incoming call
    answerCall() {
        if (!this.currentSession) {
            console.error('No incoming call');
            return false;
        }

        try {
            this.currentSession.accept({
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false
                    }
                }
            });
            return true;
        } catch (error) {
            console.error('Answer error:', error);
            return false;
        }
    }

    // Reject incoming call
    rejectCall() {
        if (!this.currentSession) {
            console.error('No incoming call');
            return false;
        }

        try {
            this.currentSession.reject();
            this.currentSession = null;
            return true;
        } catch (error) {
            console.error('Reject error:', error);
            return false;
        }
    }

    // Hangup current call
    async hangup() {
        try {
            // If using backend SIP, send hangup request
            if (this.useBackend && this.currentCallId) {
                const response = await fetch('/api/sip/hangup', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ callId: this.currentCallId })
                });
                
                const result = await response.json();
                console.log('Backend hangup result:', result);
                
                this.endCall();
                return true;
            }
            
            // WebRTC hangup
            if (!this.currentSession) {
                console.error('No active call');
                return false;
            }

            this.currentSession.bye();
            this.endCall();
            return true;
        } catch (error) {
            console.error('Hangup error:', error);
            return false;
        }
    }

    // End call cleanup
    endCall() {
        console.log('Ending call and cleaning up...');
        
        // Disable microphone
        this.disableMicrophone();
        
        this.currentSession = null;
        this.currentCallId = null;
        this.broadcastId = null;
        this.stopCallTimer();
        this.updateCallStatus('idle');
        
        // Clear remote audio
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) {
            remoteAudio.srcObject = null;
        }
    }

    // Mute/unmute
    toggleMute() {
        if (!this.currentSession) return false;

        const pc = this.currentSession.sessionDescriptionHandler.peerConnection;
        const localStream = pc.getLocalStreams()[0];
        
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled; // Return mute state
            }
        }
        
        return false;
    }

    // Hold/unhold
    toggleHold() {
        if (!this.currentSession) return false;

        try {
            if (this.currentSession.localHold) {
                this.currentSession.unhold();
            } else {
                this.currentSession.hold();
            }
            return this.currentSession.localHold;
        } catch (error) {
            console.error('Hold error:', error);
            return false;
        }
    }

    // Update status UI
    updateStatus(status) {
        const statusElement = document.getElementById('statusText');
        const statusIndicator = document.getElementById('statusIndicator');
        
        if (statusElement) {
            switch (status) {
                case 'registered':
                    statusElement.textContent = 'Ulangan';
                    statusIndicator.className = 'status-indicator connected';
                    break;
                case 'unregistered':
                    statusElement.textContent = 'Ulanmagan';
                    statusIndicator.className = 'status-indicator disconnected';
                    break;
                case 'registration_failed':
                    statusElement.textContent = 'Ulanish xatosi';
                    statusIndicator.className = 'status-indicator error';
                    break;
            }
        }
    }

    // Update call status UI
    updateCallStatus(status) {
        const callInfo = document.getElementById('callInfo');
        const phoneDisplay = document.querySelector('.phone-display input');
        
        switch (status) {
            case 'ringing':
                if (callInfo) {
                    callInfo.style.display = 'block';
                    document.getElementById('callerName').textContent = 'Qo\'ng\'iroq qilinmoqda...';
                }
                break;
            case 'connected':
                if (callInfo) {
                    document.getElementById('callerName').textContent = 'Ulangan';
                }
                break;
            case 'ended':
            case 'failed':
                if (callInfo) {
                    callInfo.style.display = 'none';
                }
                if (phoneDisplay) {
                    phoneDisplay.style.display = 'block';
                }
                break;
        }
    }

    // Call timer
    startCallTimer() {
        let seconds = 0;
        this.callTimer = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            const display = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            const timerElement = document.getElementById('callTimer');
            if (timerElement) {
                timerElement.textContent = display;
            }
        }, 1000);
    }

    stopCallTimer() {
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
            
            const timerElement = document.getElementById('callTimer');
            if (timerElement) {
                timerElement.textContent = '00:00';
            }
        }
    }

    // Add to call history
    addToHistory(call) {
        this.callHistory.unshift(call);
        if (this.callHistory.length > 50) {
            this.callHistory.pop();
        }
        
        // Update history UI
        this.updateHistoryUI();
    }

    updateHistoryUI() {
        const historyElement = document.getElementById('callHistory');
        if (!historyElement) return;

        if (this.callHistory.length === 0) {
            historyElement.innerHTML = '<p class="text-muted">Tarix bo\'sh</p>';
            return;
        }

        historyElement.innerHTML = this.callHistory.map(call => {
            const time = call.timestamp.toLocaleTimeString('uz-UZ');
            let icon, color, label;
            
            if (call.type === 'broadcast') {
                icon = 'fa-broadcast-tower';
                color = 'text-warning';
                label = 'Xabar';
            } else if (call.type === 'incoming') {
                icon = 'fa-phone-alt';
                color = 'text-primary';
                label = 'Kiruvchi';
            } else {
                icon = 'fa-phone';
                color = 'text-success';
                label = 'Chiquvchi';
            }
            
            return `
                <div class="history-item">
                    <i class="fas ${icon} ${color}"></i>
                    <span>${call.number}</span>
                    <small>${time} - ${label}</small>
                </div>
            `;
        }).join('');
    }

    // Listen for backend call events via WebSocket/polling
    listenForBackendEvents(callId) {
        // Listen for WebSocket events if available
        if (window.io && window.io.on) {
            window.io.on('sip-call-trying', (data) => {
                if (data.callId === callId) {
                    this.updateCallStatus('trying');
                }
            });
            
            window.io.on('sip-call-ringing', (data) => {
                if (data.callId === callId) {
                    this.updateCallStatus('ringing');
                }
            });
            
            window.io.on('sip-call-answered', async (data) => {
                if (data.callId === callId) {
                    console.log('📞 TELEFON KO\'TARILDI! Mikrofon yoqilmoqda...');
                    this.updateCallStatus('connected');
                    this.startCallTimer();
                    
                    // Enable microphone NOW when call is answered
                    await this.enableMicrophone();
                }
            });
            
            window.io.on('sip-call-failed', (data) => {
                if (data.callId === callId) {
                    this.updateCallStatus('failed');
                    alert(`Qo'ng'iroq muvaffaqiyatsiz: ${data.reason}`);
                }
            });
            
            window.io.on('sip-call-ended', (data) => {
                if (data.callId === callId) {
                    this.updateCallStatus('ended');
                    this.endCall();
                }
            });
            
            window.io.on('audio-started', (data) => {
                if (data.callId === callId) {
                    console.log('Audio stream started for call:', callId);
                }
            });
            
            window.io.on('sip-remote-hangup', (data) => {
                if (data.callId === callId) {
                    console.log('Remote party hung up');
                    alert('Qo\'ng\'iroq tugatildi - Qarshi tomon go\'shakni qo\'ydi');
                    this.updateCallStatus('ended');
                    this.endCall();
                }
            });
        }
    }

    // Initialize WebRTC Audio for hybrid mode
    async initializeWebRTCAudio() {
        try {
            console.log('Initializing WebRTC audio (permission only)...');
            
            // Just check microphone permission, don't keep stream active
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            
            console.log('Microphone permission granted');
            
            // Immediately stop the stream - we'll create new one when call starts
            stream.getTracks().forEach(track => track.stop());
            
            this.microphonePermissionGranted = true;
            
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            this.microphonePermissionGranted = false;
            
            // Show alert to user
            alert('Mikrofon ruxsati kerak! Brauzer sozlamalarida mikrofon ruxsatini bering.');
            
            return false;
        }
    }
    
    // Enable microphone when call is answered
    async enableMicrophone() {
        try {
            if (!this.microphonePermissionGranted) {
                console.log('Microphone permission not granted');
                return false;
            }
            
            console.log('Enabling microphone for active call...');
            
            // Update UI
            const micStatus = document.getElementById('micStatus');
            if (micStatus) {
                micStatus.style.display = 'inline';
                micStatus.innerHTML = '<i class="fas fa-microphone" style="color: green;"></i> <small>Mikrofon yoqiq</small>';
            }
            
            // Create new audio stream
            this.localAudioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            });
            
            // If using WebRTC, add to peer connection
            if (this.currentSession && this.currentSession.sessionDescriptionHandler) {
                const pc = this.currentSession.sessionDescriptionHandler.peerConnection;
                
                // Remove old tracks
                const senders = pc.getSenders();
                senders.forEach(sender => {
                    if (sender.track && sender.track.kind === 'audio') {
                        pc.removeTrack(sender);
                    }
                });
                
                // Add new track
                this.localAudioStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localAudioStream);
                });
                
                console.log('Microphone enabled and connected to call');
            }
            
            return true;
        } catch (error) {
            console.error('Enable microphone error:', error);
            return false;
        }
    }
    
    // Disable microphone when call ends
    disableMicrophone() {
        if (this.localAudioStream) {
            console.log('Disabling microphone...');
            this.localAudioStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localAudioStream = null;
        }
        
        // Update UI
        const micStatus = document.getElementById('micStatus');
        if (micStatus) {
            micStatus.style.display = 'inline';
            micStatus.innerHTML = '<i class="fas fa-microphone-slash" style="color: red;"></i> <small>Mikrofon o\'chiq</small>';
            
            // Hide after 3 seconds
            setTimeout(() => {
                micStatus.style.display = 'none';
            }, 3000);
        }
    }
    
    // Setup audio session handlers
    setupAudioSession(session) {
        session.on('accepted', () => {
            console.log('Audio bridge connected!');
            
            const pc = session.sessionDescriptionHandler.peerConnection;
            const remoteStream = pc.getRemoteStreams()[0];
            
            if (remoteStream) {
                const remoteAudio = document.getElementById('remoteAudio');
                if (remoteAudio) {
                    remoteAudio.srcObject = remoteStream;
                }
            }
        });
        
        session.on('failed', (response, cause) => {
            console.error('Audio bridge failed:', cause);
        });
        
        session.on('bye', () => {
            console.log('Audio bridge disconnected');
        });
        
        this.audioSession = session;
    }
    
    // Disconnect and cleanup
    disconnect() {
        if (this.currentSession) {
            this.hangup();
        }
        
        if (this.userAgent) {
            this.userAgent.stop();
            this.userAgent = null;
        }
        
        if (this.audioUA) {
            this.audioUA.stop();
            this.audioUA = null;
        }
        
        if (this.localAudioStream) {
            this.localAudioStream.getTracks().forEach(track => track.stop());
            this.localAudioStream = null;
        }
        
        this.isRegistered = false;
        this.updateStatus('unregistered');
    }
}

// Initialize on page load
let sipPhone = null;

function initializeSIPPhone() {
    // This function is now handled by changeSIPAccount()
    // Keep it for backward compatibility
}

// UI functions
function makeCall() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    if (!phoneNumber) {
        alert('Raqamni kiriting!');
        return;
    }
    
    if (sipPhone && sipPhone.isRegistered) {
        sipPhone.makeCall(phoneNumber);
        document.getElementById('callBtn').style.display = 'none';
        document.getElementById('hangupBtn').style.display = 'inline-block';
        document.getElementById('muteBtn').disabled = false;
        document.getElementById('holdBtn').disabled = false;
        document.querySelector('.phone-display input').style.display = 'none';
    } else {
        alert('SIP ulanmagan!');
    }
}

function hangupCall() {
    if (sipPhone) {
        sipPhone.hangup();
        document.getElementById('callBtn').style.display = 'inline-block';
        document.getElementById('hangupBtn').style.display = 'none';
        document.getElementById('muteBtn').disabled = true;
        document.getElementById('holdBtn').disabled = true;
    }
}

function toggleMute() {
    if (sipPhone) {
        const isMuted = sipPhone.toggleMute();
        const muteBtn = document.getElementById('muteBtn');
        if (isMuted) {
            muteBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            muteBtn.classList.add('active');
        } else {
            muteBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            muteBtn.classList.remove('active');
        }
    }
}

function toggleHold() {
    if (sipPhone) {
        const isOnHold = sipPhone.toggleHold();
        const holdBtn = document.getElementById('holdBtn');
        if (isOnHold) {
            holdBtn.innerHTML = '<i class="fas fa-play"></i>';
            holdBtn.classList.add('active');
        } else {
            holdBtn.innerHTML = '<i class="fas fa-pause"></i>';
            holdBtn.classList.remove('active');
        }
    }
}

function appendNumber(number) {
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.value += number;
    phoneInput.focus();
}

function quickDial(number) {
    document.getElementById('phoneNumber').value = number;
    makeCall();
}

function sendDTMF(digit) {
    if (sipPhone && sipPhone.currentSession) {
        sipPhone.sendDTMF(digit);
    } else {
        alert('Aktiv qo\'ng\'iroq yo\'q!');
    }
}

// Show incoming call modal
function showIncomingCall(callerNumber) {
    const modal = document.createElement('div');
    modal.className = 'incoming-call-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Kiruvchi qo'ng'iroq</h3>
            <div class="caller-info">
                <i class="fas fa-phone-alt fa-3x animated-ring"></i>
                <p class="caller-number">${callerNumber}</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-success" onclick="answerIncomingCall()">
                    <i class="fas fa-phone"></i> Javob berish
                </button>
                <button class="btn btn-danger" onclick="rejectIncomingCall()">
                    <i class="fas fa-phone-slash"></i> Rad etish
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function answerIncomingCall() {
    if (sipPhone) {
        sipPhone.answerCall();
        document.querySelector('.incoming-call-modal').remove();
        document.getElementById('callBtn').style.display = 'none';
        document.getElementById('hangupBtn').style.display = 'inline-block';
        document.getElementById('muteBtn').disabled = false;
        document.getElementById('holdBtn').disabled = false;
    }
}

function rejectIncomingCall() {
    if (sipPhone) {
        sipPhone.rejectCall();
        document.querySelector('.incoming-call-modal').remove();
    }
}

// Listen for confirmation events
window.addEventListener('sipConfirmation', (event) => {
    console.log('SIP Confirmation received:', event.detail);
    // Update UI or perform actions based on confirmation
});

// Initialize when DOM is ready
// Initialization is now handled by loadSIPAccounts() in sip-phone.ejs