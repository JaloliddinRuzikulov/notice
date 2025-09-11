const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);
const presetsDir = path.join(__dirname, '../public/audio/presets');

// Create presets directory if it doesn't exist
if (!fs.existsSync(presetsDir)) {
    fs.mkdirSync(presetsDir, { recursive: true });
}

// O'zbek tilidagi preset iboralar
const presets = [
    {
        name: 'test-message.wav',
        text: 'Bu test xabari. Iltimos bir raqamini bosing'
    },
    {
        name: 'greeting.wav', 
        text: 'Salom'
    },
    {
        name: 'greeting-formal.wav',
        text: 'Assalomu alaykum'
    },
    {
        name: 'good-day.wav',
        text: 'Xayrli kun'
    },
    {
        name: 'good-morning.wav',
        text: 'Xayrli tong'
    },
    {
        name: 'good-evening.wav',
        text: 'Xayrli kech'
    },
    {
        name: 'notification.wav',
        text: 'Sizga muhim xabar bor'
    },
    {
        name: 'press-one.wav',
        text: 'Tasdiqlash uchun bir raqamini bosing'
    },
    {
        name: 'for-confirmation.wav',
        text: 'Tasdiqlash uchun'
    },
    {
        name: 'please.wav',
        text: 'Iltimos'
    },
    {
        name: 'thank-you.wav',
        text: 'Rahmat'
    },
    {
        name: 'attention.wav',
        text: 'E\'tibor bering'
    },
    {
        name: 'important-message.wav',
        text: 'Muhim xabar'
    }
];

async function createPresetAudio(preset) {
    const filePath = path.join(presetsDir, preset.name);
    
    try {
        // First try with espeak-ng for O'zbek
        try {
            await execAsync('which espeak-ng');
            const command = `espeak-ng -v uz+f3 -s 140 -p 50 -a 200 -g 10 -w "${filePath}" "${preset.text}"`;
            await execAsync(command);
            console.log(`✓ Created with espeak-ng: ${preset.name}`);
            return;
        } catch (e) {
            // espeak-ng not available
        }
        
        // Try with regular espeak
        try {
            await execAsync('which espeak');
            const command = `espeak -v ru+f3 -s 140 -p 60 -a 200 -w "${filePath}" "${preset.text}"`;
            await execAsync(command);
            console.log(`✓ Created with espeak: ${preset.name}`);
            return;
        } catch (e) {
            // espeak not available
        }
        
        // Fallback to tone generation
        console.log(`⚠ Creating tone for ${preset.name} (TTS not available)`);
        
        // Map text length to duration
        const duration = Math.min(5, Math.max(1, preset.text.length / 10));
        
        return new Promise((resolve, reject) => {
            const ffmpeg = spawn('ffmpeg', [
                '-f', 'lavfi',
                '-i', `sine=frequency=800:duration=${duration}`,
                '-af', 'volume=0.3,tremolo=f=5:d=0.5',
                '-acodec', 'pcm_s16le',
                '-ar', '16000',
                '-ac', '1',
                '-y',
                filePath
            ]);
            
            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Failed to create ${preset.name}`));
                }
            });
        });
    } catch (error) {
        console.error(`✗ Failed to create ${preset.name}:`, error.message);
    }
}

async function createAllPresets() {
    console.log('Creating preset audio files...');
    
    for (const preset of presets) {
        try {
            await createPresetAudio(preset);
        } catch (error) {
            console.error(`Failed to create ${preset.name}:`, error);
        }
    }
    
    console.log('Preset audio files created!');
}

// Also create a more natural sounding default using multiple tones
async function createNaturalDefault() {
    const filePath = path.join(presetsDir, 'natural-speech.wav');
    
    return new Promise((resolve, reject) => {
        // Create a more complex audio that sounds more like speech
        const ffmpeg = spawn('ffmpeg', [
            '-f', 'lavfi',
            '-i', 'anoisesrc=duration=2:amplitude=0.03',
            '-f', 'lavfi', 
            '-i', 'sine=frequency=200:duration=2',
            '-f', 'lavfi',
            '-i', 'sine=frequency=400:duration=2', 
            '-filter_complex', '[1][2]amix=inputs=2,volume=0.5,highpass=f=200,lowpass=f=3000,tremolo=f=4:d=0.3[speech];[0][speech]amix=inputs=2[out]',
            '-map', '[out]',
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            filePath
        ]);
        
        ffmpeg.on('close', (code) => {
            if (code === 0) {
                console.log('Created natural speech preset');
                resolve();
            } else {
                reject(new Error('Failed to create natural speech preset'));
            }
        });
    });
}

// Run the script
createAllPresets().then(() => {
    return createNaturalDefault();
}).catch(console.error);