/**
 * Fixed SIP Phone Implementation
 * Properly handles both backend SIP and WebRTC connections
 */

class SIPPhoneFixed {
    constructor(config) {
        this.config = {
            backendUrl: 'https://172.27.64.10:8444',
            wsServer: 'wss://172.27.64.10:8444/ws',
            uri: 'sip:752305530@172.26.0.10',
            authorizationUser: '752305530',
            password: '',
            displayName: 'Qashqadaryo IIB',
            ...config
        };
        
        this.mode = 'backend'; // 'backend' or 'webrtc'
        this.isConnected = false;
        this.currentCall = null;
        this.socket = null;
        this.userAgent = null;
        
        // Load WebRTC config
        this.webrtcConfig = typeof WebRTCConfig !== 'undefined' ? WebRTCConfig : null;
    }
    
    async initialize() {
        console.log('Initializing SIP Phone...');
        
        // First try backend connection
        const backendConnected = await this.connectBackend();
        
        if (backendConnected) {
            console.log('✅ Backend SIP connected successfully');
            this.mode = 'backend';
            this.isConnected = true;
            this.updateUI('connected', 'Backend SIP ulandi');
            return true;
        }
        
        // Fallback to WebRTC if backend fails
        console.log('⚠️ Backend connection failed, trying WebRTC...');
        const webrtcConnected = await this.connectWebRTC();
        
        if (webrtcConnected) {
            console.log('✅ WebRTC SIP connected successfully');
            this.mode = 'webrtc';
            this.isConnected = true;
            this.updateUI('connected', 'WebRTC ulandi');
            return true;
        }
        
        console.error('❌ Both backend and WebRTC connections failed');
        this.updateUI('disconnected', 'Ulanish xatosi');
        return false;
    }
    
