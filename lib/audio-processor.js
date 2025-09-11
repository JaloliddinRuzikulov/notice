const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AudioProcessor {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Process audio file with noise reduction and enhancement
     * @param {string} inputPath - Input audio file path
     * @param {string} outputPath - Output audio file path
     * @returns {Promise<boolean>} - Success status
     */
    async processAudio(inputPath, outputPath) {
        try {
            console.log('Starting audio processing...');
            
            // Step 1: Convert to high quality WAV for processing
            const tempWav = path.join(this.tempDir, `temp_${Date.now()}.wav`);
            await this.convertToWav(inputPath, tempWav);
            
            // Step 2: Apply noise reduction and enhancement
            const processedWav = path.join(this.tempDir, `processed_${Date.now()}.wav`);
            await this.enhanceAudio(tempWav, processedWav);
            
            // Step 3: Convert to final format with compression
            await this.finalizeAudio(processedWav, outputPath);
            
            // Cleanup temp files
            this.cleanupTempFiles([tempWav, processedWav]);
            
            console.log('Audio processing complete!');
            return true;
        } catch (error) {
            console.error('Audio processing error:', error);
            return false;
        }
    }

    /**
     * Convert audio to WAV format for processing
     */
    convertToWav(input, output) {
        return new Promise((resolve, reject) => {
            // Sanitize file paths
            const safeInput = path.resolve(path.join(__dirname, '..', 'public', 'audio', path.basename(input)));
            const safeOutput = path.resolve(path.join(__dirname, '..', 'temp', path.basename(output)));
            
            const ffmpeg = spawn('ffmpeg', [
                '-i', safeInput,
                '-acodec', 'pcm_s16le',
                '-ar', '48000',
                '-ac', '1',
                '-y',
                safeOutput
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg conversion failed with code ${code}`));
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                if (data.toString().includes('error')) {
                    console.error('FFmpeg error:', data.toString());
                }
            });
        });
    }

    /**
     * Enhance audio with noise reduction and normalization
     */
    enhanceAudio(input, output) {
        return new Promise((resolve, reject) => {
            // Advanced audio processing with FFmpeg filters
            // Sanitize file paths
            const safeInput = path.resolve(path.join(__dirname, '..', 'temp', path.basename(input)));
            const safeOutput = path.resolve(path.join(__dirname, '..', 'public', 'audio', path.basename(output)));
            
            const ffmpeg = spawn('ffmpeg', [
                '-i', safeInput,
                '-af', [
                    // High-pass filter to remove low frequency noise
                    'highpass=f=80',
                    
                    // Noise gate to remove background noise
                    'agate=threshold=0.02:ratio=3:attack=1:release=100',
                    
                    // Dynamic range compression for consistent volume
                    'acompressor=threshold=0.15:ratio=5:attack=5:release=50',
                    
                    // EQ to enhance voice frequencies
                    'equalizer=f=2000:t=h:width=200:g=3',
                    'equalizer=f=4000:t=h:width=500:g=2',
                    
                    // Remove noise using spectral subtraction
                    'afftdn=nt=w:om=o',
                    
                    // Normalize audio to prevent clipping
                    'loudnorm=I=-16:TP=-1.5:LRA=11',
                    
                    // Final limiter to prevent peaks
                    'alimiter=limit=0.95'
                ].join(','),
                '-y',
                output
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Audio enhancement failed with code ${code}`));
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                const message = data.toString();
                if (message.includes('error') && !message.includes('non-existing')) {
                    console.error('Enhancement error:', message);
                }
            });
        });
    }

    /**
     * Finalize audio with proper format and compression
     */
    finalizeAudio(input, output) {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', input,
                '-c:a', 'pcm_s16le',    // Use WAV for broadcast compatibility
                '-ar', '16000',         // 16kHz for better quality
                '-ac', '1',             // Mono
                '-y',
                output
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Audio finalization failed with code ${code}`));
                }
            });

            ffmpeg.stderr.on('data', (data) => {
                if (data.toString().includes('error')) {
                    console.error('Finalization error:', data.toString());
                }
            });
        });
    }

    /**
     * Process microphone recording with real-time enhancement
     */
    async processMicrophoneRecording(inputPath, outputPath) {
        try {
            console.log('Processing microphone recording...');
            
            // Special processing for microphone recordings
            const tempWav = path.join(this.tempDir, `mic_temp_${Date.now()}.wav`);
            
            // First pass: aggressive noise reduction
            await new Promise((resolve, reject) => {
                const ffmpeg = spawn('ffmpeg', [
                    '-i', inputPath,
                    '-af', [
                        // Remove DC offset
                        'dcshift=0',
                        
                        // High-pass filter for mic rumble
                        'highpass=f=100:poles=2',
                        
                        // Aggressive noise gate
                        'agate=threshold=0.03:ratio=5:attack=0.5:release=50:detection=peak',
                        
                        // Spectral noise reduction
                        'afftdn=nt=w:om=o:tr=1',
                        
                        // De-esser to reduce sibilance
                        'deesser=i=0.5:m=0.5:f=6500:s=4',
                        
                        // Voice isolation EQ
                        'equalizer=f=120:t=h:width=200:g=-3',
                        'equalizer=f=3000:t=h:width=1000:g=2',
                        'equalizer=f=8000:t=h:width=2000:g=-2',
                        
                        // Dynamic processing
                        'acompressor=threshold=0.1:ratio=4:attack=3:release=25:makeup=2',
                        
                        // Final normalization
                        'loudnorm=I=-18:TP=-2:LRA=7'
                    ].join(','),
                    '-ar', '48000',
                    '-y',
                    tempWav
                ]);

                ffmpeg.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Mic processing failed: ${code}`));
                });
            });

            // Second pass: final enhancement
            await this.finalizeAudio(tempWav, outputPath);
            
            // Cleanup
            this.cleanupTempFiles([tempWav]);
            
            console.log('Microphone recording processed successfully!');
            return true;
        } catch (error) {
            console.error('Microphone processing error:', error);
            return false;
        }
    }

    /**
     * Clean up temporary files
     */
    cleanupTempFiles(files) {
        files.forEach(file => {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            } catch (error) {
                console.error(`Failed to delete temp file ${file}:`, error);
            }
        });
    }

    /**
     * Get audio file info
     */
    async getAudioInfo(filePath) {
        return new Promise((resolve, reject) => {
            const ffprobe = spawn('ffprobe', [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                filePath
            ]);

            let output = '';
            ffprobe.stdout.on('data', (data) => {
                output += data.toString();
            });

            ffprobe.on('close', (code) => {
                if (code === 0) {
                    try {
                        const info = JSON.parse(output);
                        resolve(info);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error(`FFprobe failed with code ${code}`));
                }
            });
        });
    }
}

module.exports = AudioProcessor;