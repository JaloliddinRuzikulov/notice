const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

class AudioCache {
    constructor() {
        this.cacheDir = path.join(__dirname, '../temp/audio-cache');
        this.cacheMap = new Map(); // audioFile -> cachedPcmFile
        
        // Create cache directory
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
        
        console.log('[AudioCache] Initialized with cache dir:', this.cacheDir);
    }
    
    /**
     * Get cached PCM audio or convert if not cached
     * @param {string} audioFile - Original audio file path
     * @returns {Promise<string>} - Path to PCM audio file
     */
    async getCachedAudio(audioFile) {
        // Check memory cache first
        if (this.cacheMap.has(audioFile)) {
            const cachedFile = this.cacheMap.get(audioFile);
            if (fs.existsSync(cachedFile)) {
                console.log('[AudioCache] Using cached audio:', cachedFile);
                return cachedFile;
            }
        }
        
        // Generate cache filename based on hash
        const hash = crypto.createHash('md5').update(audioFile).digest('hex');
        const cachedFile = path.join(this.cacheDir, `${hash}.pcm`);
        
        // Check if cached file exists
        if (fs.existsSync(cachedFile)) {
            console.log('[AudioCache] Found cached file:', cachedFile);
            this.cacheMap.set(audioFile, cachedFile);
            return cachedFile;
        }
        
        // Convert audio to PCM and cache it
        console.log('[AudioCache] Converting audio to PCM:', audioFile);
        await this.convertToPCM(audioFile, cachedFile);
        
        // Store in memory cache
        this.cacheMap.set(audioFile, cachedFile);
        
        return cachedFile;
    }
    
    /**
     * Convert audio file to PCM format for RTP
     */
    convertToPCM(inputFile, outputFile) {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputFile,
                '-af', 'volume=2.0,highpass=f=300,lowpass=f=3400',
                '-acodec', 'pcm_mulaw',
                '-ar', '8000',
                '-ac', '1',
                '-f', 'mulaw',
                '-y',
                outputFile
            ]);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('[AudioCache] Conversion complete:', outputFile);
                    resolve();
                } else {
                    reject(new Error(`FFmpeg conversion failed with code ${code}`));
                }
            });
            
            ffmpeg.stderr.on('data', (data) => {
                const msg = data.toString();
                if (msg.includes('error') || msg.includes('Error')) {
                    console.error('[AudioCache] FFmpeg error:', msg);
                }
            });
        });
    }
    
    /**
     * Clear old cache files
     */
    clearOldCache(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const now = Date.now();
        
        fs.readdirSync(this.cacheDir).forEach(file => {
            const filePath = path.join(this.cacheDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtimeMs > maxAge) {
                console.log('[AudioCache] Removing old cache file:', file);
                fs.unlinkSync(filePath);
            }
        });
        
        // Clear memory cache for non-existent files
        for (const [key, value] of this.cacheMap.entries()) {
            if (!fs.existsSync(value)) {
                this.cacheMap.delete(key);
            }
        }
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const files = fs.readdirSync(this.cacheDir);
        let totalSize = 0;
        
        files.forEach(file => {
            const stats = fs.statSync(path.join(this.cacheDir, file));
            totalSize += stats.size;
        });
        
        return {
            fileCount: files.length,
            memoryCacheSize: this.cacheMap.size,
            diskUsageMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }
}

module.exports = AudioCache;