#!/usr/bin/env node

/**
 * DTMF Simulator
 * Simulates DTMF signals for testing without actual phone calls
 */

const dgram = require('dgram');
const net = require('net');
const readline = require('readline');

// Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Configuration
const config = {
    sipServer: '127.0.0.1',
    sipPort: 5060,
    rtpPort: 10002,
    internalAPIPort: 8445
};

// Terminal interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.clear();
console.log(`${colors.bright}${colors.cyan}📱 DTMF Simulator${colors.reset}`);
console.log(`${colors.dim}${'='.repeat(60)}${colors.reset}`);
console.log('');
console.log('This tool simulates DTMF signals for testing.');
console.log('');

/**
 * Generate SIP INFO with DTMF
 */
function generateSIPInfo(digit, callId = 'test-call-123') {
    const message = [
        `INFO sip:990823112@${config.sipServer}:${config.sipPort} SIP/2.0`,
        'Via: SIP/2.0/UDP 127.0.0.1:5061;branch=z9hG4bK123456',
        `From: <sip:5530@${config.sipServer}>;tag=simulator123`,
        `To: <sip:990823112@${config.sipServer}>;tag=as12345678`,
        `Call-ID: ${callId}`,
        'CSeq: 102 INFO',
        'Content-Type: application/dtmf-relay',
        'Content-Length: 10',
        '',
        `Signal=${digit}`,
        'Duration=250',
        ''
    ].join('\r\n');
    
    return Buffer.from(message);
}

/**
 * Generate RFC 2833 RTP packet
 */
function generateRFC2833(digit) {
    // Convert digit to event code
    let event;
    if (digit >= '0' && digit <= '9') {
        event = parseInt(digit);
    } else if (digit === '*') {
        event = 10;
    } else if (digit === '#') {
        event = 11;
    } else {
        event = 0;
    }
    
    // RTP header (12 bytes)
    const rtpHeader = Buffer.alloc(12);
    rtpHeader[0] = 0x80; // Version 2, no padding, no extension, no CSRC
    rtpHeader[1] = 101 | 0x80; // Payload type 101 with marker bit
    rtpHeader.writeUInt16BE(1234, 2); // Sequence number
    rtpHeader.writeUInt32BE(Date.now(), 4); // Timestamp
    rtpHeader.writeUInt32BE(0x12345678, 8); // SSRC
    
    // RFC 2833 payload (4 bytes)
    const payload = Buffer.alloc(4);
    payload[0] = event; // Event (DTMF digit)
    payload[1] = 0x8A; // End bit set, Volume 10
    payload.writeUInt16BE(250, 2); // Duration
    
    return Buffer.concat([rtpHeader, payload]);
}

/**
 * Send SIP INFO
 */
function sendSIPInfo(digit, phoneNumber = '990823112') {
    const socket = dgram.createSocket('udp4');
    const message = generateSIPInfo(digit);
    
    socket.send(message, config.sipPort, config.sipServer, (err) => {
        if (err) {
            console.log(`${colors.red}❌ Error sending SIP INFO: ${err.message}${colors.reset}`);
        } else {
            console.log(`${colors.green}✅ SIP INFO sent: Signal=${digit} to ${phoneNumber}${colors.reset}`);
        }
        socket.close();
    });
}

/**
 * Send RFC 2833
 */
function sendRFC2833(digit) {
    const socket = dgram.createSocket('udp4');
    const packet = generateRFC2833(digit);
    
    // Send multiple packets to ensure detection
    let count = 0;
    const interval = setInterval(() => {
        socket.send(packet, config.rtpPort, config.sipServer, (err) => {
            if (err && count === 0) {
                console.log(`${colors.red}❌ Error sending RFC 2833: ${err.message}${colors.reset}`);
            }
        });
        
        count++;
        if (count >= 3) {
            clearInterval(interval);
            console.log(`${colors.green}✅ RFC 2833 sent: Event=${digit} (3 packets)${colors.reset}`);
            socket.close();
        }
    }, 20); // 20ms intervals
}

/**
 * Send to Internal API
 */
function sendInternalAPI(digit, phoneNumber = '990823112') {
    const client = new net.Socket();
    
    client.connect(config.internalAPIPort, config.sipServer, () => {
        const message = `DTMF ${digit} ${phoneNumber}\r\n`;
        client.write(message);
        console.log(`${colors.green}✅ Internal API sent: DTMF ${digit} for ${phoneNumber}${colors.reset}`);
        client.end();
    });
    
    client.on('error', (err) => {
        console.log(`${colors.yellow}⚠️  Internal API not available (port ${config.internalAPIPort})${colors.reset}`);
    });
}

/**
 * Send via HTTP API
 */
