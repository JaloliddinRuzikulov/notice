const dgram = require('dgram');
const crypto = require('crypto');

// Analyze authentication issue
const config = {
    server: '10.105.0.3',
    port: 5060,
    username: '5530',
    password: '5530'
};

const socket = dgram.createSocket('udp4');
const localPort = 30000 + Math.floor(Math.random() * 10000);

function getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const localIP = getLocalIP();
const tag = 'test' + Date.now();
const callId = 'call' + Date.now() + '@' + localIP;
const branch = 'z9hG4bK' + Date.now();

// Send simple OPTIONS request first
function sendOptions() {
    const uri = `sip:${config.server}`;
    
    const headers = [
        `OPTIONS ${uri} SIP/2.0`,
        `Via: SIP/2.0/UDP ${localIP}:${localPort};branch=${branch}`,
        `From: <sip:${config.username}@${config.server}>;tag=${tag}`,
        `To: <sip:${config.server}>`,
        `Call-ID: ${callId}`,
        `CSeq: 1 OPTIONS`,
        `Max-Forwards: 70`,
        `User-Agent: AuthTest/1.0`,
        `Content-Length: 0`,
        '',
        ''
    ].join('\r\n');
    
    console.log('=== SENDING OPTIONS ===');
    console.log(headers);
    
    const buffer = Buffer.from(headers);
    socket.send(buffer, 0, buffer.length, config.port, config.server);
}

socket.on('message', (msg) => {
    console.log('\n=== RECEIVED ===');
    console.log(msg.toString());
    console.log('=== END ===\n');
    
    // Parse the response
    const lines = msg.toString().split('\r\n');
    const statusLine = lines[0];
    
    if (statusLine.includes('200 OK')) {
        console.log('✅ OPTIONS successful - server is alive');
        console.log('\nNow trying REGISTER...\n');
        
        // Now try register
        setTimeout(sendRegister, 100);
    }
});

function sendRegister() {
    const uri = `sip:${config.username}@${config.server}`;
    
    const headers = [
        `REGISTER sip:${config.server} SIP/2.0`,
        `Via: SIP/2.0/UDP ${localIP}:${localPort};branch=z9hG4bKreg${Date.now()}`,
        `From: <${uri}>;tag=${tag}reg`,
        `To: <${uri}>`,
        `Call-ID: ${callId}reg`,
        `CSeq: 1 REGISTER`,
        `Contact: <sip:${config.username}@${localIP}:${localPort}>`,
        `Expires: 3600`,
        `User-Agent: AuthTest/1.0`,
        `Content-Length: 0`,
        '',
        ''
    ].join('\r\n');
    
    console.log('=== SENDING REGISTER ===');
    console.log(headers);
    
    const buffer = Buffer.from(headers);
    socket.send(buffer, 0, buffer.length, config.port, config.server);
}

socket.bind(localPort, () => {
    console.log(`Listening on ${localIP}:${localPort}\n`);
    sendOptions();
});

setTimeout(() => {
    console.log('\nTest completed');
    socket.close();
    process.exit(0);
}, 10000);