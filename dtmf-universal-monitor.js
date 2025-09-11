#!/usr/bin/env node

/**
 * Universal DTMF Monitor
 * Monitors all DTMF detection methods and shows real-time status
 */

const dgram = require('dgram');
const net = require('net');
const https = require('https');
const { spawn } = require('child_process');
const WebSocket = require('ws');

// Terminal colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m'
};

// Detection methods status
const methods = {
    sipInfo: { count: 0, lastSeen: null, working: false },
    rfc2833: { count: 0, lastSeen: null, working: false },
    birtp: { count: 0, lastSeen: null, working: false },
    agi: { count: 0, lastSeen: null, working: false },
    internal: { count: 0, lastSeen: null, working: false },
    alternative: { count: 0, lastSeen: null, working: false },
    fallback: { count: 0, lastSeen: null, working: false }
};

// Active calls tracking
const activeCalls = new Map();
const dtmfHistory = [];

// Clear screen
console.clear();
console.log(`${colors.bright}${colors.cyan}🎯 Universal DTMF Monitor${colors.reset}`);
console.log(`${colors.dim}${'='.repeat(80)}${colors.reset}`);
console.log('');

// Display header
function displayHeader() {
    process.stdout.write('\x1B[4;0H'); // Move to line 4
    console.log(`${colors.bright}Detection Methods Status:${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    
    // Method status table
    const methodNames = {
        sipInfo: 'SIP INFO',
        rfc2833: 'RFC 2833',
        birtp: 'Bi-RTP',
        agi: 'AGI Script',
        internal: 'Internal API',
        alternative: 'Alternative',
        fallback: 'Fallback'
    };
    
    let row1 = '';
    let row2 = '';
    let row3 = '';
    
    Object.entries(methods).forEach(([key, data]) => {
        const name = methodNames[key].padEnd(12);
        const status = data.working ? 
            `${colors.bgGreen}${colors.white} ✓ ${colors.reset}` : 
            `${colors.bgRed}${colors.white} ✗ ${colors.reset}`;
        const count = String(data.count).padStart(4);
        const age = data.lastSeen ? 
            `${Math.floor((Date.now() - data.lastSeen) / 1000)}s` : 
            'Never';
        
        row1 += `${name} `;
        row2 += `${status}      `.padEnd(13);
        row3 += `${colors.dim}${count} (${age.padEnd(6)})${colors.reset} `;
    });
    
    console.log(row1);
    console.log(row2);
    console.log(row3);
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
}

// Display active calls
function displayActiveCalls() {
    process.stdout.write('\x1B[12;0H'); // Move to line 12
    console.log(`${colors.bright}Active Calls:${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    
    if (activeCalls.size === 0) {
        console.log(`${colors.dim}No active calls${colors.reset}`);
    } else {
        let displayed = 0;
        activeCalls.forEach((call, id) => {
            if (displayed < 5) { // Show max 5 calls
                const duration = Math.floor((Date.now() - call.startTime) / 1000);
                const dtmfStatus = call.dtmfReceived ? 
                    `${colors.green}DTMF: ${call.lastDTMF}${colors.reset}` : 
                    `${colors.yellow}Waiting...${colors.reset}`;
                
                console.log(`${call.phoneNumber} - ${duration}s - ${dtmfStatus}`);
                displayed++;
            }
        });
        
        if (activeCalls.size > 5) {
            console.log(`${colors.dim}... and ${activeCalls.size - 5} more${colors.reset}`);
        }
    }
}

// Display DTMF history
function displayHistory() {
    process.stdout.write('\x1B[20;0H'); // Move to line 20
    console.log(`${colors.bright}Recent DTMF Detections:${colors.reset}`);
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    
    const recent = dtmfHistory.slice(-5).reverse();
    recent.forEach(event => {
        const time = new Date(event.time).toLocaleTimeString();
        const methodColor = event.confirmed ? colors.green : colors.yellow;
        console.log(
            `${time} - ${colors.bright}${event.digit}${colors.reset} - ` +
            `${event.phone} - ${methodColor}${event.method}${colors.reset}`
        );
    });
}

// Update method status
function updateMethodStatus(method, digit, phone) {
    if (methods[method]) {
        methods[method].count++;
        methods[method].lastSeen = Date.now();
        methods[method].working = true;
        
        // Add to history
        dtmfHistory.push({
            time: Date.now(),
            method,
            digit,
            phone,
            confirmed: digit === '1'
        });
        
        // Update call status
        activeCalls.forEach(call => {
            if (call.phoneNumber === phone) {
                call.dtmfReceived = true;
                call.lastDTMF = digit;
            }
        });
        
        // Refresh display
        refreshDisplay();
    }
}

// Refresh display
function refreshDisplay() {
    displayHeader();
    displayActiveCalls();
    displayHistory();
    displayStats();
}

// Display statistics
function displayStats() {
    process.stdout.write('\x1B[28;0H'); // Move to line 28
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
    
    const totalDTMF = Object.values(methods).reduce((sum, m) => sum + m.count, 0);
    const workingMethods = Object.values(methods).filter(m => m.working).length;
    const confirmations = dtmfHistory.filter(e => e.digit === '1').length;
    
    console.log(
        `${colors.bright}Stats:${colors.reset} ` +
        `Total DTMF: ${colors.yellow}${totalDTMF}${colors.reset} | ` +
        `Working Methods: ${colors.green}${workingMethods}/7${colors.reset} | ` +
        `Confirmations: ${colors.cyan}${confirmations}${colors.reset} | ` +
        `Active Calls: ${colors.magenta}${activeCalls.size}${colors.reset}`
    );
}

// Monitor SIP ports
function monitorSIP() {
    [5060, 5061].forEach(port => {
        const socket = dgram.createSocket('udp4');
        socket.on('message', (msg) => {
            const message = msg.toString();
            if (message.includes('INFO') && message.includes('Signal=')) {
                const match = message.match(/Signal=(\d)/);
                const phoneMatch = message.match(/sip:(\d+)@/);
                if (match && phoneMatch) {
                    updateMethodStatus('sipInfo', match[1], phoneMatch[1]);
                }
            }
        });
        
        socket.bind(port, () => {
            console.log(`${colors.dim}Monitoring SIP port ${port}${colors.reset}`);
        }).on('error', () => {});
    });
}

// Monitor RTP ports
function monitorRTP() {
    for (let port = 10000; port <= 10010; port += 2) {
        const socket = dgram.createSocket('udp4');
        socket.on('message', (msg) => {
            if (msg.length >= 12) {
                const payloadType = msg[1] & 0x7F;
                if (payloadType === 101 || (payloadType >= 96 && payloadType <= 127)) {
                    const payload = msg.slice(12);
                    if (payload.length >= 4) {
                        const event = payload[0];
                        const endBit = (payload[1] & 0x80) !== 0;
                        if (event <= 15 && endBit) {
                            const digit = event <= 9 ? event.toString() : 
                                        event === 10 ? '*' : 
                                        event === 11 ? '#' : 'A';
                            updateMethodStatus('rfc2833', digit, 'Unknown');
                        }
                    }
                }
            }
        });
        
        socket.bind(port).on('error', () => {});
    }
}

// Monitor internal API
function monitorInternalAPI() {
    const server = net.createServer((socket) => {
        socket.on('data', (data) => {
            const message = data.toString();
            if (message.includes('DTMF')) {
                const parts = message.split(' ');
                if (parts.length >= 3) {
                    updateMethodStatus('internal', parts[1], parts[2]);
                }
            }
        });
    });
    
    server.listen(8446, () => {
        console.log(`${colors.dim}Monitoring internal API on port 8446${colors.reset}`);
    }).on('error', () => {});
}

// Monitor server log
function monitorServerLog() {
    const tail = spawn('tail', ['-f', '/home/user/server.log']);
    
    tail.stdout.on('data', (data) => {
        const log = data.toString();
        
        // BiRTP detection
        if (log.includes('[BiRTP]') && log.includes('DTMF detected')) {
            const digitMatch = log.match(/DTMF detected: '(\d)'/);
            if (digitMatch) {
                updateMethodStatus('birtp', digitMatch[1], 'BiRTP');
            }
        }
        
        // Alternative detection
        if (log.includes('[ALT-DTMF]') && log.includes('detected')) {
            const digitMatch = log.match(/DTMF '(\d)'/);
            if (digitMatch) {
                updateMethodStatus('alternative', digitMatch[1], 'Alt');
            }
        }
        
        // Fallback detection
        if (log.includes('[Fallback]') && log.includes('confirmed')) {
            updateMethodStatus('fallback', '1', 'Fallback');
        }
        
        // AGI detection
        if (log.includes('[AGI-DTMF]')) {
            const digitMatch = log.match(/DTMF.*?(\d)/);
            if (digitMatch) {
                updateMethodStatus('agi', digitMatch[1], 'AGI');
            }
        }
        
        // Call events
        if (log.includes('Making call to')) {
            const phoneMatch = log.match(/to (\d+)/);
            if (phoneMatch) {
                activeCalls.set(phoneMatch[1], {
                    phoneNumber: phoneMatch[1],
                    startTime: Date.now(),
                    dtmfReceived: false,
                    lastDTMF: null
                });
                refreshDisplay();
            }
        }
        
        if (log.includes('Call ended') || log.includes('Call failed')) {
            const phoneMatch = log.match(/(\d{9,})/);
            if (phoneMatch) {
                activeCalls.delete(phoneMatch[1]);
                refreshDisplay();
            }
        }
    });
}

// Monitor WebSocket
function monitorWebSocket() {
    try {
        const ws = new WebSocket('wss://localhost:8444/ws', {
            rejectUnauthorized: false
        });
        
        ws.on('open', () => {
            console.log(`${colors.dim}WebSocket connected${colors.reset}`);
        });
        
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'dtmf-detected' || msg.type === 'broadcast-confirmed') {
                    updateMethodStatus('websocket', msg.digit || '1', msg.phoneNumber || 'WS');
                }
            } catch (e) {}
        });
        
        ws.on('error', () => {});
        ws.on('close', () => {
            setTimeout(monitorWebSocket, 5000);
        });
    } catch (e) {}
}

// Start all monitors
console.log(`${colors.bright}Starting monitors...${colors.reset}`);
console.log('');

monitorSIP();
monitorRTP();
monitorInternalAPI();
monitorServerLog();
monitorWebSocket();

// Initial display
setTimeout(() => {
    console.clear();
    console.log(`${colors.bright}${colors.cyan}🎯 Universal DTMF Monitor${colors.reset}`);
    console.log(`${colors.dim}${'='.repeat(80)}${colors.reset}`);
    refreshDisplay();
}, 1000);

// Refresh display every second
setInterval(() => {
    // Mark methods as not working if no activity for 30 seconds
    Object.values(methods).forEach(method => {
        if (method.lastSeen && Date.now() - method.lastSeen > 30000) {
            method.working = false;
        }
    });
    refreshDisplay();
}, 1000);

// Handle exit
process.on('SIGINT', () => {
    console.log('\n\n');
    console.log(`${colors.dim}Shutting down monitors...${colors.reset}`);
    process.exit(0);
});