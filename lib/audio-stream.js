/**
 * Audio Stream Module
 * Handles audio file conversion and RTP streaming using FFmpeg
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dgram = require('dgram');

class AudioStream {
    constructor() {
        this.activeStreams = new Map();
    }

    /**
     * Stream audio file via RTP
     * @param {string} audioFile - Path to audio file
     * @param {string} remoteIP - Remote IP address
     * @param {number} remotePort - Remote RTP port
     * @param {number} localPort - Local RTP port
     * @param {string} callId - Call ID for tracking
     */
    async streamAudio(audioFile, remoteIP, remotePort, localPort, callId) {
        try {
            // Check if audio file exists
            const audioPath = path.join(__dirname, '../public/audio/uploads', audioFile);
            if (!fs.existsSync(audioPath)) {
                console.error('Audio file not found:', audioPath);
                return false;
            }

            console.log(`Starting audio stream for ${callId}`);
            console.log(`Audio file: ${audioPath}`);
            console.log(`Streaming to: ${remoteIP}:${remotePort}`);

            // FFmpeg command to convert and stream audio
            // -re: Read input at native frame rate
            // -i: Input file
            // -ar 8000: Sample rate 8kHz (telephony standard)
            // -ac 1: Mono audio
            // -acodec pcm_mulaw: G.711 μ-law codec
            // -f rtp: RTP format
            // -payload_type 0: PCMU payload type
            // Note: Removed localport parameter to let FFmpeg choose available port
            const ffmpegArgs = [
                '-re',
                '-loglevel', 'debug', // Add debug logging
                '-i', audioPath,
                '-ar', '8000',
                '-ac', '1',
                '-acodec', 'pcm_mulaw',
                '-f', 'rtp',
                '-payload_type', '0',
                '-ssrc', Math.floor(Math.random() * 0x7FFFFFFF).toString(),
                `rtp://${remoteIP}:${remotePort}`
            ];
            
            console.log('FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
            
            const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
                stdio: ['ignore', 'pipe', 'pipe'] // ignore stdin, pipe stdout and stderr
            });

            // Handle FFmpeg output
            ffmpeg.stdout.on('data', (data) => {
                console.log(`FFmpeg stdout: ${data}`);
            });

            ffmpeg.stderr.on('data', (data) => {
                // FFmpeg outputs progress to stderr
                const output = data.toString();
                
                // Log all FFmpeg output for debugging
                console.error('FFmpeg stderr:', output);
                
                if (output.includes('time=')) {
                    // Progress update
                    const timeMatch = output.match(/time=(\d+:\d+:\d+\.\d+)/);
                    if (timeMatch) {
                        console.log(`Audio streaming progress: ${timeMatch[1]}`);
                    }
                }
            });

            ffmpeg.on('close', (code) => {
                console.log(`FFmpeg process exited with code ${code}`);
                this.activeStreams.delete(callId);
                
                if (code === 0) {
                    console.log('Audio streaming completed successfully');
                } else {
                    console.error('Audio streaming failed');
                }
            });

            ffmpeg.on('error', (err) => {
                console.error('FFmpeg spawn error:', err);
                console.error('Error details:', err.message);
                if (err.code === 'ENOENT') {
                    console.error('FFmpeg not found in PATH');
                }
                this.activeStreams.delete(callId);
            });

            // Store stream reference
            this.activeStreams.set(callId, {
                ffmpeg,
                audioFile,
                remoteIP,
                remotePort,
                startTime: Date.now()
            });

            return true;
        } catch (error) {
            console.error('Error starting audio stream:', error);
            return false;
        }
    }

    /**
     * Stop audio streaming for a call
     * @param {string} callId - Call ID
     */
    stopStream(callId) {
        const stream = this.activeStreams.get(callId);
        if (stream && stream.ffmpeg) {
            console.log(`Stopping audio stream for ${callId}`);
            stream.ffmpeg.kill('SIGTERM');
            this.activeStreams.delete(callId);
        }
    }

    /**
     * Stop all active streams
     */
    stopAllStreams() {
        for (const [callId, stream] of this.activeStreams) {
            if (stream.ffmpeg) {
                stream.ffmpeg.kill('SIGTERM');
            }
        }
        this.activeStreams.clear();
    }

    /**
     * Check if FFmpeg is available
     */
    static async checkFFmpeg() {
        return new Promise((resolve) => {
            const ffmpeg = spawn('ffmpeg', ['-version']);
            
            ffmpeg.on('close', (code) => {
                resolve(code === 0);
            });
            
            ffmpeg.on('error', () => {
                resolve(false);
            });
        });
    }
}

module.exports = AudioStream;