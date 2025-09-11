const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class CallRecorder extends EventEmitter {
    constructor() {
        super();
        this.recordings = new Map();
        this.rtpPort = 20000; // RTP port for receiving audio
        this.socket = null;
    }

    startRecording(callId, outputFile) {
        console.log(`Starting recording for call ${callId} to ${outputFile}`);
        
        // Create UDP socket for RTP
        this.socket = dgram.createSocket('udp4');
        
        const recording = {
            callId: callId,
            outputFile: outputFile,
            pcmBuffer: [],
            packetsReceived: 0,
            startTime: Date.now()
        };
        
        this.recordings.set(callId, recording);
        
        this.socket.on('message', (msg, rinfo) => {
            // RTP packet received
            if (msg.length > 12) {
                // Extract RTP payload (skip 12-byte header)
                const payload = msg.slice(12);
                recording.packetsReceived++;
                
                // Convert μ-law to PCM
                const pcmData = Buffer.alloc(payload.length * 2);
                for (let i = 0; i < payload.length; i++) {
                    const sample = this.ulawToPcm(payload[i]);
                    pcmData.writeInt16LE(sample, i * 2);
                }
                
                recording.pcmBuffer.push(pcmData);
                
                if (recording.packetsReceived % 100 === 0) {
                    console.log(`Received ${recording.packetsReceived} RTP packets`);
                }
            }
        });
        
        this.socket.bind(this.rtpPort, () => {
            console.log(`RTP recorder listening on port ${this.rtpPort}`);
            this.emit('recording-started', { callId, port: this.rtpPort });
        });
        
        return this.rtpPort;
    }
    
    stopRecording(callId) {
        const recording = this.recordings.get(callId);
        if (!recording) {
            console.error('Recording not found:', callId);
            return;
        }
        
        console.log(`Stopping recording for call ${callId}`);
        console.log(`Total packets received: ${recording.packetsReceived}`);
        
        // Close socket
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        // Combine all PCM buffers
        const totalPcm = Buffer.concat(recording.pcmBuffer);
        
        // Create WAV file
        const wavBuffer = this.createWavFile(totalPcm, 8000, 1, 16);
        fs.writeFileSync(recording.outputFile, wavBuffer);
        console.log(`Recording saved to ${recording.outputFile}`);
        
        // Convert to WebM for broadcast
        const webmFile = recording.outputFile.replace('.wav', '.webm');
        const { spawn } = require('child_process');
        const ffmpeg = spawn('ffmpeg', [
            '-i', recording.outputFile,
            '-c:a', 'libopus',
            '-b:a', '64k',
            webmFile,
            '-y'
        ]);
        
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log(`Converted to WebM: ${webmFile}`);
                this.emit('recording-completed', { 
                    callId, 
                    wavFile: recording.outputFile,
                    webmFile: webmFile,
                    duration: (Date.now() - recording.startTime) / 1000,
                    packets: recording.packetsReceived
                });
            }
        });
        
        this.recordings.delete(callId);
    }
    
    ulawToPcm(ulawByte) {
        const BIAS = 0x84;
        const CLIP = 32635;
        
        ulawByte = ~ulawByte;
        const sign = ulawByte & 0x80;
        const exponent = (ulawByte >> 4) & 0x07;
        const mantissa = ulawByte & 0x0F;
        
        let sample = ((mantissa << 3) + BIAS) << exponent;
        sample = sample - BIAS;
        
        if (sign === 0) sample = -sample;
        
        return sample > CLIP ? CLIP : (sample < -CLIP ? -CLIP : sample);
    }
    
    createWavFile(pcmData, sampleRate, channels, bitsPerSample) {
        const dataSize = pcmData.length;
        const headerSize = 44;
        const fileSize = dataSize + headerSize - 8;
        
        const buffer = Buffer.alloc(headerSize + dataSize);
        
        // RIFF header
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(fileSize, 4);
        buffer.write('WAVE', 8);
        
        // fmt chunk
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16); // fmt chunk size
        buffer.writeUInt16LE(1, 20); // PCM format
        buffer.writeUInt16LE(channels, 22);
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, 28); // byte rate
        buffer.writeUInt16LE(channels * bitsPerSample / 8, 32); // block align
        buffer.writeUInt16LE(bitsPerSample, 34);
        
        // data chunk
        buffer.write('data', 36);
        buffer.writeUInt32LE(dataSize, 40);
        
        // Copy PCM data
        pcmData.copy(buffer, 44);
        
        return buffer;
    }
}

module.exports = CallRecorder;