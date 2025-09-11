const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AudioPreprocessor {
    constructor() {
        this.cacheDir = path.join(__dirname, '../public/audio/cache');
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Pre-process audio file for telephony use
     * This reduces real-time processing load during broadcasts
     */
    async preprocessForTelephony(inputFile) {
        // Generate cache key based on file content AND file stats
        const fileBuffer = fs.readFileSync(inputFile);
        const stats = fs.statSync(inputFile);
        const hashContent = `${inputFile}_${stats.size}_${stats.mtime.getTime()}`;
        const hash = crypto.createHash('md5').update(hashContent).digest('hex');
        const cachedFile = path.join(this.cacheDir, `telephony_${hash}.alaw`);
        
        // Check if already processed
        if (fs.existsSync(cachedFile)) {
            console.log('[AudioPreprocessor] Using cached file:', cachedFile);
            return cachedFile;
        }
        
        console.log('[AudioPreprocessor] Processing audio for telephony:', inputFile);
        
        return new Promise((resolve, reject) => {
            // Optimized filters for telephony
            const filters = [
                'aresample=8000',                                    // Resample to 8kHz
                'acompressor=threshold=0.089:ratio=9:attack=5:release=50', // Compression
                'volume=3.0',                                        // 3x volume boost
                'alimiter=limit=0.95',                              // Prevent clipping
                'highpass=f=80',                                    // Remove low frequency
                'lowpass=f=3400'                                    // Remove high frequency
            ].join(',');
            
            const ffmpegArgs = [
                '-i', inputFile,
                '-af', filters,
                '-acodec', 'pcm_alaw',
                '-ar', '8000',
                '-ac', '1',
                '-f', 'alaw',
                '-y',
                cachedFile
            ];
            
            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            let stderrBuffer = '';
            ffmpeg.stderr.on('data', (data) => {
                stderrBuffer += data.toString();
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('[AudioPreprocessor] Successfully processed:', cachedFile);
                    resolve(cachedFile);
                } else {
                    console.error('[AudioPreprocessor] FFmpeg error:', stderrBuffer);
                    reject(new Error(`FFmpeg failed with code ${code}`));
                }
            });
            
            ffmpeg.on('error', (err) => {
                console.error('[AudioPreprocessor] Process error:', err);
                reject(err);
            });
        });
    }
    
    /**
     * Clean old cache files
     */
    cleanCache(maxAgeHours = 24) {
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;
        
        fs.readdirSync(this.cacheDir).forEach(file => {
            const filePath = path.join(this.cacheDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                fs.unlinkSync(filePath);
                console.log('[AudioPreprocessor] Deleted old cache file:', file);
            }
        });
    }
}

module.exports = AudioPreprocessor;