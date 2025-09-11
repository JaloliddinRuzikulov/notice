#!/usr/bin/env node

const dgram = require('dgram');
const fs = require('fs');
const { exec } = require('child_process');
const RFC2833DTMFProcessor = require('./lib/rfc2833-dtmf-processor');

console.log('🔬 DTMF CHUQUR DEBUG - BARCHA KOMPONENTLAR');
console.log('═'.repeat(70));

// Initialize components
const rfc2833Processor = new RFC2833DTMFProcessor();
const logFile = fs.createWriteStream('dtmf-deep-debug.log', { flags: 'a' });

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    logFile.write(logMessage + '\n');
}

// 1. System Information
log('SISTEMA MA\'LUMOTLARI:', 'SYSTEM');
exec('ip addr show | grep inet', (err, stdout) => {
    log(`Network interfaces:\n${stdout}`, 'SYSTEM');
});

// 2. Check Asterisk connection
log('ASTERISK ULANISHI TEKSHIRILMOQDA...', 'CHECK');
exec('nc -zvu 10.105.0.3 5060 2>&1', (err, stdout, stderr) => {
    log(`Asterisk SIP port: ${stderr || stdout}`, 'CHECK');
});

// 3. Multiple UDP listeners
const listeners = [];

// SIP ports
[5060, 5061, 5062].forEach(port => {
    const socket = dgram.createSocket('udp4');
    
    socket.on('message', (msg, rinfo) => {
        const message = msg.toString();
        
        // Detailed SIP analysis
        if (message.startsWith('SIP/2.0') || message.includes('SIP/2.0')) {
            const lines = message.split('\r\n');
            const firstLine = lines[0];
            
            log(`SIP xabar [${port}] from ${rinfo.address}:${rinfo.port}`, 'SIP');
            
            // Check for INFO method
            if (firstLine.includes('INFO')) {
                log('🎯 SIP INFO ANIQLANDI!', 'DTMF');
                log(`To'liq INFO:\n${message}`, 'DTMF');
                
                // Extract Signal
                const signalMatch = message.match(/Signal=(\d+)/);
                if (signalMatch) {
                    log(`📞 DTMF Signal: ${signalMatch[1]}`, 'DTMF');
                }
            }
            
            // Log all SIP methods
            const methodMatch = firstLine.match(/^(\w+)\s+/);
            if (methodMatch) {
                log(`SIP Method: ${methodMatch[1]}`, 'SIP');
            }
        }
    });
    
    socket.on('error', (err) => {
        log(`Socket error on ${port}: ${err.message}`, 'ERROR');
    });
    
    socket.bind(port, () => {
        log(`✅ SIP port ${port} tinglanyapti`, 'INIT');
    });
    
    listeners.push(socket);
});

// RTP ports with RFC 2833 processing
const rtpPorts = [10000, 10002, 10004, 10006, 10008, 10010, 10012, 10014];
rtpPorts.forEach(port => {
    const socket = dgram.createSocket('udp4');
    
    socket.on('message', (msg, rinfo) => {
        // Process with RFC 2833 processor
        rfc2833Processor.processRTPPacket(msg, `unknown-${port}`, rinfo);
        
        // Additional manual checking
        if (msg.length > 12) {
            const payloadType = msg[1] & 0x7F;
            
            if (payloadType >= 96 && payloadType <= 127) {
                log(`RTP PT ${payloadType} on port ${port} from ${rinfo.address}`, 'RTP');
            }
        }
    });
    
    socket.bind(port, () => {
        log(`✅ RTP port ${port} tinglanyapti`, 'INIT');
    });
    
    listeners.push(socket);
});

// RFC 2833 processor events
rfc2833Processor.on('dtmf', (data) => {
    log('🎉 RFC 2833 DTMF ANIQLANDI!', 'DTMF');
    log(`Digit: ${data.digit}, Duration: ${data.duration}ms`, 'DTMF');
    log(`Source: ${data.source}`, 'DTMF');
});

// 4. Tcpdump comprehensive capture
log('NETWORK CAPTURE BOSHLANDI...', 'TCPDUMP');
const tcpdump = exec(`sudo tcpdump -i any -s 0 -w dtmf-capture-${Date.now()}.pcap "port 5060 or portrange 10000-20000" 2>&1`);

tcpdump.stderr.on('data', (data) => {
    log(`tcpdump: ${data}`, 'TCPDUMP');
});

// 5. Server log monitoring
const tailProcess = exec('tail -f server.log 2>/dev/null');
tailProcess.stdout.on('data', (data) => {
    if (data.includes('DTMF') || data.includes('INFO') || 
        data.includes('broadcast-confirmed') || data.includes('Signal=')) {
        log(`SERVER.LOG: ${data.trim()}`, 'LOG');
    }
});

// 6. Asterisk channel monitoring
setInterval(() => {
    exec('sudo asterisk -rx "sip show channels" 2>/dev/null', (err, stdout) => {
        if (stdout && stdout.includes('990823112')) {
            log(`ACTIVE CHANNEL: ${stdout.trim()}`, 'ASTERISK');
        }
    });
    
    // Check SIP peer
    exec('sudo asterisk -rx "sip show peer 5530" 2>/dev/null | grep -i dtmf', (err, stdout) => {
        if (stdout) {
            log(`DTMF MODE: ${stdout.trim()}`, 'ASTERISK');
        }
    });
}, 10000);

// 7. Statistics
setInterval(() => {
    const stats = rfc2833Processor.getStats();
    log(`RFC2833 Stats: ${JSON.stringify(stats)}`, 'STATS');
}, 30000);

// 8. Test helper
console.log('\n' + '='.repeat(70));
console.log('📞 TEST QILISH UCHUN:');
console.log('1. 990823112 ga qo\'ng\'iroq qiling');
console.log('2. Javob berilgandan keyin 1 ni bosing');
console.log('3. Natijalarni kuzating');
console.log('='.repeat(70) + '\n');

// Graceful shutdown
process.on('SIGINT', () => {
    log('MONITORING TO\'XTATILMOQDA...', 'SYSTEM');
    
    listeners.forEach(socket => socket.close());
    tcpdump.kill();
    tailProcess.kill();
    logFile.end();
    
    // Save final report
    const report = `
DTMF DEBUG HISOBOT
==================
Vaqt: ${new Date().toLocaleString()}
RFC2833 Stats: ${JSON.stringify(rfc2833Processor.getStats())}

Log fayl: dtmf-deep-debug.log
Network capture: dtmf-capture-*.pcap
`;
    
    fs.writeFileSync('dtmf-debug-report.txt', report);
    console.log('\n✅ Hisobot saqlandi: dtmf-debug-report.txt');
    
    process.exit(0);
});