    async connectBackend() {
        try {
            // Check backend status
            const response = await fetch(`${this.config.backendUrl}/api/sip/status`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Backend status:', data);
            
            // Setup WebSocket for real-time events
            this.setupBackendWebSocket();
            
            return data.registered || data.status === 'connected';
        } catch (error) {
            console.error('Backend connection error:', error);
            return false;
        }
    }
    
    setupBackendWebSocket() {
        if (this.socket) {
            this.socket.close();
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.socket = io(wsUrl, {
            transports: ['websocket'],
            secure: true,
            rejectUnauthorized: false
        });
        
        this.socket.on('connect', () => {
            console.log('WebSocket connected for backend events');
        });
        
        this.socket.on('sip-call-trying', (data) => {
            console.log('Call trying:', data);
            this.updateCallStatus('trying', 'Ulanmoqda...');
        });
        
        this.socket.on('sip-call-ringing', (data) => {
            console.log('Call ringing:', data);
            this.updateCallStatus('ringing', 'Jiringlamoqda...');
        });
        
        this.socket.on('sip-call-answered', (data) => {
            console.log('Call answered:', data);
            this.updateCallStatus('answered', 'Javob berildi');
            this.onCallAnswered();
        });
        
        this.socket.on('sip-call-failed', (data) => {
            console.log('Call failed:', data);
            this.updateCallStatus('failed', `Xato: ${data.reason}`);
            this.endCall();
        });
        
        this.socket.on('sip-call-ended', (data) => {
            console.log('Call ended:', data);
            this.updateCallStatus('ended', 'Qo\'ng\'iroq tugadi');
            this.endCall();
        });
    }
    
    async connectWebRTC() {
        try {
            if (!this.webrtcConfig || !this.webrtcConfig.isWebRTCSupported()) {
                throw new Error('WebRTC not supported');
            }
            
            // Initialize JsSIP
            const socket = new JsSIP.WebSocketInterface(this.config.wsServer);
            
            const configuration = {
                sockets: [socket],
                uri: this.config.uri,
                password: this.config.password,
                register: true,
                register_expires: 600,
                session_timers: false
            };
            
            this.userAgent = new JsSIP.UA(configuration);
            
            // Setup WebRTC event handlers
            this.setupWebRTCHandlers();
            
            // Start the user agent
            this.userAgent.start();
            
            // Wait for registration
            return new Promise((resolve) => {
                let timeout = setTimeout(() => resolve(false), 10000);
                
                this.userAgent.on('registered', () => {
                    clearTimeout(timeout);
                    resolve(true);
                });
                
                this.userAgent.on('registrationFailed', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            });
        } catch (error) {
            console.error('WebRTC connection error:', error);
            return false;
        }
    }
    
    setupWebRTCHandlers() {
        this.userAgent.on('registered', () => {
            console.log('WebRTC registered');
            this.updateUI('connected', 'WebRTC ulandi');
        });
        
        this.userAgent.on('unregistered', () => {
            console.log('WebRTC unregistered');
            this.updateUI('disconnected', 'WebRTC uzildi');
        });
        
        this.userAgent.on('newRTCSession', (data) => {
            const session = data.session;
            
            if (data.originator === 'local') {
                // Outgoing call
                this.currentCall = session;
                this.setupSessionHandlers(session);
            } else {
                // Incoming call - auto reject for now
                session.terminate();
            }
        });
    }
    
    setupSessionHandlers(session) {
        session.on('connecting', () => {
            this.updateCallStatus('connecting', 'Ulanmoqda...');
        });
        
        session.on('progress', () => {
            this.updateCallStatus('ringing', 'Jiringlamoqda...');
        });
        
        session.on('accepted', () => {
            this.updateCallStatus('answered', 'Javob berildi');
            this.onCallAnswered();
        });
        
        session.on('failed', (data) => {
            this.updateCallStatus('failed', `Xato: ${data.cause}`);
            this.endCall();
        });
        
        session.on('ended', () => {
            this.updateCallStatus('ended', 'Qo\'ng\'iroq tugadi');
            this.endCall();
        });
        
        // Setup DTMF sender
        session.on('newDTMF', (data) => {
            if (data.originator === 'remote') {
                console.log('Remote DTMF:', data.dtmf.tone);
            }
        });
    }
    
    async makeCall(phoneNumber, options = {}) {
        if (!this.isConnected) {
            console.error('SIP not connected');
            return false;
        }
        
        this.currentCall = {
            phoneNumber,
            startTime: Date.now(),
            options
        };
        
        if (this.mode === 'backend') {
            return this.makeBackendCall(phoneNumber, options);
        } else {
            return this.makeWebRTCCall(phoneNumber, options);
        }
    }
    
    async makeBackendCall(phoneNumber, options) {
        try {
            const response = await fetch(`${this.config.backendUrl}/api/sip/call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    phoneNumber,
                    ...options
                })
            });
            
            if (!response.ok) {
                throw new Error(`Call failed: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentCall.callId = data.callId;
            
            return true;
        } catch (error) {
            console.error('Backend call error:', error);
            this.updateCallStatus('failed', 'Qo\'ng\'iroq xatosi');
            return false;
        }
    }
    
    async makeWebRTCCall(phoneNumber, options) {
        try {
            const eventHandlers = {
                'progress': () => console.log('Call progress'),
                'failed': () => console.log('Call failed'),
                'ended': () => console.log('Call ended'),
                'confirmed': () => console.log('Call confirmed')
            };
            
            const mediaConstraints = await this.webrtcConfig.getUserMedia();
            
            const rtcOptions = {
                eventHandlers,
                mediaConstraints,
                pcConfig: {
                    iceServers: this.webrtcConfig.iceServers
                }
            };
            
            const uri = `sip:${phoneNumber}@${this.config.uri.split('@')[1]}`;
            const session = this.userAgent.call(uri, rtcOptions);
            
            this.currentCall = session;
            this.setupSessionHandlers(session);
            
            return true;
        } catch (error) {
            console.error('WebRTC call error:', error);
            this.updateCallStatus('failed', 'WebRTC xatosi');
            return false;
        }
    }
    
    async hangup() {
        if (!this.currentCall) return;
        
        if (this.mode === 'backend') {
            try {
                await fetch(`${this.config.backendUrl}/api/sip/hangup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        callId: this.currentCall.callId
                    })
                });
            } catch (error) {
                console.error('Hangup error:', error);
            }
        } else if (this.currentCall && this.currentCall.terminate) {
            this.currentCall.terminate();
        }
        
        this.endCall();
    }
    
    sendDTMF(digit) {
        if (!this.currentCall) return;
        
        console.log('Sending DTMF:', digit);
        
        if (this.mode === 'backend') {
            // Backend DTMF is handled automatically
            console.log('Backend will handle DTMF automatically');
        } else if (this.currentCall.sendDTMF) {
            // WebRTC DTMF
            const options = {
                duration: 200,
                interToneGap: 50
            };
            this.currentCall.sendDTMF(digit, options);
        }
    }
    
    onCallAnswered() {
        // Enable microphone if needed
        if (typeof enableMicrophone === 'function') {
            enableMicrophone();
        }
        
        // Update UI
        const micButton = document.getElementById('micButton');
        if (micButton) {
            micButton.disabled = false;
            micButton.classList.remove('disabled');
        }
    }
    
    endCall() {
        this.currentCall = null;
        
        // Disable microphone
        if (typeof disableMicrophone === 'function') {
            disableMicrophone();
        }
        
        // Update UI
        const micButton = document.getElementById('micButton');
        if (micButton) {
            micButton.disabled = true;
            micButton.classList.add('disabled');
        }
    }
    
    updateUI(status, message) {
        // Update connection status
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = status === 'connected' ? 'text-success' : 'text-danger';
        }
        
        // Update status indicator
        const indicator = document.getElementById('statusIndicator');
        if (indicator) {
            indicator.className = status === 'connected' ? 'status-indicator connected' : 'status-indicator disconnected';
        }
        
        // Emit event for other components
        window.dispatchEvent(new CustomEvent('sip-status-changed', {
            detail: { status, message }
        }));
    }
    
    updateCallStatus(status, message) {
        console.log(`Call status: ${status} - ${message}`);
        
        // Update call status display
        const callStatus = document.getElementById('callStatus');
        if (callStatus) {
            callStatus.textContent = message;
        }
        
        // Emit event
        window.dispatchEvent(new CustomEvent('call-status-changed', {
            detail: { status, message }
        }));
    }
    
    async getStatus() {
        return {
            mode: this.mode,
            connected: this.isConnected,
            inCall: !!this.currentCall
        };
    }
    
    destroy() {
        if (this.socket) {
            this.socket.disconnect();
        }
        
        if (this.userAgent) {
            this.userAgent.stop();
        }
        
        this.currentCall = null;
        this.isConnected = false;
    }
}

// Auto-initialize on load
let sipPhone = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load required scripts first
    const scripts = [
        '/js/webrtc-config.js'
    ];
    
    for (const script of scripts) {
        await new Promise((resolve, reject) => {
            const scriptElement = document.createElement('script');
            scriptElement.src = script;
            scriptElement.onload = resolve;
            scriptElement.onerror = reject;
            document.head.appendChild(scriptElement);
        });
    }
    
    // Initialize SIP phone
    sipPhone = new SIPPhoneFixed();
    window.sipPhone = sipPhone;
    
    await sipPhone.initialize();
});