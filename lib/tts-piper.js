const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const SecurityUtils = require('./security-utils');

class PiperTTS {
    constructor() {
        this.modelsDir = '/usr/share/piper-voices';
        this.checkAvailability();
    }

    async checkAvailability() {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
            await execAsync('which piper');
            this.available = true;
            console.log('Piper TTS is available');
        } catch (error) {
            this.available = false;
            console.log('Piper TTS not installed');
        }
    }

    async generate(text, outputPath, options = {}) {
        if (!this.available) {
            throw new Error('Piper TTS not available');
        }

        const { language = 'ru', voice = 'female', speed = 1.0 } = options;

        // Model mapping
        const models = {
            'ru-female': 'ru/ru_RU-irina-medium.onnx',
            'ru-male': 'ru/ru_RU-ruslan-medium.onnx',
            'en-female': 'en/en_US-amy-medium.onnx',
            'en-male': 'en/en_US-danny-low.onnx'
        };

        const modelKey = `${language === 'uz' ? 'ru' : language}-${voice}`;
        const modelPath = path.join(this.modelsDir, models[modelKey] || models['ru-female']);

        // Check if model exists
        if (!fs.existsSync(modelPath)) {
            console.error(`Piper model not found: ${modelPath}`);
            return false;
        }

        return new Promise((resolve, reject) => {
            const args = [
                '--model', modelPath,
                '--output_file', outputPath,
                '--length_scale', String(1.0 / speed), // Inverse for speed
                '--noise_scale', '0.667',
                '--noise_w', '0.8'
            ];

            const piper = spawn('piper', args);
            
            // Sanitize text and send to stdin
            const safeText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
            piper.stdin.write(safeText);
            piper.stdin.end();

            let stderr = '';
            piper.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            piper.on('close', (code) => {
                if (code === 0 && fs.existsSync(outputPath)) {
                    console.log('Piper TTS generated successfully');
                    resolve(true);
                } else {
                    console.error('Piper TTS failed:', stderr);
                    resolve(false);
                }
            });

            piper.on('error', (err) => {
                console.error('Piper TTS error:', err);
                resolve(false);
            });
        });
    }
}

module.exports = new PiperTTS();