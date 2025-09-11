const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);

class GoogleTTS {
    constructor() {
        // Google Cloud credentials o'rnatilgan bo'lsa ishlaydi
        try {
            this.client = new TextToSpeechClient();
            this.available = true;
        } catch (error) {
            console.log('Google TTS not configured:', error.message);
            this.available = false;
        }
    }

    async synthesize(text, outputPath, options = {}) {
        if (!this.available) {
            throw new Error('Google TTS not available');
        }

        const { language = 'ru-RU', voice = 'female', speed = 1.0 } = options;

        // Voice mapping
        const voiceMap = {
            'uz': { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-A' }, // Uzbek not supported, use Russian
            'ru': { 
                languageCode: 'ru-RU', 
                name: voice === 'female' ? 'ru-RU-Wavenet-A' : 'ru-RU-Wavenet-B'
            },
            'en': { 
                languageCode: 'en-US', 
                name: voice === 'female' ? 'en-US-Wavenet-F' : 'en-US-Wavenet-D'
            }
        };

        const selectedVoice = voiceMap[language] || voiceMap.ru;

        const request = {
            input: { text: text },
            voice: {
                languageCode: selectedVoice.languageCode,
                name: selectedVoice.name,
                ssmlGender: voice === 'female' ? 'FEMALE' : 'MALE'
            },
            audioConfig: {
                audioEncoding: 'LINEAR16',
                speakingRate: speed / 140, // Convert to Google's scale
                pitch: voice === 'female' ? 2.0 : -2.0,
                volumeGainDb: 3.0,
                sampleRateHertz: 16000,
                effectsProfileId: ['telephony-class-application']
            }
        };

        try {
            const [response] = await this.client.synthesizeSpeech(request);
            await writeFile(outputPath, response.audioContent, 'binary');
            return true;
        } catch (error) {
            console.error('Google TTS error:', error);
            return false;
        }
    }
}

module.exports = new GoogleTTS();