const dgram = require('dgram');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

class SimpleRTPStream {
    constructor() {
        this.activeStreams = new Map();
    }

    async streamAudio(audioFile, remoteIP, remotePort, localPort, callId, options = {}) {
        console.log(`Starting RTP stream for ${callId}`);
        console.log(`Audio: ${audioFile} -> ${remoteIP}:${remotePort}`);
        const repeat = options.repeat || 1;
        console.log(`Will repeat audio ${repeat} times`);
        
        try {
            const audioPath = audioFile.startsWith('/') ? audioFile : 
                path.join(__dirname, '../public/audio/uploads', audioFile);
            
            console.log(`Checking audio file: ${audioPath}`);
            
            if (!fs.existsSync(audioPath)) {
                console.error(`Audio file not found: ${audioPath}`);
                console.error(`Current directory: ${__dirname}`);
                console.error(`Full path attempted: ${audioPath}`);
                return false;
            }
            
            const stats = fs.statSync(audioPath);
            console.log(`Audio file found: ${audioPath}, Size: ${stats.size} bytes`);
            
            if (stats.size === 0) {
                console.error(`Audio file is empty: ${audioPath}`);
                return false;
            }

            // Create RTP socket
            const rtpSocket = dgram.createSocket('udp4');
            
            // Bind to local port
            rtpSocket.bind(localPort, () => {
                console.log(`RTP socket bound to port ${localPort}`);
            });
            
            // TTS faylmi yoki oddiy audio faylmi aniqlash
            const isTTS = audioPath.includes('tts-');
            console.log(`Audio type: ${isTTS ? 'TTS' : 'Regular'}`);
            
            // Telefon uchun optimallashtirilgan FFmpeg
            const ffmpegArgs = [
                // Input sozlamalari
                '-re', // Real-time reading
                '-fflags', '+genpts', // Generate timestamps
            ];
            
            // Add stream_loop only if repeat > 1
            if (repeat > 1) {
                ffmpegArgs.push('-stream_loop', String(repeat - 1));
            }
            
            // Check if input is already A-law to avoid double conversion
            const isAlreadyAlaw = audioPath.includes('processed_');
            
            // Process audio with FFmpeg for better quality
            // Adjust audio filters based on whether it's already processed
            const filters = [];
            
            // Basic resampling to 8kHz
            filters.push('aresample=8000');
            
            // Compression and normalization
            filters.push('acompressor=threshold=0.089:ratio=9:attack=5:release=50');
            
            // Volume adjustment - be careful not to over-amplify
            filters.push('volume=10.0'); // 10x volume boost for ZTE
            
            // Final limiter to prevent clipping
            filters.push('alimiter=limit=0.95');
            
            const audioFilters = filters.join(',');
            
            ffmpegArgs.push(
                '-i', audioPath,
                '-af', audioFilters
            );
            
            // Always decode and re-encode to ensure proper RTP streaming
            ffmpegArgs.push(
                '-acodec', 'pcm_alaw',   // Always output A-law
                '-ar', '8000',
                '-ac', '1',
                '-f', 'alaw'  // Raw A-law format
            );
            
            // Streaming parameters for TTS
            if (isTTS) {
                ffmpegArgs.push(
                    '-fflags', '+genpts+discardcorrupt',
                    '-flags', '+global_header',
                    '-avoid_negative_ts', 'make_zero'
                );
            }
            
            // Pipe output
            ffmpegArgs.push('pipe:1');
            
            console.log('FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
            
            let ffmpeg;
            try {
                ffmpeg = spawn('ffmpeg', ffmpegArgs);
            } catch (spawnError) {
                console.error('Failed to spawn FFmpeg:', spawnError);
                rtpSocket.close();
                return false;
            }
            
            // Check if FFmpeg process started successfully
            if (!ffmpeg || !ffmpeg.pid) {
                console.error('FFmpeg process failed to start');
                rtpSocket.close();
                return false;
            }
            
            console.log(`FFmpeg process started with PID: ${ffmpeg.pid}`);

            let sequenceNumber = Math.floor(Math.random() * 65536);
            let timestamp = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0; // Random initial timestamp
            const ssrc = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
            let packetsSent = 0;
            
            // Jitter buffer va pacing uchun
            const PACKET_SIZE = 160; // 20ms @ 8kHz (G.711 standard)
            const PACKET_INTERVAL = 20; // milliseconds (50 packets/second)
            let buffer = Buffer.alloc(0);
            let lastPacketTime = Date.now();
            let silencePackets = 0;
            let packetBuffer = []; // Packet queue for smooth delivery
            let isFirstPacket = true;
            
            // Packet timing control
            const sendPacket = (payload) => {
                const rtpPacket = this.createRTPPacket(payload, sequenceNumber, timestamp, ssrc);
                
                rtpSocket.send(rtpPacket, remotePort, remoteIP, (err) => {
                    if (err) {
                        console.error('RTP send error:', err);
                    }
                });
                
                packetsSent++;
                if (packetsSent % 50 === 0) {
                    console.log(`RTP: Sent ${packetsSent} packets (${silencePackets} silence)`);
                }
                
                sequenceNumber = (sequenceNumber + 1) & 0xFFFF;
                timestamp = (timestamp + PACKET_SIZE) & 0x7FFFFFFF;
                lastPacketTime = Date.now();
            };
            
            // Silence packet (comfort noise) - 0xD5 is silence in A-law encoding
            const silencePayload = Buffer.alloc(PACKET_SIZE, 0xD5);
            
            // Pacing timer - har 20ms da packet yuborish
            const startTime = Date.now();
            let expectedPackets = 0;
            
            const pacingTimer = setInterval(() => {
                expectedPackets++;
                const elapsed = Date.now() - startTime;
                const expectedTime = expectedPackets * PACKET_INTERVAL;
                
                if (packetBuffer.length > 0) {
                    const packet = packetBuffer.shift();
                    sendPacket(packet);
                } else if (elapsed < 10000) { // Only send silence for first 10 seconds
                    // Send silence packet to maintain timing
                    sendPacket(silencePayload);
                    silencePackets++;
                }
            }, PACKET_INTERVAL);
            
            ffmpeg.stdout.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
                
                // Debug: Check if we're getting actual data
                if (packetsSent === 0) {
                    console.log('First audio chunk received:', chunk.length, 'bytes');
                    console.log('First 20 bytes:', chunk.slice(0, 20).toString('hex'));
                }
                
                // Process complete packets
                while (buffer.length >= PACKET_SIZE) {
                    const payload = buffer.slice(0, PACKET_SIZE);
                    buffer = buffer.slice(PACKET_SIZE);
                    
                    // Check if this packet contains actual audio
                    let hasAudio = false;
                    for (let i = 0; i < payload.length; i++) {
                        if (payload[i] !== 0xD5 && payload[i] !== 0x55) {
                            hasAudio = true;
                            break;
                        }
                    }
                    
                    if (!hasAudio) {
                        silencePackets++;
                    }
                    
                    // Add to packet buffer for smooth delivery
                    packetBuffer.push(payload);
                    
                    // Send first few packets immediately for faster start
                    if (isFirstPacket && packetBuffer.length >= 3) {
                        isFirstPacket = false;
                        // Send first 3 packets immediately
                        for (let i = 0; i < 3 && packetBuffer.length > 0; i++) {
                            sendPacket(packetBuffer.shift());
                        }
                    }
                }
            });

            // Capture all stderr output
            let stderrBuffer = '';
            ffmpeg.stderr.on('data', (data) => {
                const msg = data.toString();
                stderrBuffer += msg;
                console.error('FFmpeg output:', msg);
            });

            ffmpeg.on('close', (code) => {
                clearInterval(pacingTimer);
                
                // Send remaining buffer
                if (buffer.length > 0) {
                    const finalPayload = Buffer.concat([
                        buffer,
                        Buffer.alloc(PACKET_SIZE - buffer.length, 0xD5)  // A-law silence padding
                    ]);
                    sendPacket(finalPayload);
                }
                
                console.log(`Audio streaming finished with code ${code}`);
                console.log(`Total: ${packetsSent} packets (${silencePackets} silence)`);
                
                if (code !== 0) {
                    console.error('FFmpeg failed with exit code:', code);
                    console.error('FFmpeg stderr output:', stderrBuffer);
                }
                
                // Cleanup after short delay
                setTimeout(() => {
                    rtpSocket.close();
                    this.activeStreams.delete(callId);
                    
                    if (this.onPlaybackComplete) {
                        this.onPlaybackComplete(callId);
                    }
                }, 500);
            });

            ffmpeg.on('error', (err) => {
                console.error('FFmpeg spawn error:', err);
                console.error('Error details:', err.message);
                console.error('Error code:', err.code);
                console.error('Error syscall:', err.syscall);
                console.error('Error path:', err.path);
                clearInterval(pacingTimer);
                rtpSocket.close();
                this.activeStreams.delete(callId);
            });

            // Store stream info
            this.activeStreams.set(callId, {
                ffmpeg,
                rtpSocket,
                pacingTimer,
                startTime: Date.now()
            });

            return true;
        } catch (error) {
            console.error('RTP streaming error:', error);
            return false;
        }
    }

    createRTPPacket(payload, sequenceNumber, timestamp, ssrc) {
        const packet = Buffer.alloc(12 + payload.length);
        
        // RTP header (12 bytes)
        packet[0] = 0x80; // V=2, P=0, X=0, CC=0
        packet[1] = 0x08; // M=0, PT=8 (PCMA/A-law)
        
        // Set marker bit for first packet after silence
        if (sequenceNumber === 0 || sequenceNumber % 200 === 0) {
            packet[1] = 0x88; // M=1, PT=8 (PCMA)
        }
        
        packet.writeUInt16BE(sequenceNumber, 2);
        packet.writeUInt32BE(timestamp, 4);
        packet.writeUInt32BE(ssrc, 8);
        
        // Copy payload
        payload.copy(packet, 12);
        
        return packet;
    }

    stopStream(callId) {
        const stream = this.activeStreams.get(callId);
        if (stream) {
            console.log(`Stopping RTP stream for ${callId}`);
            console.log(`Stream start time: ${new Date(stream.startTime).toISOString()}`);
            console.log(`Stream duration: ${Date.now() - stream.startTime}ms`);
            
            if (stream.pacingTimer) {
                clearInterval(stream.pacingTimer);
            }
            
            if (stream.ffmpeg && stream.ffmpeg.exitCode === null) {
                console.log('Killing active FFmpeg process');
                stream.ffmpeg.kill('SIGTERM');
            }
            
            if (stream.rtpSocket) {
                setTimeout(() => {
                    stream.rtpSocket.close();
                }, 100);
            }
            
            this.activeStreams.delete(callId);
        }
    }
}

module.exports = SimpleRTPStream;