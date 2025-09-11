const { getSIPBackend } = require('./lib/sip-backend');
const path = require('path');
const fs = require('fs');

// Configuration
const phoneNumber = '990823112';
const audioFile = path.join(__dirname, 'public/audio/test-message.wav');
const messageText = 'Salom Jahongir aka bu test xabar agar siz buni yigirma sekunddan ortiq eshitsangiz barcha muammolar hal bolgan demakdir iltimos oxirigacha tinglang';

console.log('=== TO\'G\'RIDAN-TO\'G\'RI BACKEND ORQALI QO\'NG\'IROQ ===');
console.log('Vaqt:', new Date().toLocaleString('uz-UZ'));
console.log('Raqam:', phoneNumber);
console.log('');

// Check if audio file exists, if not create it
if (!fs.existsSync(audioFile)) {
    console.log('Audio fayl topilmadi, yaratilmoqda...');
    const TTSGenerator = require('./lib/tts-generator');
    const ttsGenerator = new TTSGenerator();
    
    (async () => {
        try {
            await ttsGenerator.generateAudio(messageText, audioFile);
            console.log('✅ Audio fayl yaratildi');
            await makeCall();
        } catch (error) {
            console.error('Audio yaratishda xato:', error);
        }
    })();
} else {
    makeCall();
}

async function makeCall() {
    const startTime = Date.now();
    let callAnswered = false;
    let callDuration = 0;
    let callAnsweredTime = null;
    let sipBackend = null;
    
    console.log('📞 QO\'NG\'IROQ QILINMOQDA...');
    
    try {
        // Get SIP backend instance
        sipBackend = await getSIPBackend({
            server: '10.105.0.3',
            port: 5060,
            username: '5530',
            password: '5530',
            domain: '10.105.0.3'
        });
        
        console.log('✅ SIP backend initialized');
        
        // Subscribe to events
        sipBackend.on('call-answered', (callId) => {
            callAnswered = true;
            callAnsweredTime = Date.now();
            console.log('✅ JAVOB BERILDI!');
        });
        
        sipBackend.on('call-ended', (callId, reason) => {
            const totalTime = Math.round((Date.now() - startTime) / 1000);
            
            // Calculate actual call duration (from answer to end)
            if (callAnswered && callAnsweredTime) {
                callDuration = Math.round((Date.now() - callAnsweredTime) / 1000);
            }
            
            console.log(`\n📊 Qo'ng'iroq tugadi`);
            console.log(`Sabab: ${reason}`);
            console.log(`Umumiy vaqt: ${totalTime} sekund`);
            console.log(`Suhbat davomiyligi: ${callDuration} sekund`);
            
            if (callAnswered && callDuration >= 20) {
                console.log('\n🎉 MUVAFFAQIYAT! Muammo hal bo\'ldi!');
                console.log(`Qo'ng'iroq ${callDuration} sekund davom etdi`);
            } else if (callAnswered && callDuration < 20) {
                console.log('\n❌ MUAMMO! Qo\'ng\'iroq juda qisqa!');
                console.log(`Faqat ${callDuration} sekund davom etdi`);
            } else {
                console.log('\n❌ Javob berilmadi');
            }
            
            setTimeout(() => process.exit(0), 1000);
        });
        
        // Track duration
        const durationInterval = setInterval(() => {
            if (callAnswered && callAnsweredTime) {
                const currentDuration = Math.round((Date.now() - callAnsweredTime) / 1000);
                if (currentDuration % 5 === 0 && currentDuration > 0) {
                    console.log(`⏱️  ${currentDuration} sekund...`);
                }
            }
        }, 1000);
        
        // Make the call
        const callId = sipBackend.makeCall(phoneNumber, audioFile);
        console.log('Call ID:', callId);
        
        // Set timeout
        setTimeout(() => {
            clearInterval(durationInterval);
            
            if (callAnswered && callAnsweredTime) {
                const finalDuration = Math.round((Date.now() - callAnsweredTime) / 1000);
                if (finalDuration >= 20) {
                    console.log('\n✅ Test muvaffaqiyatli tugadi');
                } else {
                    console.log('\n⏱️  Timeout - qo\'ng\'iroq juda qisqa');
                }
            } else {
                console.log('\n⏱️  Timeout - javob berilmadi');
            }
            
            sipBackend.endCall(callId);
        }, 60000); // 60 seconds timeout
        
    } catch (error) {
        console.error('Qo\'ng\'iroqda xato:', error);
        process.exit(1);
    }
}