const dgram = require('dgram');
const fs = require('fs');

console.log('🔍 DTMF Full Debug - Barcha SIP/RTP trafikni kuzatish');
console.log('━'.repeat(60));

// Create debug log file
const logStream = fs.createWriteStream('dtmf-debug.log', { flags: 'a' });
function log(msg) {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    logStream.write(logMsg + '\n');
}

// 1. SIP Socket (port 5060 va dinamik portlar)
const sipPorts = [5060, 50398, 0]; // 0 = random port
const sipSockets = [];

sipPorts.forEach(port => {
    const socket = dgram.createSocket('udp4');
    
    socket.on('message', (msg, rinfo) => {
        const message = msg.toString();
        
        // Check for INFO method with DTMF
        if (message.includes('INFO sip:')) {
            log(`\n🎯 SIP INFO detected from ${rinfo.address}:${rinfo.port}`);
            log(`Full message:\n${message}`);
            
            // Parse for DTMF signals
            if (message.includes('Signal=') || message.includes('dtmf')) {
                log('✅ DTMF SIGNAL FOUND IN INFO!');
                const signalMatch = message.match(/Signal=(\d+)/);
                if (signalMatch) {
                    log(`📞 DTMF Digit: ${signalMatch[1]}`);
                }
            }
        }
        
        // Check for any DTMF related content
        if (message.toLowerCase().includes('dtmf') || 
            message.includes('telephone-event') ||
            message.includes('Signal=')) {
            log(`\n📡 DTMF Related SIP Message from ${rinfo.address}:${rinfo.port}`);
            log(`First 200 chars: ${message.substring(0, 200)}`);
        }
    });
    
    socket.on('error', (err) => {
        log(`SIP Socket error on port ${port}: ${err.message}`);
    });
    
    try {
        socket.bind(port === 0 ? undefined : port, () => {
            const addr = socket.address();
            log(`SIP Socket listening on ${addr.address}:${addr.port}`);
        });
        sipSockets.push(socket);
    } catch (e) {
        log(`Failed to bind SIP port ${port}: ${e.message}`);
    }
});

// 2. RTP Sockets (multiple ports)
const rtpPorts = [10002, 10000, 10004, 10006];
const rtpSockets = [];

rtpPorts.forEach(port => {
    const socket = dgram.createSocket('udp4');
    
    socket.on('message', (msg, rinfo) => {
        // RTP header is 12 bytes minimum
        if (msg.length >= 12) {
            const payloadType = msg[1] & 0x7F;
            
            // Common DTMF payload types: 101, 96-127 (dynamic)
            if (payloadType >= 96) {
                log(`\n🔊 RTP Packet on port ${port} from ${rinfo.address}:${rinfo.port}`);
                log(`   Payload Type: ${payloadType}`);
                
                // Check for RFC 2833/4733 DTMF
                if (msg.length > 12) {
                    const payload = msg.slice(12);
                    if (payload.length >= 4) {
                        const event = payload[0];
                        const endBit = (payload[1] & 0x80) !== 0;
                        const volume = payload[1] & 0x3F;
                        const duration = (payload[2] << 8) | payload[3];
                        
                        if (event <= 15) { // Valid DTMF events are 0-15
                            const digit = event <= 9 ? event.toString() : 
                                         event === 10 ? '*' : 
                                         event === 11 ? '#' : 
                                         String.fromCharCode(65 + event - 12); // A-D
                            
                            log(`   🎯 RFC 2833/4733 DTMF Event!`);
                            log(`   Digit: ${digit}, End: ${endBit}, Duration: ${duration}ms`);
                        }
                    }
                }
            }
        }
    });
    
    socket.on('error', (err) => {
        log(`RTP Socket error on port ${port}: ${err.message}`);
    });
    
    try {
        socket.bind(port, () => {
            log(`RTP Socket listening on port ${port}`);
        });
        rtpSockets.push(socket);
    } catch (e) {
        log(`Failed to bind RTP port ${port}: ${e.message}`);
    }
});

// 3. Monitor main server port
const mainSocket = dgram.createSocket('udp4');
mainSocket.on('message', (msg, rinfo) => {
    const message = msg.toString();
    if (message.includes('INFO') || message.includes('DTMF') || message.includes('Signal=')) {
        log(`\n📨 Main server received from ${rinfo.address}:${rinfo.port}`);
        log(`Message preview: ${message.substring(0, 100)}...`);
    }
});

mainSocket.on('error', (err) => {
    log(`Main socket error: ${err.message}`);
});

// 4. Monitor file changes
const { spawn } = require('child_process');
const tail = spawn('tail', ['-f', '/home/user/server.log']);

tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
        if (line.includes('DTMF') || line.includes('INFO') || 
            line.includes('Signal=') || line.includes('digit')) {
            log(`📄 Server.log: ${line}`);
        }
    });
});

// 5. Network interface check
const os = require('os');
const interfaces = os.networkInterfaces();
log('\n🌐 Network Interfaces:');
Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
            log(`   ${name}: ${iface.address}`);
        }
    });
});

log('\n✅ Debug script running. Waiting for DTMF signals...');
log('📞 Test qilish: 990823112 ga qo\'ng\'iroq qiling va 1 ni bosing\n');

// Keep running
setInterval(() => {
    process.stdout.write('.');
}, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
    log('\n🛑 Shutting down debug script...');
    sipSockets.forEach(s => s.close());
    rtpSockets.forEach(s => s.close());
    mainSocket.close();
    logStream.end();
    process.exit(0);
});