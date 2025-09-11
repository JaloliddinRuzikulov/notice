const axios = require('axios');
const fs = require('fs');

async function createAndMonitorBroadcast() {
    console.log('=== WEB ORQALI TEST XABAR YARATISH ===\n');
    
    // First login as admin
    console.log('1. Admin login qilish...');
    const loginRes = await axios.post('https://172.27.64.10:8444/login', {
        username: 'admin',
        password: 'admin'
    }, {
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
    
    const cookies = loginRes.headers['set-cookie'];
    const sessionCookie = cookies.find(c => c.includes('xabarnoma.sid')).split(';')[0];
    console.log('✅ Login successful');
    
    // Create broadcast
    console.log('\n2. Xabar yaratish...');
    const broadcastData = {
        subject: 'Test - Server orqali',
        message: 'Salom Jahongir aka bu test xabar agar siz buni yigirma sekunddan ortiq eshitsangiz muammo hal bolgan iltimos oxirigacha eshiting',
        employeeIds: ['1752836081636'], // Ro'ziqulov Jahongir
        sipAccounts: ['1']
    };
    
    try {
        const createRes = await axios.post('https://172.27.64.10:8444/api/broadcast/create', 
            broadcastData, {
            headers: {
                'Cookie': sessionCookie,
                'Content-Type': 'application/json'
            },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
            maxRedirects: 0,
            validateStatus: (status) => status < 500
        });
        
        console.log('Response status:', createRes.status);
        console.log('Response:', createRes.data);
        
        let broadcastId = null;
        if (createRes.data && createRes.data.broadcastId) {
            broadcastId = createRes.data.broadcastId;
        } else if (createRes.headers.location) {
            // Maybe redirected, check history
            console.log('Redirect detected, checking broadcast history...');
            
            const historyRes = await axios.get('https://172.27.64.10:8444/api/broadcast/list', {
                headers: { 'Cookie': sessionCookie },
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
            });
            
            if (historyRes.data && historyRes.data.length > 0) {
                broadcastId = historyRes.data[0].id;
            }
        }
        
        if (!broadcastId) {
            console.log('❌ Broadcast ID topilmadi');
            return;
        }
        
        console.log('✅ Xabar yaratildi:', broadcastId);
        
        // Monitor the broadcast
        console.log('\n3. Jarayonni kuzatish...\n');
        
        let previousStatus = '';
        let checkCount = 0;
        
        const monitor = setInterval(async () => {
            checkCount++;
            
            try {
                const statusRes = await axios.get(`https://172.27.64.10:8444/api/broadcast/status/${broadcastId}`, {
                    headers: { 'Cookie': sessionCookie },
                    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
                });
                
                const broadcast = statusRes.data;
                const currentTime = new Date().toLocaleTimeString();
                
                // Status changed?
                if (broadcast.status !== previousStatus) {
                    console.log(`\n[${currentTime}] STATUS O'ZGARDI: ${previousStatus || 'new'} → ${broadcast.status}`);
                    previousStatus = broadcast.status;
                }
                
                // Check call attempts for our number
                const attempts = broadcast.callAttempts?.['990823112'] || [];
                if (attempts.length > 0) {
                    const lastAttempt = attempts[attempts.length - 1];
                    
                    console.log(`[${currentTime}] Qo'ng'iroq holati:`);
                    console.log(`  → Urinish: #${lastAttempt.attemptNumber}`);
                    console.log(`  → Status: ${lastAttempt.status}`);
                    
                    if (lastAttempt.answered) {
                        console.log(`  → JAVOB BERILDI ✅`);
                        console.log(`  → Ring vaqti: ${lastAttempt.ringDuration}s`);
                    }
                    
                    if (lastAttempt.endTime && lastAttempt.duration !== undefined) {
                        console.log(`  → QO'NG'IROQ TUGADI`);
                        console.log(`  → DAVOMIYLIGI: ${lastAttempt.duration} sekund`);
                        
                        if (lastAttempt.duration >= 20) {
                            console.log('\n🎉 MUVAFFAQIYAT! Qo\'ng\'iroq 20+ sekund davom etdi!');
                        } else if (lastAttempt.duration <= 5) {
                            console.log('\n❌ MUAMMO! Qo\'ng\'iroq juda qisqa: ' + lastAttempt.duration + ' sekund');
                        }
                    }
                    
                    if (lastAttempt.failureReason) {
                        console.log(`  → Xatolik: ${lastAttempt.failureReason}`);
                    }
                }
                
                // Active calls info
                if (broadcast.channelStatus) {
                    console.log(`  → Aktiv qo'ng'iroqlar: ${broadcast.channelStatus.activeChannels}/${broadcast.channelStatus.maxChannels}`);
                }
                
                // Check if complete
                if (broadcast.status === 'completed' || broadcast.status === 'failed') {
                    console.log(`\n=== XABAR ${broadcast.status.toUpperCase()} ===`);
                    console.log('Tasdiqlanganlar:', broadcast.confirmedCount || 0);
                    console.log('Jami qo\'ng\'iroqlar:', Object.keys(broadcast.callAttempts || {}).length);
                    
                    clearInterval(monitor);
                    
                    // Save full log
                    const fs = require('fs');
                    const logFile = `/home/user/broadcast-test-${Date.now()}.json`;
                    fs.writeFileSync(logFile, JSON.stringify(broadcast, null, 2));
                    console.log(`\nTo'liq ma'lumot saqlandi: ${logFile}`);
                }
                
                // Timeout
                if (checkCount > 60) { // 5 minutes
                    console.log('\n⏱️ Timeout - 5 daqiqa o\'tdi');
                    clearInterval(monitor);
                }
                
            } catch (error) {
                console.error('Monitor error:', error.message);
            }
        }, 5000); // Check every 5 seconds
        
    } catch (error) {
        console.error('❌ Xato:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

// Start
createAndMonitorBroadcast();