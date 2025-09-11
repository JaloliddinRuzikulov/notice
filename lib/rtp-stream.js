/**
 * Simple RTP Streaming Module using Node.js
 * Converts and streams audio files over RTP without FFmpeg RTP issues
 */

const dgram = require('dgram');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

class RTPStream {
    constructor() {
        this.activeStreams = new Map();
    }

    /**
     * Convert audio file to raw PCM and stream via RTP
     */
    async streamAudio(audioFile, remoteIP, remotePort, localPort, callId) {
        try {
            const audioPath = path.join(__dirname, '../public/audio/uploads', audioFile);
            
            if (!fs.existsSync(audioPath)) {
                console.error('Audio file not found:', audioPath);
                return false;
            }

            console.log(`Starting RTP stream for ${callId}`);
            console.log(`Audio: ${audioPath} -> ${remoteIP}:${remotePort}`);

            // Create UDP socket for RTP
            const rtpSocket = dgram.createSocket('udp4');
            
            // Convert audio to PCM using FFmpeg (pipe mode)
            const ffmpeg = spawn('ffmpeg', [
                '-i', audioPath,
                '-ar', '8000',        // 8kHz sample rate
                '-ac', '1',           // Mono
                '-f', 's16le',        // Raw PCM 16-bit little-endian
                '-acodec', 'pcm_s16le',
                'pipe:1'              // Output to stdout
            ]);

            let sequenceNumber = Math.floor(Math.random() * 65535);
            let timestamp = Math.floor(Math.random() * 0x7FFFFFFF);
            const ssrc = Math.floor(Math.random() * 0x7FFFFFFF);
            let packetCount = 0;
            
            // Buffer to accumulate PCM data
            let pcmBuffer = Buffer.alloc(0);
            const SAMPLES_PER_PACKET = 160; // 20ms at 8kHz
            const BYTES_PER_SAMPLE = 2;     // 16-bit PCM
            const PACKET_SIZE = SAMPLES_PER_PACKET * BYTES_PER_SAMPLE;

            // Process PCM data and create RTP packets
            ffmpeg.stdout.on('data', (chunk) => {
                // Accumulate PCM data
                pcmBuffer = Buffer.concat([pcmBuffer, chunk]);
                
                // Send packets when we have enough data
                while (pcmBuffer.length >= PACKET_SIZE) {
                    const pcmData = pcmBuffer.slice(0, PACKET_SIZE);
                    pcmBuffer = pcmBuffer.slice(PACKET_SIZE);
                    
                    // Convert PCM to μ-law
                    const mulawData = this.pcmToMulaw(pcmData);
                    
                    // Create RTP packet
                    const rtpPacket = this.createRTPPacket(
                        mulawData,
                        sequenceNumber,
                        timestamp,
                        ssrc
                    );
                    
                    // Send RTP packet
                    rtpSocket.send(rtpPacket, remotePort, remoteIP, (err) => {
                        if (err && packetCount === 0) {
                            console.error('RTP send error:', err);
                        }
                    });
                    
                    packetCount++;
                    sequenceNumber = (sequenceNumber + 1) & 0xFFFF;
                    timestamp = (timestamp + SAMPLES_PER_PACKET) & 0xFFFFFFFF;
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Error') || output.includes('Invalid')) {
                    console.error('FFmpeg error:', output);
                }
            });

            ffmpeg.on('close', (code) => {
                console.log(`Audio conversion finished with code ${code}`);
                rtpSocket.close();
                this.activeStreams.delete(callId);
                
                if (code === 0) {
                    console.log(`Successfully streamed ${packetCount} RTP packets`);
                }
            });

            ffmpeg.on('error', (err) => {
                console.error('FFmpeg spawn error:', err);
                rtpSocket.close();
                this.activeStreams.delete(callId);
            });

            // Store stream info
            this.activeStreams.set(callId, {
                ffmpeg,
                rtpSocket,
                startTime: Date.now(),
                packetCount: 0
            });

            // Set up packet pacing (20ms intervals)
            const pacingInterval = setInterval(() => {
                const stream = this.activeStreams.get(callId);
                if (!stream) {
                    clearInterval(pacingInterval);
                }
            }, 20);

            return true;
        } catch (error) {
            console.error('RTP streaming error:', error);
            return false;
        }
    }

    /**
     * Create RTP packet with proper headers
     */
    createRTPPacket(payload, sequenceNumber, timestamp, ssrc) {
        const header = Buffer.alloc(12);
        
        // Byte 0: Version (2), Padding (0), Extension (0), CSRC count (0)
        header[0] = 0x80;
        
        // Byte 1: Marker (0), Payload type (0 for PCMU)
        header[1] = 0x00;
        
        // Bytes 2-3: Sequence number
        header.writeUInt16BE(sequenceNumber, 2);
        
        // Bytes 4-7: Timestamp
        header.writeUInt32BE(timestamp >>> 0, 4);
        
        // Bytes 8-11: SSRC
        header.writeUInt32BE(ssrc >>> 0, 8);
        
        return Buffer.concat([header, payload]);
    }

    /**
     * Convert 16-bit PCM to μ-law (G.711)
     */
    pcmToMulaw(pcmBuffer) {
        const mulaw = Buffer.alloc(pcmBuffer.length / 2);
        
        for (let i = 0; i < pcmBuffer.length; i += 2) {
            // Read 16-bit sample (little-endian)
            let sample = pcmBuffer.readInt16LE(i);
            
            // Convert to μ-law
            mulaw[i / 2] = this.linearToMulaw(sample);
        }
        
        return mulaw;
    }

    /**
     * Convert linear PCM value to μ-law
     */
    linearToMulaw(sample) {
        const MULAW_MAX = 0x1FFF;
        const MULAW_BIAS = 132;
        const sign = (sample >> 8) & 0x80;
        
        if (sign !== 0) {
            sample = -sample;
        }
        
        sample = Math.min(sample, MULAW_MAX);
        sample += MULAW_BIAS;
        
        const exponent = Math.floor(Math.log2(sample)) - 7;
        const mantissa = (sample >> (exponent + 3)) & 0x0F;
        const mulaw = ~(sign | (exponent << 4) | mantissa);
        
        return mulaw & 0xFF;
    }

    /**
     * Stop streaming for a call
     */
    stopStream(callId) {
        const stream = this.activeStreams.get(callId);
        if (stream) {
            console.log(`Stopping RTP stream for ${callId}`);
            if (stream.ffmpeg) {
                stream.ffmpeg.kill('SIGTERM');
            }
            if (stream.rtpSocket) {
                stream.rtpSocket.close();
            }
            this.activeStreams.delete(callId);
        }
    }
}

module.exports = RTPStream;