#!/usr/bin/env node

/**
 * Real-time DTMF Monitor
 * Shows all DTMF activity across the system in real-time
 */

const dgram = require('dgram');
const { spawn } = require('child_process');
const chalk = require('chalk');

// Terminal color support fallback
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
};

// Clear screen and setup
console.clear();
console.log(`${colors.bright}${colors.cyan}🎯 DTMF Real-Time Monitor${colors.reset}`);
console.log(`${colors.dim}${'='.repeat(60)}${colors.reset}`);
console.log('');

// Statistics
const stats = {
    sipInfo: 0,
    rfc2833: 0,
    dialplan: 0,
    total: 0,
    startTime: Date.now()
};

// Active monitors
const monitors = [];

// Format timestamp
function timestamp() {
    return new Date().toLocaleTimeString();
}

// Update display
function updateDisplay() {
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const minutes = Math.floor(uptime / 60);
    const seconds = uptime % 60;
    
    process.stdout.write('\r');
    process.stdout.write(
        `⏱️  ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} | ` +
        `📊 Total: ${colors.bright}${stats.total}${colors.reset} | ` +
        `SIP: ${colors.yellow}${stats.sipInfo}${colors.reset} | ` +
        `RFC: ${colors.green}${stats.rfc2833}${colors.reset} | ` +
        `Dialplan: ${colors.cyan}${stats.dialplan}${colors.reset}`
    );
}

// Display DTMF detection
function showDTMF(digit, source, details = '') {
    console.log('');
    console.log(
        `${colors.bright}${colors.green}✅ DTMF DETECTED!${colors.reset} ` +
        `[${timestamp()}] ` +
        `${colors.bright}${colors.yellow}Digit: ${digit}${colors.reset} ` +
        `${colors.blue}(${source})${colors.reset} ${details}`
    );
    stats.total++;
    updateDisplay();
}

// 1. Monitor SIP messages
function monitorSIP() {
    const ports = [5060, 5061, 5062];
    
    ports.forEach(port => {
        try {
            const socket = dgram.createSocket('udp4');
            
            socket.on('message', (msg, rinfo) => {
                const message = msg.toString();
                
                // Check for INFO requests
                if (message.includes('INFO ') && 
                   (message.includes('Signal=') || message.includes('application/dtmf'))) {
                    
                    const match = message.match(/Signal=(\d+)/i);
                    if (match) {
                        stats.sipInfo++;
                        showDTMF(match[1], 'SIP INFO', `port ${port}`);
                    }
                }
            });
            
            socket.bind(port, () => {
                console.log(`${colors.dim}📡 Monitoring SIP port ${port}${colors.reset}`);
            });
            
            socket.on('error', () => {
                // Port in use
            });
            
            monitors.push(socket);
        } catch (e) {
            // Skip
        }
    });
}

// 2. Monitor RTP for RFC 2833
function monitorRTP() {
    const rtpPorts = [];
    for (let i = 10000; i <= 10020; i += 2) {
        rtpPorts.push(i);
    }
    
    rtpPorts.forEach(port => {
        try {
            const socket = dgram.createSocket('udp4');
            
            socket.on('message', (msg, rinfo) => {
                if (msg.length < 12) return;
                
                const payloadType = msg[1] & 0x7F;
                
                // Check for telephone-event
                if ((payloadType >= 96 && payloadType <= 127) || payloadType === 101) {
                    const payload = msg.slice(12);
                    
                    if (payload.length >= 4) {
                        const event = payload[0];
                        const endBit = (payload[1] & 0x80) !== 0;
                        
                        if (event <= 15 && endBit) {
                            const digit = event <= 9 ? event.toString() :
                                         event === 10 ? '*' :
                                         event === 11 ? '#' :
                                         String.fromCharCode(65 + event - 12);
                            
                            stats.rfc2833++;
                            showDTMF(digit, 'RFC 2833', `RTP port ${port}`);
                        }
                    }
                }
            });
            
            socket.bind(port, () => {
                // Silent bind
            });
            
            socket.on('error', () => {
                // Port in use
            });
            
            monitors.push(socket);
        } catch (e) {
            // Skip
        }
    });
    
    console.log(`${colors.dim}🔊 Monitoring ${rtpPorts.length} RTP ports${colors.reset}`);
}

// 3. Monitor server log
function monitorLog() {
    try {
        const tail = spawn('tail', ['-f', '/home/user/server.log']);
        
        tail.stdout.on('data', (data) => {
            const log = data.toString();
            
            // Check for DTMF patterns
            if (log.includes('DTMF aniqlandi') || 
                log.includes('broadcast-confirmed') ||
                log.includes('DTMF detected')) {
                
                // Extract digit
                const digitMatch = log.match(/digit[:\s]+(\d)/i) || 
                                  log.match(/DTMF.*?(\d)/);
                
                if (digitMatch) {
                    stats.dialplan++;
                    showDTMF(digitMatch[1], 'Log/Event', 'server.log');
                }
            }
        });
        
        console.log(`${colors.dim}📄 Monitoring server.log${colors.reset}`);
    } catch (e) {
        console.log(`${colors.dim}⚠️  Cannot monitor server.log${colors.reset}`);
    }
}

// 4. Monitor internal API
function monitorInternalAPI() {
    const net = require('net');
    
    try {
        const server = net.createServer((socket) => {
            socket.on('data', (data) => {
                try {
                    const message = data.toString();
                    if (message.includes('DTMF')) {
                        const parts = message.split(' ');
                        if (parts.length > 1) {
                            stats.dialplan++;
                            showDTMF(parts[1], 'Internal API', 'TCP 8445');
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            });
        });
        
        server.listen(8445, () => {
            console.log(`${colors.dim}🔌 Monitoring internal API port 8445${colors.reset}`);
        });
        
        server.on('error', () => {
            // Port in use
        });
    } catch (e) {
        // Skip
    }
}

// Start all monitors
console.log(`${colors.bright}Starting monitors...${colors.reset}`);
console.log('');

monitorSIP();
monitorRTP();
monitorLog();
monitorInternalAPI();

console.log('');
console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
console.log(`${colors.bright}Waiting for DTMF signals...${colors.reset}`);
console.log('');

// Update display every second
setInterval(updateDisplay, 1000);
updateDisplay();

// Handle exit
process.on('SIGINT', () => {
    console.log('');
    console.log('');
    console.log(`${colors.dim}Closing monitors...${colors.reset}`);
    
    monitors.forEach(socket => {
        try {
            socket.close();
        } catch (e) {
            // Ignore
        }
    });
    
    setTimeout(() => {
        process.exit(0);
    }, 100);
});