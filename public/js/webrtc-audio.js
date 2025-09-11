// WebRTC Audio Handler for SIP calls
class WebRTCAudio {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.isConnected = false;
        this.audioContext = null;
        this.gainNode = null;
    }

    // Initialize WebRTC peer connection
    async initializePeerConnection(config) {
        try {
            // Get user media first
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                },
                video: false
            });
            
            console.log('Mikrofon ruxsati olindi');
            
            // Create peer connection
            const iceServers = config?.iceServers || [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:10.105.0.3:3478' } // Local STUN if available
            ];
            
            this.peerConnection = new RTCPeerConnection({
                iceServers: iceServers,
                iceCandidatePoolSize: 10
            });
            
            // Add local stream
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
            
            // Handle remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('Remote track received');
                if (event.streams && event.streams[0]) {
                    this.remoteStream = event.streams[0];
                    this.playRemoteAudio();
                }
            };
            
            // ICE candidate handling
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('New ICE candidate:', event.candidate.candidate);
                    // Send to signaling server if needed
                }
            };
            
            // Connection state monitoring
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    this.isConnected = true;
                    this.onConnected();
                }
            };
            
            return true;
        } catch (error) {
            console.error('WebRTC initialization error:', error);
            return false;
        }
    }
    
    // Create offer for outgoing calls
    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
            });
            
            await this.peerConnection.setLocalDescription(offer);
            return offer.sdp;
        } catch (error) {
            console.error('Create offer error:', error);
            return null;
        }
    }
    
    // Handle answer from remote
    async handleAnswer(sdp) {
        try {
            const answer = new RTCSessionDescription({
                type: 'answer',
                sdp: sdp
            });
            
            await this.peerConnection.setRemoteDescription(answer);
            console.log('Remote answer set successfully');
            return true;
        } catch (error) {
            console.error('Handle answer error:', error);
            return false;
        }
    }
    
    // Play remote audio
    playRemoteAudio() {
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio && this.remoteStream) {
            remoteAudio.srcObject = this.remoteStream;
            remoteAudio.play().catch(e => console.error('Play error:', e));
            
            // Create audio context for volume control
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = this.audioContext.createMediaStreamSource(this.remoteStream);
                this.gainNode = this.audioContext.createGain();
                source.connect(this.gainNode);
                this.gainNode.connect(this.audioContext.destination);
            }
            
            console.log('Remote audio playing');
        }
    }
    
    // Mute/unmute microphone
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled;
            }
        }
        return false;
    }
    
    // Set volume
    setVolume(level) {
        if (this.gainNode) {
            this.gainNode.gain.value = level;
        }
    }
    
    // Get audio levels
    getAudioLevels() {
        if (!this.audioContext || !this.remoteStream) return 0;
        
        const analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(this.remoteStream);
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        return average / 255; // Normalize to 0-1
    }
    
    // Connection callback
    onConnected() {
        console.log('WebRTC Audio connected!');
        // Emit event or callback
        window.dispatchEvent(new CustomEvent('webrtc-audio-connected'));
    }
    
    // Cleanup
    destroy() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        const remoteAudio = document.getElementById('remoteAudio');
        if (remoteAudio) {
            remoteAudio.srcObject = null;
        }
        
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.isConnected = false;
    }
}

// Export for use
window.WebRTCAudio = WebRTCAudio;