#!/usr/bin/env node

const dgram = require('dgram');
const crypto = require('crypto');

// Debug authentication with full details
const config = {
    server: '10.105.0.3',
    port: 5060,
    username: '5530',
    password: '5530'
};

const socket = dgram.createSocket('udp4');
const localPort = 30000 + Math.floor(Math.random() * 10000);
const localIP = getLocalIP();

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

let authChallenge = null;
let authCount = 0;

const tag = 'tag' + Date.now();
const callId = Date.now() + '@' + localIP;
let branch = 'z9hG4bK' + Date.now();
let cseq = 1;

function sendRegister() {
    const uri = `sip:${config.username}@${config.server}`;
    
    const headers = [
        `REGISTER sip:${config.server} SIP/2.0`,
        `Via: SIP/2.0/UDP ${localIP}:${localPort};branch=${branch}`,
        `From: <${uri}>;tag=${tag}`,
        `To: <${uri}>`,
        `Call-ID: ${callId}`,
        `CSeq: ${cseq} REGISTER`,
        `Contact: <sip:${config.username}@${localIP}:${localPort}>`,
        `Max-Forwards: 70`,
        `User-Agent: DebugClient/1.0`,
        `Expires: 3600`
    ];
    
    if (authChallenge) {
        const authHeader = createAuth();
        headers.push(`Authorization: ${authHeader}`);
    }
    
    headers.push('Content-Length: 0', '', '');
    
    const message = headers.join('\r\n');
    
    console.log('\n=== SENDING REGISTER ===');
    console.log(message.split('\r\n').slice(0, -2).join('\n'));
    console.log('========================\n');
    
    socket.send(Buffer.from(message), config.port, config.server);
}

function createAuth() {
    console.log('\n=== CREATING AUTH ===');
    console.log('Username:', config.username);
    console.log('Password:', config.password);
    console.log('Realm:', authChallenge.realm);
    console.log('Nonce:', authChallenge.nonce);
    console.log('Opaque:', authChallenge.opaque);
    console.log('QOP:', authChallenge.qop);
    console.log('Algorithm:', authChallenge.algorithm);
    
    const username = config.username;
    const password = config.password;
    const realm = authChallenge.realm;
    const nonce = authChallenge.nonce;
    const uri = `sip:${config.server}`;
    const method = 'REGISTER';
    
    // HA1 = MD5(username:realm:password)
    const ha1Input = `${username}:${realm}:${password}`;
    const ha1 = crypto.createHash('md5').update(ha1Input).digest('hex');
    console.log('\nHA1 input:', ha1Input);
    console.log('HA1:', ha1);
    
    // HA2 = MD5(method:uri)
    const ha2Input = `${method}:${uri}`;
    const ha2 = crypto.createHash('md5').update(ha2Input).digest('hex');
    console.log('\nHA2 input:', ha2Input);
    console.log('HA2:', ha2);
    
    let response;
    let authStr = `Digest username="${username}",realm="${realm}",nonce="${nonce}",uri="${uri}"`;
    
    if (authChallenge.qop) {
        const nc = '00000001';
        const cnonce = crypto.randomBytes(8).toString('hex');
        
        const responseInput = `${ha1}:${nonce}:${nc}:${cnonce}:${authChallenge.qop}:${ha2}`;
        response = crypto.createHash('md5').update(responseInput).digest('hex');
        
        console.log('\nResponse input (with qop):', responseInput);
        console.log('Response:', response);
        
        authStr += `,response="${response}",cnonce="${cnonce}",nc=${nc},qop=${authChallenge.qop}`;
    } else {
        const responseInput = `${ha1}:${nonce}:${ha2}`;
        response = crypto.createHash('md5').update(responseInput).digest('hex');
        
        console.log('\nResponse input (no qop):', responseInput);
        console.log('Response:', response);
        
        authStr += `,response="${response}"`;
    }
    
    authStr += `,algorithm=${authChallenge.algorithm || 'MD5'}`;
    
    if (authChallenge.opaque) {
        authStr += `,opaque="${authChallenge.opaque}"`;
    }
    
    console.log('\nFinal auth header:', authStr);
    console.log('====================\n');
    
    return authStr;
}

socket.on('message', (msg) => {
    const message = msg.toString();
    console.log('\n=== RECEIVED ===');
    console.log(message);
    console.log('================\n');
    
    const lines = message.split('\r\n');
    const statusLine = lines[0];
    
    if (statusLine.includes('401')) {
        authCount++;
        
        if (authCount > 2) {
            console.log('❌ TOO MANY AUTH ATTEMPTS!');
            console.log('\nPossible issues:');
            console.log('1. Wrong password');
            console.log('2. User not configured on server');
            console.log('3. IP not allowed');
            console.log('4. Different realm expected');
            process.exit(1);
        }
        
        // Parse WWW-Authenticate
        let wwwAuth = null;
        for (const line of lines) {
            if (line.startsWith('WWW-Authenticate:')) {
                wwwAuth = line.substring(18);
                break;
            }
        }
        
        if (!wwwAuth) {
            console.log('❌ No WWW-Authenticate header!');
            process.exit(1);
        }
        
        console.log('Parsing auth challenge:', wwwAuth);
        
        // Parse challenge
        authChallenge = {};
        const digestPart = wwwAuth.replace('Digest ', '');
        
        // Handle both quoted and unquoted values
        const parts = digestPart.split(',');
        for (const part of parts) {
            const [key, ...valueParts] = part.trim().split('=');
            const value = valueParts.join('=').replace(/"/g, '');
            authChallenge[key] = value;
        }
        
        console.log('Parsed challenge:', authChallenge);
        
        // Update for retry
        cseq++;
        branch = 'z9hG4bK' + Date.now() + authCount;
        
        // Retry with auth
        setTimeout(sendRegister, 100);
        
    } else if (statusLine.includes('200')) {
        console.log('✅ REGISTRATION SUCCESSFUL!');
        process.exit(0);
    }
});

socket.bind(localPort, () => {
    console.log(`Debug client on ${localIP}:${localPort}`);
    console.log(`Target: ${config.server}:${config.port}`);
    console.log(`User: ${config.username}`);
    console.log(`Pass: ${config.password}`);
    console.log('');
    
    sendRegister();
});

setTimeout(() => {
    console.log('\n⏱️ Timeout!');
    process.exit(1);
}, 10000);