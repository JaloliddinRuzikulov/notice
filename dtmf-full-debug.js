// DTMF Debug Script - Barcha DTMF yo'llarini tekshirish
const dgram = require('dgram');

console.log('🔍 DTMF Full Debug Script');
console.log('━'.repeat(50));

// 1. RTP portlarni tekshirish
console.log('\n1️⃣ RTP Portlarni tekshirish:');
const testPorts = [10002, 10000, 10004, 10006, 10008];

testPorts.forEach(port => {
    const socket = dgram.createSocket('udp4');
    
    socket.on('error', (err) => {
        console.log(`   ❌ Port ${port}: ${err.message}`);
        socket.close();
    });
    
    socket.on('listening', () => {
        const address = socket.address();
        console.log(`   ✅ Port ${port}: Ochiq va tinglayapti`);
        socket.close();
    });
    
    socket.on('message', (msg, rinfo) => {
        console.log(`   📨 Port ${port}: Paket qabul qilindi from ${rinfo.address}:${rinfo.port}`);
        
        // DTMF payload tekshirish
        if (msg.length > 12) {
            const payloadType = msg[1] & 0x7F;
            console.log(`      Payload Type: ${payloadType}`);
            
            if (payloadType >= 96 && payloadType <= 127) {
                const dtmfPayload = msg.slice(12);
                if (dtmfPayload.length >= 4) {
                    const event = dtmfPayload[0];
                    const endBit = (dtmfPayload[1] & 0x80) !== 0;
                    const digit = event <= 9 ? event.toString() : event === 10 ? '*' : event === 11 ? '#' : '?';
                    console.log(`      🎯 DTMF ANIQLANDI: ${digit} (endBit: ${endBit})`);
                }
            }
        }
    });
    
    try {
        socket.bind(port);
    } catch (e) {
        console.log(`   ⚠️  Port ${port}: ${e.message}`);
    }
});

// 2. Asterisk DTMF sozlamalarini tekshirish
console.log('\n2️⃣ Asterisk DTMF Mode tekshirish:');
const { exec } = require('child_process');

exec('sudo asterisk -rx "sip show peer 5530" | grep -i dtmf', (err, stdout, stderr) => {
    if (err) {
        console.log('   ⚠️  Asterisk\'ga ulanib bo\'lmadi');
    } else {
        console.log('   ' + (stdout.trim() || '❌ DTMF mode topilmadi'));
    }
});

// 3. tcpdump orqali DTMF trafikni kuzatish
console.log('\n3️⃣ DTMF trafik kuzatuvi (30 soniya):');
console.log('   Iltimos, test qo\'ng\'iroq qiling va 1 ni bosing...\n');

const tcpdump = exec('sudo timeout 30 tcpdump -i any -n "udp and (port 10002 or portrange 10000-20000)" -A 2>/dev/null | grep -E "Signal=|dtmf|DTMF"', (err, stdout, stderr) => {
    if (stdout) {
        console.log('   📡 DTMF trafik aniqlandi:');
        console.log(stdout);
    } else {
        console.log('   ❌ Hech qanday DTMF trafik aniqlanmadi');
    }
});

// 4. SIP INFO method tekshirish  
console.log('\n4️⃣ SIP INFO DTMF tekshirish:');
exec('sudo timeout 30 tcpdump -i any -n "port 5060" -A 2>/dev/null | grep -E "INFO|Signal=|dtmf"', (err, stdout) => {
    if (stdout) {
        console.log('   📞 SIP INFO DTMF aniqlandi:');
        console.log(stdout);
    }
});

// Keep script running
setTimeout(() => {
    console.log('\n✅ Debug tugadi');
    process.exit(0);
}, 35000);