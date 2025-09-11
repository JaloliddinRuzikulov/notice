// SIP Audio Bridge - Connects Backend SIP signaling with WebRTC audio
class SIPAudioBridge {
    constructor() {
        this.webrtcAudio = null;
        this.currentCallId = null;
        this.asteriskBridgeNumber = '8000'; // Conference bridge number
        this.isAudioConnected = false;
    }
    
    // Initialize bridge
    async initialize() {
        console.log('Initializing SIP Audio Bridge...');
        
        // Create WebRTC audio handler
        this.webrtcAudio = new WebRTCAudio();
        
        // Listen for backend SIP events
        this.setupEventListeners();
        
        return true;
    }
    
    // Setup event listeners for backend SIP
    setupEventListeners() {
        if (!window.io) {
            console.error('Socket.IO not initialized');
            return;
        }
        
        // When call is answered via backend SIP
        window.io.on('sip-call-answered', async (data) => {
            console.log('Backend call answered, initiating audio bridge...');
            this.currentCallId = data.callId;
            
            // Start WebRTC audio connection
            await this.connectAudio();
        });
        
        // When voice is detected
        window.io.on('sip-voice-detected', (data) => {
            console.log('Voice detected on backend, audio should be flowing');
        });
        
        // When call ends
        window.io.on('sip-call-ended', (data) => {
            if (data.callId === this.currentCallId) {
                this.disconnectAudio();
            }
        });
    }
    
    // Connect audio using Asterisk conference bridge
    async connectAudio() {
        try {
            console.log('Connecting audio bridge...');
            
            // Method 1: Direct WebRTC to Asterisk
            if (window.sipPhone && window.sipPhone.userAgent) {
                // Make a call to conference bridge
                const bridgeUri = `sip:${this.asteriskBridgeNumber}@10.105.0.3`;
                console.log('Calling conference bridge:', bridgeUri);
                
                const session = window.sipPhone.userAgent.invite(bridgeUri, {
                    sessionDescriptionHandlerOptions: {
                        constraints: {
                            audio: true,
                            video: false
                        }
                    }
                });
                
                this.setupBridgeSession(session);
                return true;
            }
            
            // Method 2: Pure WebRTC with manual SDP exchange
            console.log('Using pure WebRTC audio...');
            const initialized = await this.webrtcAudio.initializePeerConnection();
            
            if (initialized) {
                // For testing, play dial tone
                this.playDialTone();
                
                // In production, exchange SDP with Asterisk
                const offer = await this.webrtcAudio.createOffer();
                console.log('WebRTC offer created, need to send to Asterisk');
                
                // TODO: Send offer to Asterisk via AMI or ARI
                this.isAudioConnected = true;
            }
            
        } catch (error) {
            console.error('Audio bridge connection error:', error);
            return false;
        }
    }
    
    // Setup conference bridge session
    setupBridgeSession(session) {
        session.on('accepted', () => {
            console.log('Connected to conference bridge!');
            this.isAudioConnected = true;
            
            // Setup audio elements
            const pc = session.sessionDescriptionHandler.peerConnection;
            const remoteStream = pc.getRemoteStreams()[0];
            
            if (remoteStream) {
                const remoteAudio = document.getElementById('remoteAudio');
                if (remoteAudio) {
                    remoteAudio.srcObject = remoteStream;
                    remoteAudio.play();
                }
            }
            
            // Notify UI
            window.dispatchEvent(new CustomEvent('audio-bridge-connected', {
                detail: { callId: this.currentCallId }
            }));
        });
        
        session.on('failed', (response, cause) => {
            console.error('Bridge connection failed:', cause);
        });
        
        session.on('bye', () => {
            console.log('Bridge disconnected');
            this.isAudioConnected = false;
        });
    }
    
    // Play dial tone for testing
    playDialTone() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator1.frequency.value = 350; // Dial tone frequency 1
        oscillator2.frequency.value = 440; // Dial tone frequency 2
        gainNode.gain.value = 0.1;
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator1.start();
        oscillator2.start();
        
        // Stop after 2 seconds
        setTimeout(() => {
            oscillator1.stop();
            oscillator2.stop();
        }, 2000);
    }
    
    // Make a hybrid call (backend signaling + WebRTC audio)
    async makeHybridCall(phoneNumber) {
        try {
            console.log('Making hybrid call to:', phoneNumber);
            
            // Step 1: Initialize WebRTC audio
            await this.webrtcAudio.initializePeerConnection();
            
            // Step 2: Make call via backend SIP (signaling only)
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
                this.currentCallId = result.callId;
                console.log('Backend call initiated:', result.callId);
                
                // Audio will connect when we receive 'sip-call-answered' event
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Hybrid call error:', error);
            return false;
        }
    }
    
    // Disconnect audio
    disconnectAudio() {
        console.log('Disconnecting audio bridge...');
        
        if (this.webrtcAudio) {
            this.webrtcAudio.destroy();
        }
        
        this.isAudioConnected = false;
        this.currentCallId = null;
    }
    
    // Get audio status
    getStatus() {
        return {
            audioConnected: this.isAudioConnected,
            callId: this.currentCallId,
            webrtcConnected: this.webrtcAudio?.isConnected || false
        };
    }
}

// Create global instance
window.sipAudioBridge = new SIPAudioBridge();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sipAudioBridge.initialize();
});