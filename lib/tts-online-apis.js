const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class OnlineTTSAPIs {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../public/audio/uploads');
    }

    // Yandex SpeechKit - Russian/Turkish supported
    async generateWithYandex(text, outputPath, options = {}) {
        const { language = 'ru', voice = 'female', speed = 1.0 } = options;
        
        // Yandex voices
        const voices = {
            'ru-female': 'alena',  // Premium Russian female
            'ru-male': 'filipp',   // Premium Russian male
            'tr-female': 'silaerkan', // Turkish female (for Turkic languages)
            'en-female': 'jane',   // English female
            'en-male': 'nick'      // English male
        };

        const voiceKey = `${language === 'uz' ? 'tr' : language}-${voice}`;
        const selectedVoice = voices[voiceKey] || voices['ru-female'];

        try {
            const response = await axios({
                method: 'POST',
                url: 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
                headers: {
                    'Authorization': `Api-Key ${process.env.YANDEX_API_KEY}`,
                },
                data: new URLSearchParams({
                    text: text,
                    voice: selectedVoice,
                    emotion: 'good',
                    speed: speed / 140,
                    format: 'lpcm',
                    sampleRateHertz: 16000
                }),
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(true));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Yandex TTS error:', error.message);
            return false;
        }
    }

    // VoiceRSS - Multiple languages
    async generateWithVoiceRSS(text, outputPath, options = {}) {
        const { language = 'ru', voice = 'female', speed = 0 } = options;
        
        const langMap = {
            'uz': 'tr-tr', // Use Turkish for Uzbek
            'ru': 'ru-ru',
            'en': 'en-us'
        };

        try {
            const response = await axios({
                method: 'GET',
                url: 'https://api.voicerss.org/',
                params: {
                    key: process.env.VOICERSS_API_KEY || 'demo',
                    hl: langMap[language] || 'ru-ru',
                    v: voice === 'female' ? 'Yelena' : 'Boris',
                    src: text,
                    r: speed,
                    c: 'WAV',
                    f: '16khz_16bit_mono',
                    ssml: false,
                    b64: false
                },
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(true));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('VoiceRSS error:', error.message);
            return false;
        }
    }

    // ResponsiveVoice - Web-based TTS
    async generateWithResponsiveVoice(text, outputPath, options = {}) {
        const { language = 'ru', voice = 'female', speed = 1.0 } = options;
        
        const voices = {
            'uz-female': 'Turkish Female',
            'uz-male': 'Turkish Male',
            'ru-female': 'Russian Female',
            'ru-male': 'Russian Male',
            'en-female': 'UK English Female',
            'en-male': 'UK English Male'
        };

        const voiceKey = `${language}-${voice}`;
        const selectedVoice = voices[voiceKey] || voices['ru-female'];

        // This requires a paid API key
        try {
            const response = await axios({
                method: 'POST',
                url: 'https://api.responsivevoice.org/v1/text:synthesize',
                data: {
                    text: text,
                    voice: selectedVoice,
                    pitch: voice === 'female' ? 1.1 : 0.9,
                    rate: speed / 140,
                    volume: 1
                },
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.RESPONSIVE_VOICE_KEY}`
                },
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(outputPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(true));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('ResponsiveVoice error:', error.message);
            return false;
        }
    }

    // Elevenlabs - AI Voice (Premium quality)
    async generateWithElevenLabs(text, outputPath, options = {}) {
        const { voice = 'female' } = options;
        
        const voices = {
            'female': 'EXAVITQu4vr4xnSDxMaL', // Bella
            'male': 'pNInz6obpgDQGcFmaJgB'    // Adam
        };

        try {
            const response = await axios({
                method: 'POST',
                url: `https://api.elevenlabs.io/v1/text-to-speech/${voices[voice]}/stream`,
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': process.env.ELEVEN_LABS_KEY,
                    'Content-Type': 'application/json'
                },
                data: {
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5,
                        style: 0.5,
                        use_speaker_boost: true
                    }
                },
                responseType: 'stream'
            });

            // Convert MP3 to WAV
            const tempMp3 = outputPath.replace('.wav', '.mp3');
            const writer = fs.createWriteStream(tempMp3);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', async () => {
                    // Convert to WAV
                    const ffmpeg = spawn('ffmpeg', [
                        '-i', tempMp3,
                        '-acodec', 'pcm_s16le',
                        '-ar', '16000',
                        '-ac', '1',
                        '-y',
                        outputPath
                    ]);

                    ffmpeg.on('close', (code) => {
                        fs.unlinkSync(tempMp3);
                        resolve(code === 0);
                    });
                });
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('ElevenLabs error:', error.message);
            return false;
        }
    }
}

module.exports = new OnlineTTSAPIs();