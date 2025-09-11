const CallRecorder = require('./call-recorder');
const path = require('path');
const fs = require('fs');

class IncomingCallHandler {
    constructor(sipBackend) {
        this.sipBackend = sipBackend;
        this.recorder = new CallRecorder();
        this.activeRecording = null;
        
        // Listen for incoming calls
        this.setupCallHandlers();
    }
    
    setupCallHandlers() {
        // Override handleInvite method in SIP backend
        const originalHandleInvite = this.sipBackend.handleInvite.bind(this.sipBackend);
        
        this.sipBackend.handleInvite = (data) => {
            console.log('\n=== INCOMING CALL DETECTED ===');
            
            // Parse SIP INVITE
            const lines = data.toString().split('\r\n');
            let fromNumber = '';
            let callId = '';
            
            lines.forEach(line => {
                if (line.startsWith('From:')) {
                    const match = line.match(/sip:(\d+)@/);
                    if (match) fromNumber = match[1];
                }
                if (line.startsWith('Call-ID:')) {
                    callId = line.split(':')[1].trim();
                }
            });
            
            console.log(`Incoming call from: ${fromNumber}`);
            console.log(`Call ID: ${callId}`);
            
            // Check if this is from our test number
            if (fromNumber === '0990823112') {
                console.log('📞 Test call detected! Answering and recording...');
                
                // Answer the call
                this.answerAndRecord(data, callId);
            } else {
                // Let original handler process it
                originalHandleInvite(data);
            }
        };
    }
    
    answerAndRecord(inviteData, callId) {
        // Send 200 OK to answer the call
        const lines = inviteData.toString().split('\r\n');
        const headers = {};
        
        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':', 2);
                headers[key.toLowerCase().trim()] = value.trim();
            }
        });
        
        // Start recording
        const recordingPath = path.join(__dirname, '../public/audio/recordings');
        if (!fs.existsSync(recordingPath)) {
            fs.mkdirSync(recordingPath, { recursive: true });
        }
        
        const filename = `recording_${Date.now()}.wav`;
        const filepath = path.join(recordingPath, filename);
        
        const rtpPort = this.recorder.startRecording(callId, filepath);
        
        // Create SDP for answer
        const sdp = this.createAnswerSDP(rtpPort);
        
        // Send 200 OK
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers.via}`,
            `From: ${headers.from}`,
            `To: ${headers.to};tag=${this.generateTag()}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers.cseq}`,
            `Contact: <sip:5530@${this.sipBackend.getLocalIP()}:${this.sipBackend.socket.address().port}>`,
            'Content-Type: application/sdp',
            `Content-Length: ${sdp.length}`,
            '',
            sdp
        ].join('\r\n');
        
        this.sipBackend.sendMessage(response);
        console.log('📞 Call answered, recording started...');
        
        this.activeRecording = {
            callId: callId,
            startTime: Date.now()
        };
        
        // Auto hangup after 10 seconds
        setTimeout(() => {
            if (this.activeRecording && this.activeRecording.callId === callId) {
                console.log('⏰ Auto hanging up after 10 seconds...');
                this.hangupRecording(callId);
            }
        }, 10000);
        
        // Listen for recording completion
        this.recorder.once('recording-completed', (data) => {
            console.log('\n✅ Recording completed!');
            console.log(`- Duration: ${data.duration} seconds`);
            console.log(`- Packets: ${data.packets}`);
            console.log(`- WAV file: ${data.wavFile}`);
            console.log(`- WebM file: ${data.webmFile}`);
            
            // Now make a test call with the recorded audio
            setTimeout(() => {
                this.makeTestCallWithRecording(data.webmFile);
            }, 3000);
        });
    }
    
    hangupRecording(callId) {
        if (this.activeRecording && this.activeRecording.callId === callId) {
            console.log('📞 Hanging up recorded call...');
            this.recorder.stopRecording(callId);
            this.activeRecording = null;
            
            // Send BYE
            // ... (simplified for now)
        }
    }
    
    makeTestCallWithRecording(webmFile) {
        console.log('\n🔄 Making test call with recorded audio...');
        
        const audioFileName = path.basename(webmFile);
        
        // Use the SIP backend to make a call
        this.sipBackend.makeCall('0990823112', {
            audioFile: audioFileName,
            broadcastId: 'test-recording-playback',
            employeeId: 'test'
        }).then(result => {
            console.log('✅ Test call initiated:', result);
        }).catch(error => {
            console.error('❌ Test call failed:', error);
        });
    }
    
    createAnswerSDP(rtpPort) {
        const localIP = this.sipBackend.getLocalIP();
        return [
            'v=0',
            `o=- ${Date.now()} ${Date.now()} IN IP4 ${localIP}`,
            's=Recording Session',
            `c=IN IP4 ${localIP}`,
            't=0 0',
            `m=audio ${rtpPort} RTP/AVP 0 101`,
            'a=rtpmap:0 PCMU/8000',
            'a=rtpmap:101 telephone-event/8000',
            'a=fmtp:101 0-16',
            'a=sendrecv'
        ].join('\r\n');
    }
    
    generateTag() {
        return Math.random().toString(36).substr(2, 10);
    }
}

module.exports = IncomingCallHandler;