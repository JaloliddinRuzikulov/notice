#!/usr/bin/env node

/**
 * Complete DTMF Fix Implementation
 * This integrates all DTMF detection methods
 */

const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

console.log('🔧 DTMF TO\'LIQ TUZATISH');
console.log('═'.repeat(60));

// 1. Update server.js to include internal DTMF route
console.log('\n1️⃣ Server.js ga internal DTMF route qo\'shish...');
const serverPath = path.join(__dirname, 'server.js');
const serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('internal-dtmf')) {
    const newRoute = `
// Internal DTMF endpoint
const internalDTMF = require('./routes/internal-dtmf');
app.use('/api/internal', internalDTMF);
`;
    
    // Find where to insert (after other routes)
    const insertPoint = serverContent.indexOf('// Start server');
    if (insertPoint > -1) {
        const updatedContent = 
            serverContent.slice(0, insertPoint) + 
            newRoute + '\n' +
            serverContent.slice(insertPoint);
        
        fs.writeFileSync(serverPath, updatedContent);
        console.log('   ✅ Internal DTMF route qo\'shildi');
    }
} else {
    console.log('   ℹ️  Internal DTMF route allaqachon mavjud');
}

// 2. Update sip-backend.js to handle all DTMF methods
console.log('\n2️⃣ SIP Backend DTMF integratsiyasi...');
const sipBackendPath = path.join(__dirname, 'lib/sip-backend.js');
const sipContent = fs.readFileSync(sipBackendPath, 'utf8');

// Make sipBackend globally accessible
if (!sipContent.includes('global.sipBackend')) {
    const sipUpdated = sipContent.replace(
        'async initialize() {',
        'async initialize() {\n        // Make globally accessible for DTMF\n        global.sipBackend = this;'
    );
    fs.writeFileSync(sipBackendPath, sipUpdated);
    console.log('   ✅ SIP Backend global qilindi');
}

// 3. Create DTMF test monitor
console.log('\n3️⃣ DTMF monitor yaratish...');
const monitorScript = `#!/usr/bin/env node

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
        console.log(\`✅ RTP monitor: port \${port}\`);
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
        console.log('\\n📊 DTMF Methods Detected:', [...new Set(methods)]);
        methods.length = 0;
    }
}, 10000);

console.log('\\n📞 Test: 990823112 ga qo\\'ng\\'iroq qilib 1 ni bosing\\n');
`;

fs.writeFileSync(path.join(__dirname, 'dtmf-monitor-all.js'), monitorScript);
console.log('   ✅ Monitor script yaratildi');

// 4. Create Asterisk instructions
console.log('\n4️⃣ Asterisk ko\'rsatmalari...');
const instructions = `
ASTERISK DTMF SOZLAMALARI
========================

1. SSH orqali Asterisk serverga kiring:
   ssh admin@10.105.0.3

2. SIP konfiguratsiyani tahrirlang:
   nano /etc/asterisk/sip.conf

3. [5530] qismida qo'shing:
   dtmfmode=info

4. Dialplan yangilang:
   nano /etc/asterisk/extensions_custom.conf
   
   ${fs.readFileSync(path.join(__dirname, 'asterisk/xabarnoma-dialplan-fixed.conf'), 'utf8')}

5. Asterisk qayta yuklang:
   asterisk -rx "sip reload"
   asterisk -rx "dialplan reload"

6. AGI script nusxalang:
   scp ${path.join(__dirname, 'asterisk/xabarnoma-confirm.agi')} admin@10.105.0.3:/var/lib/asterisk/agi-bin/

7. Test qiling:
   asterisk -rx "originate SIP/990823112@5530 extension 999@xabarnoma-test"
`;

fs.writeFileSync(path.join(__dirname, 'ASTERISK_DTMF_INSTRUCTIONS.txt'), instructions);
console.log('   ✅ Asterisk ko\'rsatmalari saqlandi');

// 5. Summary
console.log('\n' + '═'.repeat(60));
console.log('✅ DTMF TUZATISH TAYYOR!');
console.log('\nQuyidagilarni bajaring:');
console.log('1. Server qayta ishga tushiring: npm run dev');
console.log('2. Monitor ishga tushiring: node dtmf-monitor-all.js');
console.log('3. Asterisk sozlamalarini yangilang (ASTERISK_DTMF_INSTRUCTIONS.txt)');
console.log('4. Test qiling: 990823112 ga qo\'ng\'iroq qilib 1 ni bosing');
console.log('═'.repeat(60));