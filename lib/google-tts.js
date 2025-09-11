const https = require('https');
const fs = require('fs');
const path = require('path');

class GoogleTTS {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    }

    async generateSpeech(text, outputPath, options = {}) {
        const { 
            languageCode = 'uz-UZ', // O'zbek tili
            voiceName = 'uz-UZ-Standard-A', // O'zbek ayol ovozi
            ssmlGender = 'FEMALE',
            speakingRate = 1.0
        } = options;

        const requestBody = {
            input: { text },
            voice: {
                languageCode,
                name: voiceName,
                ssmlGender
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate,
                pitch: 0,
                volumeGainDb: 0
            }
        };

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(requestBody);
            
            const options = {
                hostname: 'texttospeech.googleapis.com',
                path: `/v1/text:synthesize?key=${this.apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        if (response.audioContent) {
                            // Decode base64 audio
                            const audioBuffer = Buffer.from(response.audioContent, 'base64');
                            
                            // Save to file
                            fs.writeFileSync(outputPath, audioBuffer);
                            resolve(true);
                        } else {
                            reject(new Error('No audio content in response'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
}

module.exports = GoogleTTS;