async function sendHTTPAPI(digit, phoneNumber = '990823112') {
    try {
        const https = require('https');
        const data = JSON.stringify({
            phone: phoneNumber,
            digit: digit,
            channel: 'SIP/5530-simulator',
            uniqueid: Date.now().toString()
        });
        
        const options = {
            hostname: 'localhost',
            port: 8444,
            path: '/api/internal/dtmf-confirm',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            rejectUnauthorized: false
        };
        
        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log(`${colors.green}✅ HTTP API sent: Digit ${digit} for ${phoneNumber}${colors.reset}`);
            } else {
                console.log(`${colors.yellow}⚠️  HTTP API returned: ${res.statusCode}${colors.reset}`);
            }
        });
        
        req.on('error', (err) => {
            console.log(`${colors.yellow}⚠️  HTTP API not available${colors.reset}`);
        });
        
        req.write(data);
        req.end();
    } catch (error) {
        console.log(`${colors.red}❌ HTTP API error: ${error.message}${colors.reset}`);
    }
}

/**
 * Interactive menu
 */
function showMenu() {
    console.log('');
    console.log(`${colors.cyan}Available commands:${colors.reset}`);
    console.log(`  ${colors.bright}1-9, *, #${colors.reset} - Send DTMF digit`);
    console.log(`  ${colors.bright}a${colors.reset}         - Send all methods for digit 1`);
    console.log(`  ${colors.bright}s${colors.reset}         - Send SIP INFO only`);
    console.log(`  ${colors.bright}r${colors.reset}         - Send RFC 2833 only`);
    console.log(`  ${colors.bright}i${colors.reset}         - Send Internal API only`);
    console.log(`  ${colors.bright}h${colors.reset}         - Send HTTP API only`);
    console.log(`  ${colors.bright}t${colors.reset}         - Test sequence (1,2,3)`);
    console.log(`  ${colors.bright}q${colors.reset}         - Quit`);
    console.log('');
}

/**
 * Send all methods
 */
function sendAllMethods(digit) {
    console.log(`${colors.bright}Sending digit ${digit} via all methods...${colors.reset}`);
    sendSIPInfo(digit);
    setTimeout(() => sendRFC2833(digit), 100);
    setTimeout(() => sendInternalAPI(digit), 200);
    setTimeout(() => sendHTTPAPI(digit), 300);
}

/**
 * Test sequence
 */
function sendTestSequence() {
    console.log(`${colors.bright}Sending test sequence 1, 2, 3...${colors.reset}`);
    
    const digits = ['1', '2', '3'];
    digits.forEach((digit, index) => {
        setTimeout(() => {
            console.log(`${colors.yellow}Sending digit ${digit}...${colors.reset}`);
            sendAllMethods(digit);
        }, index * 2000); // 2 second intervals
    });
}

/**
 * Process command
 */
function processCommand(cmd) {
    cmd = cmd.trim().toLowerCase();
    
    if (cmd === 'q') {
        console.log(`${colors.dim}Goodbye!${colors.reset}`);
        process.exit(0);
    }
    
    if (cmd === 'a') {
        sendAllMethods('1');
    } else if (cmd === 's') {
        rl.question('Enter digit to send via SIP INFO: ', (digit) => {
            if (digit.match(/^[0-9*#]$/)) {
                sendSIPInfo(digit);
            } else {
                console.log(`${colors.red}Invalid digit${colors.reset}`);
            }
            promptUser();
        });
        return;
    } else if (cmd === 'r') {
        rl.question('Enter digit to send via RFC 2833: ', (digit) => {
            if (digit.match(/^[0-9*#]$/)) {
                sendRFC2833(digit);
            } else {
                console.log(`${colors.red}Invalid digit${colors.reset}`);
            }
            promptUser();
        });
        return;
    } else if (cmd === 'i') {
        rl.question('Enter digit to send via Internal API: ', (digit) => {
            if (digit.match(/^[0-9*#]$/)) {
                sendInternalAPI(digit);
            } else {
                console.log(`${colors.red}Invalid digit${colors.reset}`);
            }
            promptUser();
        });
        return;
    } else if (cmd === 'h') {
        rl.question('Enter digit to send via HTTP API: ', (digit) => {
            if (digit.match(/^[0-9*#]$/)) {
                sendHTTPAPI(digit);
            } else {
                console.log(`${colors.red}Invalid digit${colors.reset}`);
            }
            promptUser();
        });
        return;
    } else if (cmd === 't') {
        sendTestSequence();
    } else if (cmd.match(/^[0-9*#]$/)) {
        sendAllMethods(cmd);
    } else {
        console.log(`${colors.red}Unknown command${colors.reset}`);
        showMenu();
    }
    
    promptUser();
}

/**
 * Prompt user
 */
function promptUser() {
    rl.question(`${colors.bright}> ${colors.reset}`, processCommand);
}

// Start
showMenu();
console.log(`${colors.dim}Note: Make sure the server is running${colors.reset}`);
console.log(`${colors.dim}Monitor with: ./dtmf-monitor-realtime.js${colors.reset}`);
console.log('');
promptUser();

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('');
    console.log(`${colors.dim}Goodbye!${colors.reset}`);
    process.exit(0);
});