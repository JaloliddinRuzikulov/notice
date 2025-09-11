const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Try to load online TTS APIs
let onlineTTS = null;
try {
    onlineTTS = require('./tts-online-apis');
} catch (error) {
    console.log('Online TTS APIs not available');
}

// Try to load Piper TTS
let piperTTS = null;
try {
    piperTTS = require('./tts-piper');
} catch (error) {
    console.log('Piper TTS not available');
}

class TTSGenerator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../public/audio/uploads');
        this.presetsDir = path.join(__dirname, '../public/audio/presets');
        
        // Create directories if they don't exist
        [this.uploadsDir, this.presetsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Check available TTS engines
        this.checkAvailableEngines();
    }

    async checkAvailableEngines() {
        this.engines = {
            espeakNg: await this.commandExists('espeak-ng'),
            espeak: await this.commandExists('espeak'),
            flite: await this.commandExists('flite'),
            gtts: await this.commandExists('gtts-cli')
        };
        
        console.log('Available TTS engines:', this.engines);
    }

    commandExists(command) {
        return new Promise(resolve => {
            exec(`which ${command}`, (error) => {
                resolve(!error);
            });
        });
    }

    async generateAudio(text, options = {}) {
        // Default options
        const { language = 'uz', speed = 140, voice = 'female' } = options;
        
        // First check if we have a preset audio for common phrases
        const presetFile = this.checkPresets(text);
        if (presetFile) {
            console.log('Using preset audio:', presetFile);
            return presetFile;
        }

        const fileName = `tts-${uuidv4()}.wav`;
        const filePath = path.join(this.uploadsDir, fileName);
        
        try {
            // Try Piper TTS first (best quality offline)
            if (piperTTS && piperTTS.available) {
                console.log('Trying Piper TTS...');
                const success = await piperTTS.generate(text, filePath, { language, speed, voice });
                if (success) {
                    console.log('Piper TTS successful');
                    return fileName;
                }
            }
            
            // Try online TTS if available
            if (onlineTTS && process.env.VOICERSS_API_KEY) {
                console.log('Trying VoiceRSS online TTS...');
                const success = await onlineTTS.generateWithVoiceRSS(text, filePath, { language, speed, voice });
                if (success) {
                    console.log('VoiceRSS TTS successful');
                    return fileName;
                }
            }
            
            // Try offline TTS engines
            if (this.engines.espeakNg) {
                await this.generateWithEspeakNg(text, filePath, { language, speed, voice });
            } else if (this.engines.espeak) {
                await this.generateWithEspeak(text, filePath, { language, speed, voice });
            } else if (this.engines.gtts) {
                await this.generateWithGtts(text, filePath, { language });
            } else if (this.engines.flite) {
                await this.generateWithFlite(text, filePath, { voice });
            } else {
                // Fallback: create a simple beep tone
                await this.generateBeepTone(filePath);
            }
            
            // Post-process audio for better quality
            const processedFileName = await this.postProcessAudio(filePath);
            console.log('TTS audio generated:', processedFileName || fileName);
            return processedFileName || fileName;
        } catch (error) {
            console.error('TTS generation failed:', error);
            // Return a default audio file if all else fails
            return await this.getDefaultAudio();
        }
    }

    generateWithEspeakNg(text, outputPath, options = {}) {
        const { language = 'uz', speed = 140, voice = 'female' } = options;
        
        return new Promise((resolve, reject) => {
            // Map language codes - use Russian voices for better quality
            const langMap = {
                'uz': 'ru', // Use Russian voice for Uzbek (better quality)
                'ru': 'ru',
                'en': 'en'
            };
            
            // Voice variants for espeak-ng - use better quality voices
            const voiceSettings = {
                'female': {
                    variant: '+f5',  // Better female voice
                    pitch: '65',     // Higher pitch for female
                },
                'male': {
                    variant: '+m7',  // Better male voice  
                    pitch: '40',     // Lower pitch for male
                }
            };
            
            const settings = voiceSettings[voice] || voiceSettings.female;
            const voiceCode = langMap[language] + settings.variant;
            
            const args = [
                '-v', voiceCode,        // Language + voice variant
                '-s', String(speed),    // Speed (words per minute)
                '-p', settings.pitch,   // Pitch
                '-a', '190',           // Amplitude (slightly lower for clarity)
                '-g', '15',            // Word gap (more natural pauses)
                '-k', '5',             // Emphasis/capitals indicator
                '--punct',             // Speak punctuation for clarity
                '-w', outputPath,
                text
            ];
            
            const espeak = spawn('espeak-ng', args);
            
            espeak.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`espeak-ng exited with code ${code}`));
                }
            });
            
            espeak.on('error', reject);
        });
    }

    generateWithEspeak(text, outputPath, options = {}) {
        const { language = 'ru', speed = 140, voice = 'female' } = options;
        
        return new Promise((resolve, reject) => {
            // Regular espeak might not have Uzbek, try Russian as fallback
            const langMap = {
                'uz': 'ru', // Fallback to Russian
                'ru': 'ru',
                'en': 'en'
            };
            
            const voiceVariant = voice === 'female' ? '+f3' : '+m3';
            const voiceCode = langMap[language] + voiceVariant;
            
            const args = [
                '-v', voiceCode, // Language + voice
                '-s', String(speed), // Speed
                '-p', '60',      // Pitch
                '-a', '200',     // Volume
                '-w', outputPath,
                text
            ];
            
            const espeak = spawn('espeak', args);
            
            espeak.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`espeak exited with code ${code}`));
                }
            });
            
            espeak.on('error', reject);
        });
    }

    generateWithGtts(text, outputPath, options = {}) {
        const { language = 'ru' } = options;
        
        return new Promise((resolve, reject) => {
            // Google TTS - needs internet
            const tempMp3 = outputPath.replace('.wav', '.mp3');
            
            // Map language codes for Google TTS
            const langMap = {
                'uz': 'ru', // Fallback to Russian
                'ru': 'ru',
                'en': 'en'
            };
            
            const gtts = spawn('gtts-cli', [
                '--lang', langMap[language],
                '--output', tempMp3,
                text
            ]);
            
            gtts.on('close', (code) => {
                if (code === 0) {
                    // Convert MP3 to WAV
                    exec(`ffmpeg -i "${tempMp3}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}" -y`, (error) => {
                        fs.unlinkSync(tempMp3); // Clean up temp file
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject(new Error(`gtts-cli exited with code ${code}`));
                }
            });
            
            gtts.on('error', reject);
        });
    }

    generateWithFlite(text, outputPath, options = {}) {
        const { voice = 'female' } = options;
        
        return new Promise((resolve, reject) => {
            // Flite voices
            const voiceMap = {
                'female': 'slt',
                'male': 'kal'
            };
            
            const flite = spawn('flite', [
                '-voice', voiceMap[voice] || 'slt',
                '-t', text,
                '-o', outputPath
            ]);
            
            flite.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`flite exited with code ${code}`));
                }
            });
            
            flite.on('error', reject);
        });
    }

    async generateBeepTone(outputPath) {
        // Generate a simple beep tone using FFmpeg
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-f', 'lavfi',
                '-i', 'sine=frequency=1000:duration=1',
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                '-y',
                outputPath
            ]);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`FFmpeg beep generation failed with code ${code}`));
                }
            });
            
            ffmpeg.on('error', reject);
        });
    }

    checkPresets(text) {
        // Check for common phrases and use pre-recorded audio
        const presets = {
            'test': 'test-message.wav',
            'salom': 'greeting.wav',
            'xabar': 'notification.wav',
            '1 raqamini bosing': 'press-one.wav',
            'bir raqamini bosing': 'press-one.wav',
            // O'zbek tilida qo'shimcha iboralar
            'assalomu alaykum': 'greeting-formal.wav',
            'xayrli kun': 'good-day.wav',
            'xayrli tong': 'good-morning.wav',
            'xayrli kech': 'good-evening.wav',
            'tasdiqlash uchun': 'for-confirmation.wav',
            'iltimos': 'please.wav',
            'rahmat': 'thank-you.wav',
            'e\'tibor bering': 'attention.wav',
            'muhim xabar': 'important-message.wav'
        };
        
        const lowerText = text.toLowerCase();
        for (const [phrase, file] of Object.entries(presets)) {
            if (lowerText.includes(phrase)) {
                const presetPath = path.join(this.presetsDir, file);
                if (fs.existsSync(presetPath)) {
                    // Copy to uploads dir with new name
                    const newFileName = `preset-${uuidv4()}.wav`;
                    const newPath = path.join(this.uploadsDir, newFileName);
                    fs.copyFileSync(presetPath, newPath);
                    return newFileName;
                }
            }
        }
        
        return null;
    }

    async getDefaultAudio() {
        // Create or use a default notification sound
        const defaultFile = 'default-notification.wav';
        const defaultPath = path.join(this.uploadsDir, defaultFile);
        
        if (!fs.existsSync(defaultPath)) {
            // Generate a simple notification sound
            await this.generateBeepTone(defaultPath);
        }
        
        return defaultFile;
    }

    // Generate audio numbers for DTMF instructions
    async generateNumberAudio(number, language = 'uz') {
        const numbers = {
            uz: {
                '1': 'bir',
                '2': 'ikki',
                '3': 'uch',
                '4': 'to\'rt',
                '5': 'besh',
                '6': 'olti',
                '7': 'yetti',
                '8': 'sakkiz',
                '9': 'to\'qqiz',
                '0': 'nol'
            },
            ru: {
                '1': 'один',
                '2': 'два',
                '3': 'три',
                '4': 'четыре',
                '5': 'пять',
                '6': 'шесть',
                '7': 'семь',
                '8': 'восемь',
                '9': 'девять',
                '0': 'ноль'
            },
            en: {
                '1': 'one',
                '2': 'two',
                '3': 'three',
                '4': 'four',
                '5': 'five',
                '6': 'six',
                '7': 'seven',
                '8': 'eight',
                '9': 'nine',
                '0': 'zero'
            }
        };
        
        const langNumbers = numbers[language] || numbers.uz;
        const text = langNumbers[number] || number;
        
        const phrases = {
            uz: `${text} raqamini bosing`,
            ru: `нажмите цифру ${text}`,
            en: `press ${text}`
        };
        
        return this.generateAudio(phrases[language] || phrases.uz, { language });
    }
    
    // O'zbek tilidagi umumiy iboralar
    getUzbekPhrases() {
        return {
            greeting: 'Assalomu alaykum',
            goodbye: 'Xayr',
            yes: 'Ha',
            no: 'Yo\'q',
            thanks: 'Rahmat',
            please: 'Iltimos',
            excuse_me: 'Kechirasiz',
            confirm: 'Tasdiqlash',
            cancel: 'Bekor qilish',
            wait: 'Kuting',
            ready: 'Tayyor',
            start: 'Boshlash',
            end: 'Tugatish',
            help: 'Yordam',
            error: 'Xatolik',
            success: 'Muvaffaqiyat',
            warning: 'Ogohlantirish',
            attention: 'E\'tibor',
            important: 'Muhim',
            urgent: 'Shoshilinch'
        };
    }
    
    // Post-process audio for better quality
    async postProcessAudio(inputPath) {
        try {
            const outputFileName = `processed_${path.basename(inputPath)}`;
            const outputPath = path.join(this.uploadsDir, outputFileName);
            
            return new Promise((resolve) => {
                const ffmpeg = spawn('ffmpeg', [
                    '-i', inputPath,
                    '-af', [
                        // Noise reduction and clarity enhancement
                        'highpass=f=100',           // Remove low frequency noise
                        'lowpass=f=4000',           // Remove high frequency noise
                        'aresample=8000',           // Telephony sample rate
                        'highpass=f=200',           // Remove low frequency noise
                        'lowpass=f=3400',           // Remove high frequency noise  
                        'equalizer=f=800:t=h:w=400:g=3',  // Boost voice frequencies
                        'equalizer=f=2000:t=h:w=400:g=2', // Boost clarity
                        'compand=attacks=0.3:decays=0.8:points=-80/-80|-45/-45|-27/-15|-15/-10|0/-7|20/-5:gain=5', // Better compression
                        'volume=2',                 // Increase volume
                        'aecho=0.8:0.88:60:0.4',   // Natural echo
                        'chorus=0.5:0.9:50:0.4:0.25:2', // Add chorus for warmth
                        'asubboost',                // Boost sub frequencies
                        'aphaser=type=t:speed=2:decay=0.6' // More natural phaser
                    ].join(','),
                    '-ar', '16000',                 // Sample rate for telephony
                    '-ac', '1',                     // Mono
                    '-c:a', 'pcm_s16le',           // PCM format
                    '-y',                           // Overwrite
                    outputPath
                ]);
                
                ffmpeg.on('close', (code) => {
                    if (code === 0) {
                        // Delete original file
                        fs.unlinkSync(inputPath);
                        resolve(outputFileName);
                    } else {
                        console.error('Audio post-processing failed');
                        resolve(null);
                    }
                });
                
                ffmpeg.on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    resolve(null);
                });
            });
        } catch (error) {
            console.error('Post-processing error:', error);
            return null;
        }
    }
}

module.exports = new TTSGenerator();