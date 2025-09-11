const dgram = require('dgram');
const net = require('net');
const { exec } = require('child_process');

console.log('🔍 BARCHA DTMF formatlarini kuzatish');
console.log('━'.repeat(60));

// 1. SIP INFO monitoring (5060 port)
const sipSocket = dgram.createSocket('udp4');
sipSocket.bind(5060, () => {
    console.log('✅ SIP port 5060 da tinglanmoqda');
});

sipSocket.on('message', (msg, rinfo) => {
    const message = msg.toString();
    if (message.includes('INFO') || message.includes('Signal=') || message.includes('dtmf')) {
        console.log(`\n📞 SIP INFO DTMF from ${rinfo.address}:`);
        console.log(message.substring(0, 500));
    }
});

// 2. RTP monitoring (10000-20000 range)
const rtpPorts = [10000, 10002, 10004, 10006, 10008, 10010];
rtpPorts.forEach(port => {
    const rtpSocket = dgram.createSocket('udp4');
    
    rtpSocket.on('message', (msg, rinfo) => {
        if (msg.length > 12) {
            const payloadType = msg[1] & 0x7F;
            
            // RFC 2833 DTMF (payload type 96-127)
            if (payloadType >= 96 && payloadType <= 127) {
                const payload = msg.slice(12);
                if (payload.length >= 4) {
                    const event = payload[0];
                    const endBit = (payload[1] & 0x80) !== 0;
                    
                    if (event <= 15 && endBit) {
                        const digit = event <= 9 ? event.toString() : 
                                     event === 10 ? '*' : 
                                     event === 11 ? '#' : '?';
                        console.log(`\n🎯 RFC 2833 DTMF on port ${port}: ${digit}`);
                        console.log(`   From: ${rinfo.address}:${rinfo.port}`);
                    }
                }
            }
        }
    });
    
    rtpSocket.bind(port, () => {
        console.log(`✅ RTP port ${port} da tinglanmoqda`);
    });
});

// 3. Tcpdump orqali barcha DTMF trafikni kuzatish
console.log('\n📡 Tcpdump orqali DTMF kuzatish boshlandi...');
const tcpdump = exec('sudo tcpdump -i any -A -s 0 "port 5060 or portrange 10000-20000" 2>/dev/null | grep -E "Signal=|dtmf|DTMF|telephone-event"');

tcpdump.stdout.on('data', (data) => {
    console.log(`\n🔍 TCPDUMP: ${data.toString().trim()}`);
});

// 4. Asterisk SIP channel monitoring
setInterval(() => {
    exec('sudo asterisk -rx "sip show channels" 2>/dev/null | grep 990823112', (err, stdout) => {
        if (stdout) {
            console.log(`\n📞 Active call: ${stdout.trim()}`);
        }
    });
}, 5000);

console.log('\n✅ Monitoring tayyor. Test qiling:');
console.log('1. 990823112 ga qo\'ng\'iroq qiling');
console.log('2. Javob berilgandan keyin 1 ni bosing');
console.log('3. DTMF qaysi formatda kelayotganini kuzating\n');

// Keep running
process.on('SIGINT', () => {
    console.log('\n🛑 Monitoring to\'xtatildi');
    process.exit(0);
});