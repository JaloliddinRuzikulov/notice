/**
 * Fixed RTP Sender for ZTE Softswitch
 * Ensures correct port binding and audio streaming
 */

const dgram = require('dgram');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class RTPSender extends EventEmitter {
    constructor() {
        super();
        this.activeStreams = new Map();
    }

    async startStream(callId, audioFile, options) {
        const { remoteIP, remotePort, localPort, codec } = options;
        
        console.log(`[RTP] Starting stream for ${callId}`);
        console.log(`[RTP] Audio: ${audioFile} -> ${remoteIP}:${remotePort}`);
        console.log(`[RTP] Local port: ${localPort}`);
        
        // Check if stream already exists
        if (this.activeStreams.has(callId)) {
            console.log('[RTP] Stream already active for call:', callId);
            return false;
        }

        // Find audio file
        let audioPath = audioFile;
        if (!fs.existsSync(audioPath)) {
            audioPath = path.join(__dirname, '../public/audio/uploads', audioFile);
            if (!fs.existsSync(audioPath)) {
                console.error('[RTP] Audio file not found:', audioFile);
                return false;
            }
        }
        
        console.log('[RTP] Using audio file:', audioPath);

        try {
            // Create RTP socket with SPECIFIC port
            const rtpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
            
            // CRITICAL: Use exact port specified in SDP (dynamic allocation)
            const actualLocalPort = localPort;
            const bindInterface = '172.26.129.171';
            
            console.log(`[RTP] Binding to ${bindInterface}:${actualLocalPort}...`);
            
            // Bind with promise to ensure it completes
            await new Promise((resolve, reject) => {
                rtpSocket.bind(actualLocalPort, bindInterface, (err) => {
                    if (err) {
                        console.error('[RTP] Bind error:', err);
                        reject(err);
                    } else {
                        const addr = rtpSocket.address();
                        console.log(`[RTP] ✅ Bound to ${addr.address}:${addr.port}`);
                        
                        if (addr.port !== actualLocalPort) {
                            console.error(`[RTP] ⚠️ PORT MISMATCH! Requested ${actualLocalPort}, got ${addr.port}`);
                            console.error('[RTP] This will cause audio issues!');
                        }
                        
                        resolve();
                    }
                });
            });

            // Store stream info
            this.activeStreams.set(callId, { socket: rtpSocket, active: true });

            // RTP parameters
            let sequenceNumber = Math.floor(Math.random() * 0xFFFF);
            let timestamp = Math.floor(Math.random() * 0x7FFFFFFF);
            const ssrc = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
            let packetsSent = 0;
            let bytesStreamed = 0;

            // FFmpeg for audio processing
            const ffmpegArgs = [
                '-i', audioPath,
                '-af', 'volume=2.0,highpass=f=300,lowpass=f=3400',
                '-acodec', 'pcm_alaw',
                '-ar', '8000',
                '-ac', '1',
                '-f', 'alaw',
                'pipe:1'
            ];

            console.log('[RTP] FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

            const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
                stdio: ['ignore', 'pipe', 'pipe']
            });

            // Buffer for audio data
            let buffer = Buffer.alloc(0);
            const PACKET_SIZE = 160; // 20ms at 8kHz
            let isFirstPacket = true;

            // Create and send RTP packet
            const sendRTPPacket = (audioData) => {
                const packet = Buffer.alloc(12 + audioData.length);
                
                // RTP header
                packet[0] = 0x80; // V=2, P=0, X=0, CC=0
                packet[1] = isFirstPacket ? 0x88 : 0x08; // M=1 for first, PT=8 (PCMA)
                
                packet.writeUInt16BE(sequenceNumber, 2);
                packet.writeUInt32BE(timestamp, 4);
                packet.writeUInt32BE(ssrc, 8);
                
                audioData.copy(packet, 12);
                
                // Send packet
                rtpSocket.send(packet, remotePort, remoteIP, (err) => {
                    if (err) {
                        console.error(`[RTP] Send error (packet ${packetsSent}):`, err);
                    } else if (packetsSent === 0) {
                        console.log(`[RTP] ✅ First packet sent to ${remoteIP}:${remotePort}`);
                        console.log(`[RTP] Packet size: ${packet.length} bytes`);
                    }
                });
                
                packetsSent++;
                bytesStreamed += packet.length;
                sequenceNumber = (sequenceNumber + 1) & 0xFFFF;
                timestamp = (timestamp + PACKET_SIZE) & 0x7FFFFFFF;
                isFirstPacket = false;
                
                if (packetsSent % 50 === 0) {
                    console.log(`[RTP] Progress: ${packetsSent} packets, ${bytesStreamed} bytes`);
                }
            };

            // Packet queue and timer
            const packetQueue = [];
            let ffmpegFinished = false;
            
            // Send packets at exact 20ms intervals
            const sendTimer = setInterval(() => {
                if (packetQueue.length > 0) {
                    const packet = packetQueue.shift();
                    sendRTPPacket(packet);
                } else if (ffmpegFinished && packetsSent > 0) {
                    // Stream complete
                    clearInterval(sendTimer);
                    console.log(`[RTP] ✅ Stream complete: ${packetsSent} packets (${bytesStreamed} bytes)`);
                    
                    setTimeout(() => {
                        rtpSocket.close();
                        this.activeStreams.delete(callId);
                        this.emit('stream-complete', { callId, packetsSent, bytesStreamed });
                    }, 500);
                }
            }, 20);

            // Process FFmpeg output
            ffmpeg.stdout.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
                
                // Extract 160-byte packets
                while (buffer.length >= PACKET_SIZE) {
                    packetQueue.push(buffer.slice(0, PACKET_SIZE));
                    buffer = buffer.slice(PACKET_SIZE);
                }
            });

            ffmpeg.on('close', (code) => {
                ffmpegFinished = true;
                console.log('[RTP] FFmpeg finished, code:', code);
                
                // Add remaining buffer
                if (buffer.length > 0) {
                    // Pad to 160 bytes with silence
                    const padded = Buffer.concat([
                        buffer,
                        Buffer.alloc(PACKET_SIZE - buffer.length, 0xFF)
                    ]);
                    packetQueue.push(padded);
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                const msg = data.toString();
                if (msg.includes('error') || msg.includes('Error')) {
                    console.error('[RTP] FFmpeg error:', msg);
                }
            });

            return true;

        } catch (error) {
            console.error('[RTP] Stream error:', error);
            this.emit('stream-complete', { callId, packetsSent: 0, error: error.message });
            return false;
        }
    }

    stopStream(callId) {
        const stream = this.activeStreams.get(callId);
        if (stream) {
            stream.active = false;
            if (stream.socket) {
                stream.socket.close();
            }
            this.activeStreams.delete(callId);
        }
    }

    stopAllStreams() {
        for (const [callId, stream] of this.activeStreams) {
            this.stopStream(callId);
        }
    }
}

module.exports = RTPSender;
