/**
 * WebRTC Configuration for SIP Phone
 * Handles WebRTC connection setup with proper ICE and media constraints
 */

const WebRTCConfig = {
    // ICE Servers configuration
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ],
    
    // Media constraints
    mediaConstraints: {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 8000 // Match Asterisk's expected sample rate
        },
        video: false
    },
    
    // SDP constraints
    sdpConstraints: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
    },
    
    // Codec preferences (prioritize PCMU/PCMA for Asterisk compatibility)
    codecPreferences: ['PCMU', 'PCMA', 'opus'],
    
    // DTMF configuration
    dtmfOptions: {
        duration: 200,
        interToneGap: 50,
        useInbandDTMF: false // Use RFC 2833 DTMF
    },
    
    // Connection timeouts
    timeouts: {
        registration: 10000,
        call: 30000,
        iceGathering: 5000
    },
    
    // Helper function to modify SDP for better compatibility
    modifySDP: function(sdp) {
        // Force specific codecs
        let modifiedSDP = sdp;
        
        // Prioritize PCMU (0) and PCMA (8)
        modifiedSDP = modifiedSDP.replace(/m=audio (\d+) ([A-Z]+)\/([A-Z]+) (.*)/, 
            'm=audio $1 $2/$3 0 8 101');
        
        // Add telephony-event for DTMF
        if (!modifiedSDP.includes('a=rtpmap:101')) {
            modifiedSDP += 'a=rtpmap:101 telephone-event/8000\r\n';
            modifiedSDP += 'a=fmtp:101 0-16\r\n';
        }
        
        // Set ptime to 20ms (standard for telephony)
        if (!modifiedSDP.includes('a=ptime:')) {
            modifiedSDP = modifiedSDP.replace(/(m=audio.*\r\n)/, '$1a=ptime:20\r\n');
        }
        
        return modifiedSDP;
    },
    
    // Create peer connection with optimal settings
    createPeerConnection: function() {
        const pc = new RTCPeerConnection({
            iceServers: this.iceServers,
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        });
        
        // Set codec preferences if supported
        if (pc.getTransceivers && pc.getTransceivers().length > 0) {
            const transceiver = pc.getTransceivers()[0];
            if (transceiver.setCodecPreferences) {
                const codecs = RTCRtpSender.getCapabilities('audio').codecs;
                const preferredCodecs = codecs.filter(codec => 
                    this.codecPreferences.includes(codec.mimeType.split('/')[1].toUpperCase())
                );
                if (preferredCodecs.length > 0) {
                    transceiver.setCodecPreferences(preferredCodecs);
                }
            }
        }
        
        return pc;
    },
    
    // Get user media with fallback options
    getUserMedia: async function() {
        try {
            // Try with ideal constraints first
            return await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
        } catch (error) {
            console.warn('Failed to get media with ideal constraints, trying fallback:', error);
            
            // Fallback to basic audio
            try {
                return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } catch (fallbackError) {
                console.error('Failed to get any media:', fallbackError);
                throw fallbackError;
            }
        }
    },
    
    // Check WebRTC support
    isWebRTCSupported: function() {
        return !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia &&
            window.RTCPeerConnection
        );
    },
    
    // Get connection stats
    getConnectionStats: async function(peerConnection) {
        const stats = await peerConnection.getStats();
        const report = {
            audio: {
                bytesSent: 0,
                bytesReceived: 0,
                packetsLost: 0,
                jitter: 0,
                roundTripTime: 0
            },
            connection: {
                state: peerConnection.connectionState,
                iceState: peerConnection.iceConnectionState,
                signalingState: peerConnection.signalingState
            }
        };
        
        stats.forEach(stat => {
            if (stat.type === 'outbound-rtp' && stat.mediaType === 'audio') {
                report.audio.bytesSent = stat.bytesSent;
                report.audio.packetsSent = stat.packetsSent;
            } else if (stat.type === 'inbound-rtp' && stat.mediaType === 'audio') {
                report.audio.bytesReceived = stat.bytesReceived;
                report.audio.packetsReceived = stat.packetsReceived;
                report.audio.packetsLost = stat.packetsLost || 0;
                report.audio.jitter = stat.jitter || 0;
            } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                report.audio.roundTripTime = stat.currentRoundTripTime || 0;
            }
        });
        
        return report;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRTCConfig;
}