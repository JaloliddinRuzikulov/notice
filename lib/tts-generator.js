const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { promisify } = require('util');
const https = require('https');
const http = require('http');
const uzbekTransliterator = require('./uzbek-transliterator');

const execAsync = promisify(exec);

class TTSGenerator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../public/audio/uploads');
        this.presetsDir = path.join(__dirname, '../public/audio/presets');
        this.voicesDir = '/usr/share/piper-voices';
        this.piperAvailable = false;
        this.espeakAvailable = false;
        this.initialized = false;
        
        // Create directories if they don't exist
        [this.uploadsDir, this.presetsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Initialize TTS engines availability
        this.initPromise = this.checkTTSAvailability();
    }

    async checkTTSAvailability() {
        // Check espeak-ng first (works on Alpine)
        try {
            await execAsync('which espeak-ng');
            this.espeakAvailable = true;
            console.log('✓ eSpeak-ng TTS mavjud');
        } catch (e) {
            this.espeakAvailable = false;
            console.log('✗ eSpeak-ng TTS topilmadi');
        }
        
        // Then check Piper
        await this.checkPiperAvailability();
    }
    
    async checkPiperAvailability() {
        try {
            // Try multiple possible locations
            const locations = [
                path.join(process.env.HOME, '.local/bin/piper'),
                'piper',
                '/usr/local/bin/piper',
                '/usr/bin/piper',
                path.join(process.env.HOME, 'piper/piper')
            ];
            
            let found = false;
            for (const loc of locations) {
                try {
                    await execAsync(`${loc} --help`);
                    this.piperPath = loc;
                    found = true;
                    break;
                } catch (e) {
                    // Continue to next location
                }
            }
            
            if (found) {
                this.piperAvailable = true;
                console.log('✓ Piper TTS mavjud:', this.piperPath);
                this.checkAvailableVoices();
            } else {
                this.piperAvailable = false;
                console.log('✗ Piper TTS topilmadi. O\'rnatish uchun:');
                console.log('  bash scripts/setup-piper.sh');
            }
        } catch (error) {
            this.piperAvailable = false;
            console.log('✗ Piper TTS topilmadi');
        }
        
        this.initialized = true;
    }

    checkAvailableVoices() {
        // Check both standard location and /tmp for voice models
        const possibleLocations = [
            { base: this.voicesDir, subpath: true },
            { base: '/tmp', subpath: false }
        ];
        
        this.voices = {};
        
        // Try to find voices in different locations
        const voiceFiles = {
            'ru-female': ['ru/ru_RU-irina-medium.onnx', 'ru_RU-irina-medium.onnx'],
            'ru-male': ['ru/ru_RU-ruslan-medium.onnx', 'ru_RU-ruslan-medium.onnx'],
            'kk-female': ['kk/kk_KZ-iseke-x_low.onnx', 'kk_KZ-iseke-x_low.onnx'],
            'en-female': ['en/en_US-amy-medium.onnx', 'en_US-amy-medium.onnx'],
            'en-male': ['en/en_US-danny-low.onnx', 'en_US-danny-low.onnx']
        };
        
        Object.entries(voiceFiles).forEach(([key, filenames]) => {
            for (const location of possibleLocations) {
                for (const filename of filenames) {
                    const fullPath = path.join(location.base, filename);
                    if (fs.existsSync(fullPath)) {
                        this.voices[key] = fullPath;
                        break;
                    }
                }
                if (this.voices[key]) break;
            }
        });

        console.log('Mavjud ovozlar:');
        Object.entries(this.voices).forEach(([key, voicePath]) => {
            if (fs.existsSync(voicePath)) {
                console.log(`  ✓ ${key}: ${voicePath}`);
            }
        });
    }

    async generateAudio(text, options = {}) {
        const { language = 'uz', speed = 140, voice = 'female' } = options;
        
        // Wait for initialization to complete
        if (!this.initialized) {
            await this.initPromise;
        }
        
        // Check for preset audio first
        const presetFile = this.checkPresets(text);
        if (presetFile) {
            console.log('Preset audio ishlatilmoqda:', presetFile);
            return presetFile;
        }

        const fileName = `tts-${uuidv4()}.wav`;
        const filePath = path.join(this.uploadsDir, fileName);
        
        try {
            // Try online TTS first for professional quality
            const onlineSuccess = await this.generateWithOnlineTTS(text, filePath, options);
            if (onlineSuccess) {
                console.log('✓ Online TTS muvaffaqiyatli yaratildi (professional ovoz)');
                return fileName;
            }
            
            // Try alternative TTS as second option
            const alternativeSuccess = await this.generateWithAlternativeTTS(text, filePath, options);
            if (alternativeSuccess) {
                console.log('✓ Alternative TTS muvaffaqiyatli yaratildi (professional ovoz)');
                return fileName;
            }
            
            // Try Piper if available
            if (this.piperAvailable) {
                const piperSuccess = await this.generateWithPiper(text, filePath, options);
                if (piperSuccess) {
                    console.log('✓ Piper TTS muvaffaqiyatli yaratildi');
                    return fileName;
                }
            }
            
            // For Uzbek, use available TTS engines
            if (language === 'uz') {
                console.log('Processing Uzbek text:', text);
                
                // 1. First try Piper with Russian voice if available
                if (this.piperAvailable) {
                    // Transliterate to Russian for better pronunciation
                    const transliteratedText = uzbekTransliterator.transliterate(text);
                    console.log('Transliterated text:', transliteratedText);
                    
                    const success = await this.generateWithPiper(transliteratedText, filePath, {
                        language: 'ru', // Use Russian
                        speed: speed,
                        voice: voice
                    });
                    
                    if (success) {
                        console.log('✓ Piper TTS muvaffaqiyatli yaratildi');
                        return fileName;
                    }
                }
                
                // 2. Try espeak-ng as fallback
                try {
                    const success = await this.generateWithEspeak(text, filePath, { speed, voice });
                    if (success) {
                        console.log('✓ eSpeak-ng TTS muvaffaqiyatli yaratildi');
                        return fileName;
                    }
                } catch (error) {
                    console.error('eSpeak-ng error:', error.message);
                }
                
                // 3. Last resort - informative beep pattern
                console.log('Fallback to audio pattern');
                const success = await this.generateTextPattern(filePath, text);
                if (success) {
                    return fileName;
                } else {
                    await this.generateBeepTone(filePath);
                    return fileName;
                }
            }
            
            if (this.piperAvailable) {
                // Use Piper for high quality TTS
                const success = await this.generateWithPiper(text, filePath, { language, speed, voice });
                if (success) {
                    console.log('✓ Piper TTS muvaffaqiyatli yaratildi');
                    return fileName;
                }
            }
            
            // Try espeak as final fallback
            const espeakSuccess = await this.generateWithEspeak(text, filePath, options);
            if (espeakSuccess) {
                console.log('✓ eSpeak-ng TTS muvaffaqiyatli yaratildi');
                return fileName;
            }
            
            // Fallback to simple beep if no TTS available
            console.log('TTS mavjud emas, oddiy signal yaratilmoqda...');
            await this.generateBeepTone(filePath);
            return fileName;
            
        } catch (error) {
            console.error('TTS xatosi:', error);
            return await this.getDefaultAudio();
        }
    }

    async generateWithPiper(text, outputPath, options = {}) {
        if (!this.piperAvailable) return false;
        
        const { language = 'uz', speed = 140, voice = 'female' } = options;
        
        // Language mapping (use closest available)
        const langMap = {
            'uz': 'ru', // Use Russian for Uzbek (better than Kazakh)
            'ru': 'ru',
            'en': 'en'
        };
        
        const mappedLang = langMap[language] || 'ru';
        const voiceKey = `${mappedLang}-${voice}`;
        
        // Get voice model path
        let modelPath = this.voices[voiceKey];
        
        // Fallback to Russian female if specific voice not found
        if (!modelPath || !fs.existsSync(modelPath)) {
            modelPath = this.voices['ru-female'];
        }
        
        // Try any available voice if still not found
        if (!modelPath || !fs.existsSync(modelPath)) {
            for (const [key, path] of Object.entries(this.voices)) {
                if (fs.existsSync(path)) {
                    modelPath = path;
                    console.log(`Using fallback voice: ${key}`);
                    break;
                }
            }
        }
        
        if (!modelPath || !fs.existsSync(modelPath)) {
            console.error('Piper model topilmadi. Mavjud ovozlar:', this.voices);
            return false;
        }

        // Avval 16kHz da yaratib, keyin telefon uchun konvertatsiya qilamiz
        const tempPath = outputPath.replace('.wav', '_temp.wav');

        return new Promise((resolve) => {
            // If Uzbek language, transliterate to Cyrillic
            let processedText = text;
            if (language === 'uz') {
                processedText = uzbekTransliterator.transliterate(text);
                console.log(`O'zbek matn tarjimasi: "${text}" -> "${processedText}"`);
            }
            
            // Calculate length scale (inverse of speed)
            const lengthScale = 140 / speed;
            
            const args = [
                '--model', modelPath,
                '--output-file', tempPath,
                '--length-scale', lengthScale.toFixed(2),
                '--noise-scale', '0.667',
                '--noise-w', '0.8'
            ];

            console.log('Piper buyrug\'i:', this.piperPath, args.join(' '));

            const piper = spawn(this.piperPath, args);
            
            // Send text to stdin
            piper.stdin.write(processedText);
            piper.stdin.end();

            let stderr = '';
            piper.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            piper.on('close', async (code) => {
                if (code === 0 && fs.existsSync(tempPath)) {
                    // Simple telephony optimization
                    const converted = await this.convertToTelephonyFormat(tempPath, outputPath);
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                    resolve(converted);
                } else {
                    console.error('Piper xatosi:', stderr);
                    resolve(false);
                }
            });

            piper.on('error', (err) => {
                console.error('Piper ishga tushirish xatosi:', err);
                resolve(false);
            });
        });
    }

    async convertToWebM(inputPath, outputPath) {
        return new Promise((resolve) => {
            // Soddalashtirilgan WebM/Opus konversiya
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-af', [
                    // Telefon uchun optimal filterlar
                    'highpass=f=300',
                    'lowpass=f=3400',
                    'loudnorm=I=-20:TP=-3',
                    'volume=1.5'
                ].join(','),
                '-c:a', 'opus',
                '-b:a', '32k',
                '-ar', '16000',
                '-ac', '1',
                '-application', 'voip',
                '-y',
                outputPath
            ]);

            ffmpeg.on('close', (code) => {
                resolve(code === 0);
            });

            ffmpeg.on('error', () => {
                resolve(false);
            });
        });
    }

    async convertToTelephonyFormat(inputPath, outputPath) {
        return new Promise((resolve) => {
            // Telefon uchun optimallashtirilgan format
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-af', [
                    // Noise gate - uzilishlarni kamaytirish
                    'agate=threshold=0.01:attack=0.5:release=100:detection=rms',
                    
                    // Band pass filter
                    'highpass=f=200:poles=1',
                    'lowpass=f=3800:poles=1',
                    
                    // Normalize
                    'loudnorm=I=-20:TP=-2:LRA=7',
                    
                    // Compressor - consistent volume
                    'acompressor=threshold=0.2:ratio=2:attack=5:release=50',
                    
                    // Final volume
                    'volume=2.0'
                ].join(','),
                
                // 8kHz for telephony
                '-ar', '8000',
                '-ac', '1', 
                '-c:a', 'pcm_s16le',
                '-y',
                outputPath
            ]);

            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('TTS telefon formati muvaffaqiyatli yaratildi');
                    resolve(true);
                } else {
                    console.error('Konversiya xatosi:', stderr);
                    resolve(false);
                }
            });

            ffmpeg.on('error', (err) => {
                console.error('FFmpeg xatosi:', err);
                resolve(false);
            });
        });
    }

    async optimizeForTelephony(inputPath) {
        const outputPath = inputPath.replace('.wav', '_tel.wav');
        
        return new Promise((resolve) => {
            // Telefon uchun optimal sozlamalar
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-af', [
                    // 1. Normalize to telephony levels
                    'loudnorm=I=-20:TP=-3:LRA=11',
                    
                    // 2. Telephony bandpass filter
                    'highpass=f=300:poles=2',
                    'lowpass=f=3400:poles=2',
                    
                    // 3. Boost speech frequencies
                    'equalizer=f=1000:t=h:width=500:g=2',
                    'equalizer=f=2000:t=h:width=500:g=3',
                    
                    // 4. Compression for consistent levels
                    'acompressor=threshold=0.15:ratio=3:attack=5:release=50:makeup=2',
                    
                    // 5. Final volume
                    'volume=2.0'
                ].join(','),
                '-ar', '8000',
                '-ac', '1',
                '-c:a', 'pcm_s16le',
                '-y',
                outputPath
            ]);

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    // Replace original with optimized
                    fs.unlinkSync(inputPath);
                    fs.renameSync(outputPath, inputPath);
                    resolve(true);
                } else {
                    resolve(true); // Use original if optimization fails
                }
            });

            ffmpeg.on('error', () => {
                resolve(true); // Use original if ffmpeg not available
            });
        });
    }

    async enhanceAudio(inputPath) {
        // TTS enhancement'ni o'chirib qo'yamiz
        return true;
    }

    async generateWithEspeak(text, outputPath, options = {}) {
        const { speed = 140, voice = 'female' } = options;
        
        try {
            // Check if espeak-ng is available
            await execAsync('which espeak-ng');
            
            // For better Uzbek pronunciation, use Russian transliteration
            const transliteratedText = uzbekTransliterator.transliterate(text);
            console.log('Transliterated text for TTS:', transliteratedText);
            
            // Speed adjustment (espeak uses words per minute)
            const espeakSpeed = Math.round(speed * 1.2); // Slightly faster
            
            // Use Russian voice for better quality (closest to Uzbek)
            const espeakVoice = voice === 'female' ? 'ru+f3' : 'ru+m3';
            
            // Generate audio with espeak-ng
            // Important: use -g for gap between words and -p for pitch
            const command = `espeak-ng -v ${espeakVoice} -s ${espeakSpeed} -g 10 -p 50 -w "${outputPath}" "${transliteratedText}"`;
            
            await execAsync(command);
            
            // Enhance audio quality with ffmpeg
            const enhancedPath = outputPath.replace('.wav', '_enhanced.wav');
            const ffmpegCommand = `ffmpeg -i "${outputPath}" -af "volume=2.0,highpass=f=300,lowpass=f=3000,compand=.3|.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.2" -ar 8000 -ac 1 -y "${enhancedPath}"`;
            
            try {
                await execAsync(ffmpegCommand);
                fs.unlinkSync(outputPath);
                fs.renameSync(enhancedPath, outputPath);
            } catch (e) {
                // Use original if enhancement fails
                console.log('Audio enhancement failed, using original');
            }
            
            return true;
        } catch (error) {
            console.error('eSpeak-ng error:', error);
            return false;
        }
    }
    
    async generateWithAlternativeTTS(text, outputPath, options = {}) {
        const { voice = 'female', speed = 1.0 } = options;
        
        try {
            console.log('Alternative TTS API orqali professional audio yaratish...');
            
            // Transliterate Uzbek to Russian for better pronunciation
            const transliteratedText = uzbekTransliterator.transliterate(text);
            
            // Try StreamElements TTS (free, high quality)
            const voiceId = voice === 'female' ? 'Tatyana' : 'Maxim'; // Russian voices
            const streamElementsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceId}&text=${encodeURIComponent(transliteratedText)}`;
            
            return new Promise((resolve) => {
                const tempFile = outputPath + '.mp3';
                const file = fs.createWriteStream(tempFile);
                
                const options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'audio/mpeg,audio/*;q=0.9',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache'
                    }
                };
                
                https.get(streamElementsUrl, options, (response) => {
                    if (response.statusCode !== 200) {
                        console.error('StreamElements TTS error:', response.statusCode);
                        file.close();
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                        resolve(false);
                        return;
                    }
                    
                    response.pipe(file);
                    
                    file.on('finish', () => {
                        file.close(async () => {
                            // Convert MP3 to WAV for telephony
                            const ffmpegCmd = spawn('ffmpeg', [
                                '-i', tempFile,
                                '-af', [
                                    'volume=2.5',
                                    'highpass=f=300',
                                    'lowpass=f=3400',
                                    'loudnorm=I=-18:TP=-2:LRA=7',
                                    'acompressor=threshold=0.2:ratio=3:attack=5:release=50'
                                ].join(','),
                                '-ar', '8000',
                                '-ac', '1',
                                '-c:a', 'pcm_s16le',
                                '-y',
                                outputPath
                            ]);
                            
                            ffmpegCmd.on('close', (code) => {
                                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                                if (code === 0) {
                                    console.log('✓ Alternative TTS muvaffaqiyatli yaratildi');
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                            });
                            
                            ffmpegCmd.on('error', () => {
                                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                                resolve(false);
                            });
                        });
                    });
                }).on('error', (err) => {
                    console.error('Request error:', err);
                    file.close();
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    resolve(false);
                });
            });
        } catch (error) {
            console.error('Alternative TTS error:', error);
            return false;
        }
    }
    
    async generateWithOnlineTTS(text, outputPath, options = {}) {
        const { voice = 'female', speed = 1.0 } = options;
        
        try {
            console.log('Google TTS API orqali professional audio yaratish...');
            
            // Transliterate Uzbek to Russian for better pronunciation
            const transliteratedText = uzbekTransliterator.transliterate(text);
            console.log('Transliterated text:', transliteratedText);
            
            // Use Google's TTS API (free, no key required for limited use)
            const lang = 'ru'; // Russian for Uzbek transliterated text
            const tld = 'com';
            
            // Encode text for URL
            const encodedText = encodeURIComponent(transliteratedText);
            
            // Google TTS URL
            const googleTTSUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodedText}&tld=${tld}`;
            
            return new Promise((resolve) => {
                const tempFile = outputPath + '.mp3';
                const file = fs.createWriteStream(tempFile);
                
                const options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Referer': 'https://translate.google.com/',
                        'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                };
                
                https.get(googleTTSUrl, options, (response) => {
                    if (response.statusCode !== 200) {
                        console.error('Google TTS API error:', response.statusCode);
                        file.close();
                        fs.unlinkSync(tempFile);
                        resolve(false);
                        return;
                    }
                    
                    response.pipe(file);
                    
                    file.on('finish', () => {
                        file.close(async () => {
                            // Convert MP3 to WAV format for telephony
                            const ffmpegCmd = spawn('ffmpeg', [
                                '-i', tempFile,
                                '-af', [
                                    'volume=2.0',
                                    'highpass=f=300',
                                    'lowpass=f=3400',
                                    'loudnorm=I=-20:TP=-3:LRA=7',
                                    'acompressor=threshold=0.2:ratio=2:attack=5:release=50'
                                ].join(','),
                                '-ar', '8000',
                                '-ac', '1',
                                '-c:a', 'pcm_s16le',
                                '-y',
                                outputPath
                            ]);
                            
                            ffmpegCmd.on('close', (code) => {
                                fs.unlinkSync(tempFile);
                                if (code === 0) {
                                    console.log('✓ Google TTS muvaffaqiyatli yaratildi (professional ovoz)');
                                    resolve(true);
                                } else {
                                    console.error('FFmpeg conversion failed');
                                    resolve(false);
                                }
                            });
                            
                            ffmpegCmd.on('error', () => {
                                fs.unlinkSync(tempFile);
                                resolve(false);
                            });
                        });
                    });
                    
                    file.on('error', (err) => {
                        console.error('File write error:', err);
                        if (fs.existsSync(tempFile)) {
                            fs.unlinkSync(tempFile);
                        }
                        resolve(false);
                    });
                    
                    response.on('error', (err) => {
                        console.error('Response error:', err);
                        file.close();
                        if (fs.existsSync(tempFile)) {
                            fs.unlinkSync(tempFile);
                        }
                        resolve(false);
                    });
                });
            });
        } catch (error) {
            console.error('Google TTS error:', error);
            return false;
        }
    }

    async generateWithAlternativeTTS(text, outputPath, options = {}) {
        const { voice = 'female', speed = 1.0 } = options;
        
        try {
            console.log('StreamElements TTS API orqali professional audio yaratish...');
            
            // Transliterate Uzbek to Russian
            const transliteratedText = uzbekTransliterator.transliterate(text);
            console.log('Transliterated text:', transliteratedText);
            
            // StreamElements TTS API (free, no key)
            const voiceId = voice === 'female' ? 'Tatyana' : 'Maxim';
            
            const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceId}&text=${encodeURIComponent(transliteratedText)}`;
            
            return new Promise((resolve) => {
                https.get(url, (response) => {
                    if (response.statusCode !== 200) {
                        console.error('StreamElements API error:', response.statusCode);
                        resolve(false);
                        return;
                    }
                    
                    const tempFile = outputPath + '.mp3';
                    const file = fs.createWriteStream(tempFile);
                    
                    response.pipe(file);
                    
                    file.on('finish', () => {
                        file.close();
                        
                        // Convert to WAV with telephony optimization
                        const ffmpegCmd = spawn('ffmpeg', [
                            '-i', tempFile,
                            '-af', [
                                'volume=2.0',
                                'highpass=f=300',
                                'lowpass=f=3400',
                                'loudnorm=I=-20:TP=-3:LRA=7',
                                'acompressor=threshold=0.2:ratio=2:attack=5:release=50'
                            ].join(','),
                            '-ar', '8000',
                            '-ac', '1',
                            '-c:a', 'pcm_s16le',
                            '-y',
                            outputPath
                        ]);
                        
                        ffmpegCmd.on('close', (code) => {
                            fs.unlinkSync(tempFile);
                            if (code === 0) {
                                console.log('✓ StreamElements TTS muvaffaqiyatli yaratildi (professional ovoz)');
                                resolve(true);
                            } else {
                                console.error('FFmpeg conversion failed');
                                resolve(false);
                            }
                        });
                        
                        ffmpegCmd.on('error', () => {
                            fs.unlinkSync(tempFile);
                            resolve(false);
                        });
                    });
                    
                    file.on('error', (err) => {
                        console.error('File write error:', err);
                        if (fs.existsSync(tempFile)) {
                            fs.unlinkSync(tempFile);
                        }
                        resolve(false);
                    });
                });
            });
        } catch (error) {
            console.error('StreamElements TTS error:', error);
            return false;
        }
    }
    
    async findPresetAudio(text) {
        // Check for common Uzbek phrases
        const messages = {
            'salom': 'salom.wav',
            'assalomu alaykum': 'assalomu-alaykum.wav',
            'xabar': 'xabar.wav',
            'muhim xabar': 'muhim-xabar.wav',
            'diqqat': 'diqqat.wav',
            'e\'tibor bering': 'etibor-bering.wav',
            'iltimos': 'iltimos.wav',
            'bir raqamini bosing': 'bir-raqamini-bosing.wav',
            'tasdiqlash uchun': 'tasdiqlash-uchun.wav',
            'rahmat': 'rahmat.wav',
            'yig\'ilish': 'yigilish.wav',
            'tezkor': 'tezkor.wav',
            'favqulodda': 'favqulodda.wav'
        };
        
        const lowerText = text.toLowerCase().trim();
        for (const [phrase, file] of Object.entries(messages)) {
            if (lowerText.includes(phrase)) {
                return file;
            }
        }
        
        return null;
    }
    
    async generateInformativeBeep(outputPath, text) {
        // Create different beep patterns based on text content
        const isUrgent = text.toLowerCase().includes('tezkor') || 
                        text.toLowerCase().includes('favqulodda') ||
                        text.toLowerCase().includes('muhim');
        
        return new Promise((resolve) => {
            console.log(`Creating informative beep pattern for: ${text.substring(0, 50)}...`);
            
            const pattern = isUrgent ? 
                // Urgent: fast beeps
                '-f lavfi -i "sine=f=1000:d=0.1,apad=pad_dur=0.1[s1];sine=f=1000:d=0.1,apad=pad_dur=0.1,adelay=300[s2];sine=f=1000:d=0.1,apad=pad_dur=0.1,adelay=600[s3];sine=f=800:d=2,adelay=1000[main]" -filter_complex "[s1][s2][s3][main]amix=inputs=4"' :
                // Normal: pleasant chime
                '-f lavfi -i "sine=f=523:d=0.2[c];sine=f=659:d=0.2,adelay=200[e];sine=f=784:d=0.4,adelay=400[g];sine=f=600:d=2,adelay=1000[main]" -filter_complex "[c][e][g][main]amix=inputs=4"';
            
            const ffmpeg = spawn('ffmpeg', [
                ...pattern.split(' '),
                '-af', 'volume=0.5',
                '-ar', '8000',
                '-ac', '1',
                '-c:a', 'pcm_s16le',
                '-y',
                outputPath
            ], { shell: true });
            
            ffmpeg.on('close', (code) => {
                resolve(code === 0);
            });
            
            ffmpeg.on('error', (err) => {
                console.error('FFmpeg error:', err);
                resolve(false);
            });
        });
    }
    
    async convertToWav(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-i', inputPath,
                '-ar', '8000',
                '-ac', '1',
                '-c:a', 'pcm_s16le',
                '-y',
                outputPath
            ]);
            
            ffmpeg.on('close', (code) => {
                resolve(code === 0);
            });
            
            ffmpeg.on('error', reject);
        });
    }
    
    async generateWithFestival(text, outputPath, options = {}) {
        // Use Festival TTS (text to speech)
        return new Promise(async (resolve) => {
            try {
                // Check if festival is available
                await execAsync('which festival');
                
                // Create temporary text file
                const tempFile = `/tmp/tts_${Date.now()}.txt`;
                fs.writeFileSync(tempFile, text);
                
                // Generate speech with festival
                const { voice = 'female' } = options;
                const voiceCmd = voice === 'female' ? 
                    '(voice_cmu_us_slt_arctic_hts)' : 
                    '(voice_cmu_us_awb_arctic_hts)';
                
                const festivalCmd = `echo "${voiceCmd} (tts_file \\"${tempFile}\\" nil)" | festival --pipe`;
                
                const { stdout, stderr } = await execAsync(festivalCmd);
                
                // Festival outputs to current directory
                if (fs.existsSync('output.wav')) {
                    fs.renameSync('output.wav', outputPath);
                    fs.unlinkSync(tempFile);
                    resolve(true);
                } else {
                    console.error('Festival output not found');
                    resolve(false);
                }
            } catch (error) {
                console.error('Festival not available:', error);
                resolve(false);
            }
        });
    }
    
    async generateWithFlite(text, outputPath) {
        // Use Flite TTS (lightweight alternative)
        return new Promise(async (resolve) => {
            try {
                // Check if flite is available
                await execAsync('which flite');
                
                // Generate speech with flite
                const fliteCmd = `flite -t "${text}" -o "${outputPath}"`;
                await execAsync(fliteCmd);
                
                resolve(true);
            } catch (error) {
                console.error('Flite not available:', error);
                resolve(false);
            }
        });
    }
    
    async generateTextPattern(outputPath, text) {
        // Create a unique audio pattern for the text
        const isUrgent = text.toLowerCase().includes('muhim') || 
                        text.toLowerCase().includes('tezkor') ||
                        text.toLowerCase().includes('favqulodda');
        
        return new Promise((resolve) => {
            console.log('Creating text pattern audio');
            
            // Different patterns for different message types
            let ffmpegArgs;
            
            if (isUrgent) {
                // Urgent: 3 short high beeps + long tone
                ffmpegArgs = [
                    '-f', 'lavfi',
                    '-i', 'sine=f=1000:d=0.15,volume=0.7',
                    '-f', 'lavfi',
                    '-i', 'sine=f=1000:d=0.15,volume=0.7,adelay=300|300',
                    '-f', 'lavfi',
                    '-i', 'sine=f=1000:d=0.15,volume=0.7,adelay=600|600',
                    '-f', 'lavfi',
                    '-i', 'sine=f=800:d=2,volume=0.5,adelay=1000|1000',
                    '-filter_complex', '[0][1][2][3]amix=inputs=4',
                    '-ar', '8000',
                    '-ac', '1',
                    '-y', outputPath
                ];
            } else {
                // Normal: Pleasant chime + tone
                ffmpegArgs = [
                    '-f', 'lavfi',
                    '-i', 'sine=f=523:d=0.2,volume=0.5', // C
                    '-f', 'lavfi',
                    '-i', 'sine=f=659:d=0.2,volume=0.5,adelay=200|200', // E
                    '-f', 'lavfi',
                    '-i', 'sine=f=784:d=0.3,volume=0.5,adelay=400|400', // G
                    '-f', 'lavfi',
                    '-i', 'sine=f=600:d=1.5,volume=0.4,adelay=800|800', // Main tone
                    '-filter_complex', '[0][1][2][3]amix=inputs=4',
                    '-ar', '8000',
                    '-ac', '1',
                    '-y', outputPath
                ];
            }
            
            const ffmpeg = spawn('ffmpeg', ffmpegArgs);
            
            ffmpeg.stderr.on('data', (data) => {
                // Log only errors, not progress
                const output = data.toString();
                if (output.includes('error') || output.includes('Error')) {
                    console.error('FFmpeg error:', output);
                }
            });
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    console.log('Text pattern audio created successfully');
                    resolve(true);
                } else {
                    console.error('FFmpeg failed with code:', code);
                    resolve(false);
                }
            });
            
            ffmpeg.on('error', (err) => {
                console.error('FFmpeg spawn error:', err);
                resolve(false);
            });
        });
    }
    
    checkPresets(text) {
        const presets = {
            'test': 'test-message.wav',
            'salom': 'greeting.wav',
            'xabar': 'notification.wav',
            'bir raqamini bosing': 'press-one.wav',
            'assalomu alaykum': 'greeting-formal.wav',
            'xayrli kun': 'good-day.wav',
            'muhim xabar': 'important-message.wav'
        };
        
        const lowerText = text.toLowerCase();
        for (const [phrase, file] of Object.entries(presets)) {
            if (lowerText.includes(phrase)) {
                const presetPath = path.join(this.presetsDir, file);
                if (fs.existsSync(presetPath)) {
                    const newFileName = `preset-${uuidv4()}.wav`;
                    const newPath = path.join(this.uploadsDir, newFileName);
                    fs.copyFileSync(presetPath, newPath);
                    return newFileName;
                }
            }
        }
        
        return null;
    }

    async generateBeepTone(outputPath) {
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-f', 'lavfi',
                '-i', 'sine=frequency=800:duration=2',
                '-af', 'volume=0.3',
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                '-y',
                outputPath
            ]);
            
            ffmpeg.on('close', (code) => {
                resolve(code === 0);
            });
            
            ffmpeg.on('error', reject);
        });
    }

    async getDefaultAudio() {
        const defaultFile = 'default-notification.wav';
        const defaultPath = path.join(this.uploadsDir, defaultFile);
        
        if (!fs.existsSync(defaultPath)) {
            await this.generateBeepTone(defaultPath);
        }
        
        return defaultFile;
    }
}

module.exports = TTSGenerator;