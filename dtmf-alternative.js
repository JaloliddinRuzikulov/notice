const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getSIPBackend } = require('./lib/sip-backend');

async function makeTestCall() {
    console.log('=== DTMF Alternative Test ===\n');
    console.log('990823112 raqamiga qo\'ng\'iroq qilaman.');
    console.log('Men qo\'ng\'iroqni 30 sekund davomida ochiq qoldiraman.\n');
    console.log('Agar siz telefonda "1" ni bossangiz:');
    console.log('  - Broadcast tasdiqlash uchun qo\'ng\'iroq 5-10 sekundda tugashi kerak');
    console.log('  - Aks holda qo\'ng\'iroq 30 sekund davom etadi\n');
    
    let sip;
    let callId;
    let callAnswered = false;
    let callAnswerTime = null;
    let callEndTime = null;
    
    try {
        // Get SIP instance
        sip = await getSIPBackend({
            instanceId: 'dtmf-alternative'
        });
        
        console.log('✓ SIP tayyor\n');
        
        // Setup event handlers
        sip.on('call-ringing', () => {
            console.log('🔔 Telefon jiringlamoqda...');
        });
        
        sip.on('call-answered', () => {
            console.log('\n✅ TELEFON JAVOB BERILDI!');
            console.log('📱 Endi telefonda "1" tugmasini bosing');
            console.log('⏱️  Vaqt hisoblanmoqda...\n');
            callAnswered = true;
            callAnswerTime = Date.now();
            
            // Set a 30 second timeout
            setTimeout(() => {
                if (callId && !callEndTime) {
                    console.log('\n⏱️ 30 sekund o\'tdi - qo\'ng\'iroqni tugataman...');
                    sip.endCall(callId);
                }
            }, 30000);
        });
        
        sip.on('call-ended', () => {
            callEndTime = Date.now();
            console.log('\n📵 Qo\'ng\'iroq yakunlandi');
            
            if (callAnswerTime && callEndTime) {
                const duration = (callEndTime - callAnswerTime) / 1000;
                console.log(`\n📊 Qo\'ng\'iroq davomiyligi: ${duration.toFixed(1)} sekund`);
                
                if (duration < 15) {
                    console.log('✅ Qo\'ng\'iroq tez tugatildi - EHTIMOL "1" BOSILGAN!');
                    console.log('   (Agar siz "1" bosdingiz, demak broadcast tasdiqlash ishlayapti)');
                } else {
                    console.log('❌ Qo\'ng\'iroq uzoq davom etdi - "1" bosilmagan');
                }
            }
            
            setTimeout(() => process.exit(0), 2000);
        });
        
        sip.on('call-failed', (data) => {
            console.log(`\n❌ Qo\'ng\'iroq xatosi: ${data.reason}`);
            process.exit(1);
        });
        
        // Also try to detect DTMF if possible
        sip.on('broadcast-confirmed', (data) => {
            console.log('\n🎉 DTMF ANIQLANDI! "1" bosildi!');
            console.log('Qo\'ng\'iroqni tugataman...');
            setTimeout(() => {
                if (callId) {
                    sip.endCall(callId);
                }
            }, 2000);
        });
        
        // Make the call
        console.log('Qo\'ng\'iroq qilinmoqda...');
        const result = await sip.makeCall('990823112', {
            audioFile: '00b9a41c-6855-4a93-b577-04f1ca8368bc.mp3',
            broadcastId: 'dtmf-alternative',
            employeeId: 'test-990823112'
        });
        
        callId = result.callId;
        console.log(`Call ID: ${callId}\n`);
        
    } catch (error) {
        console.error('Xato:', error.message);
        process.exit(1);
    }
}

// Ctrl+C handler
process.on('SIGINT', () => {
    console.log('\n\nTo\'xtatildi');
    process.exit(0);
});

// Start
makeTestCall();