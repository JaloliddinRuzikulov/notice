/**
 * WebRTC Broadcast Module
 * Handles audio streaming during broadcast calls
 */

class WebRTCBroadcast {
    constructor() {
        this.sipUA = null;
        this.activeCalls = new Map();
        this.audioPlayer = null;
    }

    // Initialize WebRTC SIP
    async initialize(config) {
        try {
            const server = new SIP.UserAgent({
                uri: SIP.UserAgent.makeURI(`sip:${config.username}@${config.server}`),
                transportOptions: {
                    server: `wss://${config.server}:8089/ws`,
                    traceSip: true
                },
                authorizationUsername: config.username,
                authorizationPassword: config.password,
                sessionDescriptionHandlerFactoryOptions: {
                    constraints: {
                        audio: true,
                        video: false
                    }
                }
            });

            this.sipUA = server;

            // Start the UserAgent
            await server.start();
            console.log('WebRTC SIP UserAgent started');

            // Register
            const registerer = new SIP.Registerer(server);
            await registerer.register();
            console.log('WebRTC SIP registered');

            return true;
        } catch (error) {
            console.error('WebRTC SIP initialization failed:', error);
            return false;
        }
    }

    // Make broadcast call with audio
    async makeCallWithAudio(phoneNumber, audioFile) {
        try {
            console.log(`Making call to ${phoneNumber} with audio ${audioFile}`);
            
            // Create audio element for playback
            const audio = new Audio(`/audio/uploads/${audioFile}`);
            
            // Get audio stream
            const stream = audio.captureStream ? audio.captureStream() : audio.mozCaptureStream();
            
            // Create invitation
            const target = SIP.UserAgent.makeURI(`sip:${phoneNumber}@${this.sipUA.configuration.uri.host}`);
            const inviter = new SIP.Inviter(this.sipUA, target, {
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false
                    }
                }
            });

            // Handle session state changes
            inviter.stateChange.addListener((state) => {
                console.log(`Call state changed to: ${state}`);
                
                if (state === SIP.SessionState.Established) {
                    console.log('Call established, playing audio');
                    
                    // Replace the outgoing stream with our audio
                    const pc = inviter.sessionDescriptionHandler.peerConnection;
                    const senders = pc.getSenders();
                    
                    if (senders.length > 0 && stream.getAudioTracks().length > 0) {
                        senders[0].replaceTrack(stream.getAudioTracks()[0]);
                    }
                    
                    // Play the audio
                    audio.play();
                    
                    // Store call info
                    this.activeCalls.set(phoneNumber, {
                        inviter: inviter,
                        audio: audio,
                        startTime: new Date()
                    });
                } else if (state === SIP.SessionState.Terminated) {
                    console.log('Call terminated');
                    
                    // Clean up
                    const callInfo = this.activeCalls.get(phoneNumber);
                    if (callInfo) {
                        callInfo.audio.pause();
                        this.activeCalls.delete(phoneNumber);
                    }
                }
            });

            // Send the invitation
            await inviter.invite();
            
            return { success: true, message: 'Call initiated' };
        } catch (error) {
            console.error('Error making call:', error);
            return { success: false, error: error.message };
        }
    }

    // Process broadcast with multiple recipients
    async processBroadcast(broadcast) {
        const results = [];
        
        for (const employee of broadcast.employees) {
            try {
                const result = await this.makeCallWithAudio(
                    employee.phoneNumber, 
                    broadcast.audioFile
                );
                
                results.push({
                    phoneNumber: employee.phoneNumber,
                    ...result
                });
                
                // Small delay between calls
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                results.push({
                    phoneNumber: employee.phoneNumber,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // Hang up all active calls
    hangupAll() {
        this.activeCalls.forEach((callInfo, phoneNumber) => {
            try {
                callInfo.inviter.bye();
                callInfo.audio.pause();
            } catch (error) {
                console.error(`Error hanging up call to ${phoneNumber}:`, error);
            }
        });
        
        this.activeCalls.clear();
    }
}

// Export for use in other modules
window.WebRTCBroadcast = WebRTCBroadcast;