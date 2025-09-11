#!/usr/bin/env node

const dgram = require('dgram');

console.log('🔍 DTMF Monitor - Barcha usullar');
console.log('═'.repeat(50));

// Monitor all methods
const methods = [];

// 1. SIP INFO
const sipSocket = dgram.createSocket('udp4');
sipSocket.bind(5061, () => {
    console.log('✅ SIP INFO monitor: port 5061');
});

sipSocket.on('message', (msg) => {
    const data = msg.toString();
    if (data.includes('INFO') || data.includes('Signal=')) {
        console.log('📞 SIP INFO DTMF detected!');
        methods.push('SIP INFO');
    }
});

// 2. RTP RFC 2833
[10002, 10004].forEach(port => {
    const rtpSocket = dgram.createSocket('udp4');
    rtpSocket.bind(port, () => {
        console.log(`✅ RTP monitor: port ${port}`);
    });
    
    rtpSocket.on('message', (msg) => {
        if (msg.length > 12) {
            const pt = msg[1] & 0x7F;
            if (pt >= 96 && pt <= 127) {
                console.log('📞 RFC 2833 DTMF detected!');
                methods.push('RFC 2833');
            }
        }
    });
});

// 3. Internal endpoint
const http = require('http');
const internalServer = http.createServer((req, res) => {
    if (req.url === '/dtmf-test' && req.method === 'POST') {
        console.log('📞 Internal DTMF endpoint hit!');
        methods.push('Internal API');
        res.end('OK');
    }
});

internalServer.listen(8446, () => {
    console.log('✅ Internal monitor: port 8446');
});

// Report
setInterval(() => {
    if (methods.length > 0) {
        console.log('\n📊 DTMF Methods Detected:', [...new Set(methods)]);
        methods.length = 0;
    }
}, 10000);

console.log('\n📞 Test: 990823112 ga qo\'ng\'iroq qilib 1 ni bosing\n');
