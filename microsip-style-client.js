#!/usr/bin/env node

const dgram = require('dgram');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * MicroSIP-style SIP Client
 * Simple, reliable SIP client with DTMF detection
 */
class MicroSIPClient extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = {
            server: config.server || '10.105.0.3',
            port: config.port || 5060,
            username: config.username || '5530',
            password: config.password || '5530',
            displayName: config.displayName || 'MicroSIP User',
            realm: config.realm || 'asterisk',
            transport: 'UDP'
        };
        
        // Network
        this.socket = null;
        this.localPort = 5060 + Math.floor(Math.random() * 1000);
        this.localIP = this.getLocalIP();
        
        // SIP state
        this.registered = false;
        this.registerExpires = 3600;
        this.registerTimer = null;
        
        // Call state
        this.currentCall = null;
        this.rtpPort = this.localPort + 2;
        this.rtpSocket = null;
        
        // Transaction tracking
        this.transactions = new Map();
        this.dialogs = new Map();
        
        console.log(`[MicroSIP] Client initialized - ${this.config.username}@${this.config.server}`);
    }
    
    getLocalIP() {
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
    
    // Start the client
    async start() {
        return new Promise((resolve, reject) => {
            this.socket = dgram.createSocket('udp4');
            
            this.socket.on('error', (err) => {
                console.error('[MicroSIP] Socket error:', err);
                reject(err);
            });
            
            this.socket.on('message', (msg, rinfo) => {
                this.handleMessage(msg.toString(), rinfo);
            });
            
            this.socket.bind(this.localPort, '0.0.0.0', () => {
                console.log(`[MicroSIP] Listening on ${this.localIP}:${this.localPort}`);
                resolve();
            });
        });
    }
    
    // Register with server (MicroSIP style)
    register() {
        const transaction = {
            method: 'REGISTER',
            callId: this.generateCallId(),
            cseq: 1,
            fromTag: this.generateTag(),
            branch: this.generateBranch(),
            uri: `sip:${this.config.server}`,
            auth: null
        };
        
        this.sendRegister(transaction);
        
        // Store transaction
        this.transactions.set(transaction.callId, transaction);
    }
    
    sendRegister(transaction) {
        const contact = `<sip:${this.config.username}@${this.localIP}:${this.localPort};transport=udp>`;
        const from = `"${this.config.displayName}" <sip:${this.config.username}@${this.config.server}>;tag=${transaction.fromTag}`;
        const to = `<sip:${this.config.username}@${this.config.server}>`;
        
        const headers = [
            `REGISTER ${transaction.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${transaction.branch};rport`,
            `From: ${from}`,
            `To: ${to}`,
            `Call-ID: ${transaction.callId}`,
            `CSeq: ${transaction.cseq} REGISTER`,
            `Contact: ${contact}`,
            `Expires: ${this.registerExpires}`,
            `Max-Forwards: 70`,
            `User-Agent: MicroSIP/3.0`,
            `Allow: INVITE, ACK, CANCEL, BYE, OPTIONS, INFO, MESSAGE, UPDATE, REFER, NOTIFY`
        ];
        
        if (transaction.auth) {
            headers.push(`Authorization: ${transaction.auth}`);
        }
        
        headers.push('Content-Length: 0', '', '');
        
        this.send(headers.join('\r\n'));
    }
    
    // Make a call (MicroSIP style)
    makeCall(number) {
        if (!this.registered) {
            console.error('[MicroSIP] Not registered!');
            return;
        }
        
        console.log(`[MicroSIP] Calling ${number}...`);
        
        this.currentCall = {
            method: 'INVITE',
            callId: this.generateCallId(),
            cseq: 1,
            fromTag: this.generateTag(),
            toTag: null,
            branch: this.generateBranch(),
            uri: `sip:${number}@${this.config.server}`,
            localSDP: null,
            remoteSDP: null,
            state: 'calling',
            number: number
        };
        
        // Create RTP socket for audio
        this.createRTPSocket();
        
        // Generate SDP
        this.currentCall.localSDP = this.generateSDP();
        
        this.sendInvite();
    }
    
    sendInvite() {
        const call = this.currentCall;
        const from = `"${this.config.displayName}" <sip:${this.config.username}@${this.config.server}>;tag=${call.fromTag}`;
        const to = `<${call.uri}>`;
        const contact = `<sip:${this.config.username}@${this.localIP}:${this.localPort}>`;
        
        const headers = [
            `INVITE ${call.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${call.branch};rport`,
            `From: ${from}`,
            `To: ${to}`,
            `Call-ID: ${call.callId}`,
            `CSeq: ${call.cseq} INVITE`,
            `Contact: ${contact}`,
            `Content-Type: application/sdp`,
            `User-Agent: MicroSIP/3.0`,
            `Max-Forwards: 70`,
            `Allow: INVITE, ACK, CANCEL, BYE, OPTIONS, INFO, MESSAGE, UPDATE`,
            `Supported: replaces, timer`
        ];
        
        if (call.auth) {
            headers.push(`Authorization: ${call.auth}`);
        }
        
        headers.push(`Content-Length: ${call.localSDP.length}`, '', call.localSDP);
        
        this.send(headers.join('\r\n'));
    }
    
    // Generate SDP (MicroSIP compatible)
    generateSDP() {
        const sessionId = Date.now();
        const sdp = [
            'v=0',
            `o=- ${sessionId} ${sessionId} IN IP4 ${this.localIP}`,
            's=MicroSIP',
            `c=IN IP4 ${this.localIP}`,
            't=0 0',
            `m=audio ${this.rtpPort} RTP/AVP 0 8 3 101`,
            'a=rtpmap:0 PCMU/8000',
            'a=rtpmap:8 PCMA/8000', 
            'a=rtpmap:3 GSM/8000',
            'a=rtpmap:101 telephone-event/8000',
            'a=fmtp:101 0-16',
            'a=sendrecv',
            'a=rtcp:' + (this.rtpPort + 1)
        ];
        
        return sdp.join('\r\n');
    }
    
    // Create RTP socket for audio
    createRTPSocket() {
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        this.rtpSocket = dgram.createSocket('udp4');
        
        this.rtpSocket.on('message', (msg) => {
            this.handleRTPPacket(msg);
        });
        
        this.rtpSocket.bind(this.rtpPort, () => {
            console.log(`[MicroSIP] RTP socket ready on port ${this.rtpPort}`);
        });
    }
    
    // Handle incoming RTP packets
    handleRTPPacket(packet) {
        if (packet.length < 12) return;
        
        const payloadType = packet[1] & 0x7f;
        
        // Check for DTMF (RFC 2833)
        if (payloadType === 101) {
            const dtmfData = packet.slice(12);
            if (dtmfData.length >= 4) {
                const event = dtmfData[0];
                const endBit = (dtmfData[1] & 0x80) !== 0;
                
                if (endBit) {
                    const digit = this.dtmfEventToDigit(event);
                    console.log(`[MicroSIP] DTMF detected: ${digit}`);
                    this.emit('dtmf', digit);
                    
                    // Auto-hangup on digit 1
                    if (digit === '1' && this.currentCall) {
                        console.log('[MicroSIP] Digit 1 detected - hanging up...');
                        setTimeout(() => this.hangup(), 500);
                    }
                }
            }
        }
    }
    
    dtmfEventToDigit(event) {
        if (event <= 9) return event.toString();
        if (event === 10) return '*';
        if (event === 11) return '#';
        return '?';
    }
    
    // Handle incoming SIP messages
    handleMessage(msg, rinfo) {
        const lines = msg.split('\r\n');
        const firstLine = lines[0];
        
        if (firstLine.startsWith('SIP/2.0')) {
            this.handleResponse(msg, lines);
        } else {
            this.handleRequest(msg, lines);
        }
    }
    
    handleResponse(msg, lines) {
        const statusLine = lines[0];
        const [, statusCode, ...statusText] = statusLine.split(' ');
        const headers = this.parseHeaders(lines);
        
        console.log(`[MicroSIP] <- ${statusCode} ${statusText.join(' ')}`);
        
        // Find matching transaction
        const callId = headers['call-id'];
        const transaction = this.transactions.get(callId) || this.currentCall;
        
        if (!transaction) {
            console.log('[MicroSIP] No matching transaction');
            return;
        }
        
        switch (statusCode) {
            case '100':
                // Trying - ignore
                break;
                
            case '180':
                console.log('[MicroSIP] Ringing...');
                this.emit('ringing');
                break;
                
            case '200':
                if (transaction.method === 'REGISTER') {
                    this.handleRegisterOK(headers);
                } else if (transaction.method === 'INVITE') {
                    this.handleInviteOK(msg, headers);
                }
                break;
                
            case '401':
            case '407':
                this.handleAuthRequired(msg, headers, transaction);
                break;
                
            case '403':
                console.error('[MicroSIP] Forbidden - check credentials');
                break;
                
            case '486':
                console.log('[MicroSIP] Busy');
                this.emit('busy');
                break;
        }
    }
    
    handleRequest(msg, lines) {
        const requestLine = lines[0];
        const [method, uri] = requestLine.split(' ');
        const headers = this.parseHeaders(lines);
        
        console.log(`[MicroSIP] <- ${method} request`);
        
        switch (method) {
            case 'OPTIONS':
                this.sendOptionsResponse(headers);
                break;
                
            case 'INFO':
                this.handleInfo(msg, headers);
                break;
                
            case 'BYE':
                this.handleBye(headers);
                break;
        }
    }
    
    // Handle successful registration
    handleRegisterOK(headers) {
        this.registered = true;
        console.log('[MicroSIP] Registered successfully!');
        this.emit('registered');
        
        // Schedule re-registration
        const expires = this.parseExpires(headers);
        const reregisterTime = (expires - 60) * 1000; // Re-register 1 minute before expiry
        
        if (this.registerTimer) {
            clearTimeout(this.registerTimer);
        }
        
        this.registerTimer = setTimeout(() => {
            console.log('[MicroSIP] Re-registering...');
            this.register();
        }, reregisterTime);
    }
    
    // Handle successful call
    handleInviteOK(msg, headers) {
        console.log('[MicroSIP] Call connected!');
        
        // Extract remote SDP
        const sdpStart = msg.indexOf('\r\n\r\n') + 4;
        this.currentCall.remoteSDP = msg.substring(sdpStart);
        this.currentCall.toTag = this.extractTag(headers['to']);
        this.currentCall.state = 'connected';
        
        // Send ACK
        this.sendAck();
        
        this.emit('connected');
    }
    
    // Send ACK
    sendAck() {
        const call = this.currentCall;
        const headers = [
            `ACK ${call.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${this.generateBranch()};rport`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${call.fromTag}`,
            `To: <${call.uri}>;tag=${call.toTag}`,
            `Call-ID: ${call.callId}`,
            `CSeq: ${call.cseq} ACK`,
            `Max-Forwards: 70`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
    }
    
    // Handle authentication
    handleAuthRequired(msg, headers, transaction) {
        const authHeader = headers['www-authenticate'] || headers['proxy-authenticate'];
        if (!authHeader) return;
        
        console.log('[MicroSIP] Authentication required');
        
        const challenge = this.parseAuthChallenge(authHeader);
        const auth = this.generateAuth(transaction.method, transaction.uri, challenge);
        
        // Update transaction
        transaction.auth = auth;
        transaction.cseq++;
        transaction.branch = this.generateBranch();
        
        // Resend request
        if (transaction.method === 'REGISTER') {
            this.sendRegister(transaction);
        } else if (transaction.method === 'INVITE') {
            this.currentCall = transaction;
            this.sendInvite();
        }
    }
    
    // Generate authentication response
    generateAuth(method, uri, challenge) {
        const username = this.config.username;
        const password = this.config.password;
        const realm = challenge.realm;
        const nonce = challenge.nonce;
        
        // HA1 = MD5(username:realm:password)
        const ha1 = crypto.createHash('md5')
            .update(`${username}:${realm}:${password}`)
            .digest('hex');
            
        // HA2 = MD5(method:uri)
        const ha2 = crypto.createHash('md5')
            .update(`${method}:${uri}`)
            .digest('hex');
            
        let response;
        let authStr = `Digest username="${username}",realm="${realm}",nonce="${nonce}",uri="${uri}"`;
        
        if (challenge.qop) {
            const nc = '00000001';
            const cnonce = crypto.randomBytes(16).toString('hex');
            
            // Response = MD5(HA1:nonce:nc:cnonce:qop:HA2)
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${nc}:${cnonce}:${challenge.qop}:${ha2}`)
                .digest('hex');
                
            authStr += `,nc=${nc},cnonce="${cnonce}",qop=${challenge.qop}`;
        } else {
            // Response = MD5(HA1:nonce:HA2)
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${ha2}`)
                .digest('hex');
        }
        
        authStr += `,response="${response}",algorithm=MD5`;
        
        if (challenge.opaque) {
            authStr += `,opaque="${challenge.opaque}"`;
        }
        
        return authStr;
    }
    
    // Handle INFO (for DTMF)
    handleInfo(msg, headers) {
        // Send 200 OK
        this.sendResponse('200 OK', headers);
        
        // Check for DTMF
        const contentType = headers['content-type'] || '';
        const bodyStart = msg.indexOf('\r\n\r\n') + 4;
        const body = msg.substring(bodyStart);
        
        if (contentType.includes('dtmf')) {
            let digit = null;
            
            if (contentType.includes('dtmf-relay')) {
                const match = body.match(/Signal=(\d)/);
                if (match) digit = match[1];
            } else {
                digit = body.trim().charAt(0);
            }
            
            if (digit) {
                console.log(`[MicroSIP] DTMF via INFO: ${digit}`);
                this.emit('dtmf', digit);
                
                if (digit === '1' && this.currentCall) {
                    console.log('[MicroSIP] Digit 1 detected - hanging up...');
                    setTimeout(() => this.hangup(), 500);
                }
            }
        }
    }
    
    // Hangup call
    hangup() {
        if (!this.currentCall || this.currentCall.state === 'ended') return;
        
        console.log('[MicroSIP] Hanging up...');
        
        const call = this.currentCall;
        call.state = 'ended';
        
        const headers = [
            `BYE ${call.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${this.generateBranch()};rport`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${call.fromTag}`,
            `To: <${call.uri}>;tag=${call.toTag || ''}`,
            `Call-ID: ${call.callId}`,
            `CSeq: ${++call.cseq} BYE`,
            `Max-Forwards: 70`,
            `User-Agent: MicroSIP/3.0`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
        this.emit('ended');
    }
    
    // Handle BYE request
    handleBye(headers) {
        console.log('[MicroSIP] Remote hangup');
        this.sendResponse('200 OK', headers);
        
        if (this.currentCall) {
            this.currentCall.state = 'ended';
            this.currentCall = null;
        }
        
        this.emit('ended');
    }
    
    // Send response
    sendResponse(status, requestHeaders) {
        const headers = [
            `SIP/2.0 ${status}`,
            `Via: ${requestHeaders['via']}`,
            `From: ${requestHeaders['from']}`,
            `To: ${requestHeaders['to']}`,
            `Call-ID: ${requestHeaders['call-id']}`,
            `CSeq: ${requestHeaders['cseq']}`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
    }
    
    // Send OPTIONS response
    sendOptionsResponse(headers) {
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers['via']}`,
            `From: ${headers['from']}`,
            `To: ${headers['to']}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers['cseq']}`,
            'Allow: INVITE, ACK, CANCEL, BYE, OPTIONS, INFO, MESSAGE, UPDATE',
            'Accept: application/sdp, application/dtmf-relay, application/dtmf',
            'User-Agent: MicroSIP/3.0',
            'Content-Length: 0',
            '',
            ''
        ];
        
        this.send(response.join('\r\n'));
    }
    
    // Utility methods
    parseHeaders(lines) {
        const headers = {};
        for (let i = 1; i < lines.length && lines[i] !== ''; i++) {
            const [name, ...value] = lines[i].split(':');
            if (name) {
                headers[name.toLowerCase().trim()] = value.join(':').trim();
            }
        }
        return headers;
    }
    
    parseAuthChallenge(header) {
        const challenge = {};
        const params = header.substring(7).split(',');
        
        params.forEach(param => {
            const [key, value] = param.trim().split('=');
            challenge[key] = value ? value.replace(/"/g, '') : '';
        });
        
        return challenge;
    }
    
    parseExpires(headers) {
        const contact = headers['contact'] || '';
        const match = contact.match(/expires=(\d+)/);
        if (match) return parseInt(match[1]);
        
        const expires = headers['expires'];
        if (expires) return parseInt(expires);
        
        return this.registerExpires;
    }
    
    extractTag(header) {
        const match = header.match(/tag=([^;]+)/);
        return match ? match[1] : null;
    }
    
    generateTag() {
        return crypto.randomBytes(4).toString('hex');
    }
    
    generateCallId() {
        return crypto.randomBytes(16).toString('hex') + '@' + this.localIP;
    }
    
    generateBranch() {
        return 'z9hG4bK' + crypto.randomBytes(8).toString('hex');
    }
    
    // Send SIP message
    send(message) {
        const buffer = Buffer.from(message);
        this.socket.send(buffer, 0, buffer.length, this.config.port, this.config.server, (err) => {
            if (err) {
                console.error('[MicroSIP] Send error:', err);
            }
        });
    }
    
    // Stop client
    stop() {
        if (this.registerTimer) {
            clearTimeout(this.registerTimer);
        }
        
        if (this.currentCall && this.currentCall.state !== 'ended') {
            this.hangup();
        }
        
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        if (this.socket) {
            this.socket.close();
        }
        
        console.log('[MicroSIP] Client stopped');
    }
}

// Test the client
async function test() {
    const client = new MicroSIPClient({
        server: '10.105.0.3',
        port: 5060,
        username: '5530',
        password: '5530',
        displayName: 'Test User'
    });
    
    console.log('=== MicroSIP Style Client Test ===\n');
    
    try {
        // Start client
        await client.start();
        
        // Event handlers
        client.on('registered', () => {
            console.log('\n[TEST] Registered! Making call in 2 seconds...\n');
            setTimeout(() => {
                client.makeCall('990823112');
            }, 2000);
        });
        
        client.on('ringing', () => {
            console.log('[TEST] Phone is ringing...');
        });
        
        client.on('connected', () => {
            console.log('[TEST] Call connected! Waiting for DTMF digit 1...');
        });
        
        client.on('dtmf', (digit) => {
            console.log(`[TEST] DTMF received: ${digit}`);
        });
        
        client.on('ended', () => {
            console.log('[TEST] Call ended');
            setTimeout(() => {
                client.stop();
                process.exit(0);
            }, 1000);
        });
        
        // Register
        client.register();
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n[TEST] Shutting down...');
            client.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('[TEST] Error:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    test();
}

module.exports = MicroSIPClient;