#!/usr/bin/env node

const dgram = require('dgram');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const os = require('os');

class FinalSIPClient extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = {
            server: config.server || '10.105.0.3',
            port: config.port || 5060,
            username: config.username || '5530',
            password: config.password || '5530',
            realm: 'asterisk',
            targetNumber: config.targetNumber || '990823112'
        };
        
        this.socket = null;
        this.localPort = 20000 + Math.floor(Math.random() * 40000);
        this.localIP = this.getLocalIP();
        
        this.registered = false;
        this.currentCall = null;
        this.rtpPort = this.localPort + 2;
        this.rtpSocket = null;
        
        // Track auth attempts to prevent loops
        this.authAttempts = new Map();
    }
    
    getLocalIP() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }
    
    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }
    
    async start() {
        return new Promise((resolve, reject) => {
            this.socket = dgram.createSocket('udp4');
            
            this.socket.on('error', (err) => {
                console.error('[ERROR]', err);
                reject(err);
            });
            
            this.socket.on('message', (msg, rinfo) => {
                this.handleMessage(msg.toString(), rinfo);
            });
            
            this.socket.bind(this.localPort, () => {
                console.log(`[SIP] Listening on ${this.localIP}:${this.localPort}`);
                resolve();
            });
        });
    }
    
    register() {
        const callId = this.generateId() + '@' + this.localIP;
        const fromTag = this.generateId();
        const branch = 'z9hG4bK' + this.generateId();
        const cseq = 1;
        
        const transaction = {
            method: 'REGISTER',
            callId,
            fromTag,
            branch,
            cseq,
            uri: `sip:${this.config.server}`
        };
        
        // Clear auth attempts for new registration
        this.authAttempts.set(callId, 0);
        
        this.sendRegister(transaction);
    }
    
    sendRegister(transaction, auth = null) {
        const headers = [
            `REGISTER ${transaction.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${transaction.branch};rport`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${transaction.fromTag}`,
            `To: <sip:${this.config.username}@${this.config.server}>`,
            `Call-ID: ${transaction.callId}`,
            `CSeq: ${transaction.cseq} REGISTER`,
            `Contact: <sip:${this.config.username}@${this.localIP}:${this.localPort}>`,
            `Max-Forwards: 70`,
            `User-Agent: FinalSIPClient/1.0`,
            `Expires: 3600`
        ];
        
        if (auth) {
            headers.push(`Authorization: ${auth}`);
        }
        
        headers.push('Content-Length: 0', '', '');
        
        const message = headers.join('\r\n');
        console.log('\n[SEND] REGISTER');
        if (auth) {
            console.log('[AUTH] With authorization');
        }
        
        this.send(message);
        
        // Store transaction for response matching
        this.currentTransaction = transaction;
    }
    
    handleMessage(msg, rinfo) {
        const lines = msg.split('\r\n');
        const firstLine = lines[0];
        
        if (!firstLine.startsWith('SIP/2.0')) {
            // Handle requests
            this.handleRequest(msg, lines);
            return;
        }
        
        // Parse response
        const [, statusCode, ...statusText] = firstLine.split(' ');
        const headers = this.parseHeaders(lines);
        
        console.log(`\n[RECV] ${statusCode} ${statusText.join(' ')}`);
        
        // Check auth attempts to prevent loops
        const callId = headers['call-id'];
        const attempts = this.authAttempts.get(callId) || 0;
        
        if (statusCode === '401' && attempts < 3) {
            this.authAttempts.set(callId, attempts + 1);
            this.handleAuthRequired(msg, headers);
        } else if (statusCode === '200') {
            const cseqHeader = headers['cseq'] || '';
            if (cseqHeader.includes('REGISTER')) {
                this.handleRegisterOK();
            } else if (cseqHeader.includes('INVITE')) {
                this.handleInviteOK(msg, headers);
            }
        } else if (statusCode === '100') {
            console.log('[INFO] Trying...');
        } else if (statusCode === '180') {
            console.log('[INFO] Ringing...');
            this.emit('ringing');
        }
    }
    
    handleAuthRequired(msg, headers) {
        const wwwAuth = headers['www-authenticate'] || headers['proxy-authenticate'];
        if (!wwwAuth) {
            console.error('[ERROR] No auth header in 401 response');
            return;
        }
        
        console.log('[AUTH] Challenge received, authenticating...');
        
        const challenge = this.parseAuthChallenge(wwwAuth);
        const auth = this.createAuth(
            this.currentTransaction.method,
            this.currentTransaction.uri,
            challenge
        );
        
        // Update transaction for retry
        this.currentTransaction.cseq++;
        this.currentTransaction.branch = 'z9hG4bK' + this.generateId();
        
        if (this.currentTransaction.method === 'REGISTER') {
            this.sendRegister(this.currentTransaction, auth);
        } else if (this.currentTransaction.method === 'INVITE') {
            this.sendInvite(this.currentTransaction, auth);
        }
    }
    
    parseAuthChallenge(header) {
        const challenge = {};
        // Remove "Digest " prefix
        const params = header.substring(7);
        
        // Match key="value" or key=value patterns
        const regex = /(\w+)=(?:"([^"]+)"|([^,\s]+))/g;
        let match;
        
        while ((match = regex.exec(params)) !== null) {
            const key = match[1];
            const value = match[2] || match[3];
            challenge[key] = value;
        }
        
        return challenge;
    }
    
    createAuth(method, uri, challenge) {
        const username = this.config.username;
        const password = this.config.password;
        const realm = challenge.realm || this.config.realm;
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
            // With qop
            const nc = '00000001';
            const cnonce = crypto.randomBytes(8).toString('hex');
            
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${nc}:${cnonce}:${challenge.qop}:${ha2}`)
                .digest('hex');
                
            authStr += `,qop=${challenge.qop},nc=${nc},cnonce="${cnonce}"`;
        } else {
            // Without qop
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${ha2}`)
                .digest('hex');
        }
        
        authStr += `,response="${response}"`;
        
        if (challenge.algorithm) {
            authStr += `,algorithm=${challenge.algorithm}`;
        }
        
        if (challenge.opaque) {
            authStr += `,opaque="${challenge.opaque}"`;
        }
        
        return authStr;
    }
    
    handleRegisterOK() {
        console.log('\n✅ REGISTRATION SUCCESSFUL!\n');
        this.registered = true;
        this.emit('registered');
        
        // Re-register after 50 minutes
        setTimeout(() => this.register(), 3000000);
    }
    
    makeCall(number) {
        if (!this.registered) {
            console.error('[ERROR] Not registered');
            return;
        }
        
        console.log(`\n[CALL] Calling ${number}...`);
        
        const callId = this.generateId() + '@' + this.localIP;
        const fromTag = this.generateId();
        const branch = 'z9hG4bK' + this.generateId();
        const cseq = 1;
        
        this.currentCall = {
            callId,
            fromTag,
            toTag: null,
            number,
            state: 'calling'
        };
        
        const transaction = {
            method: 'INVITE',
            callId,
            fromTag,
            branch,
            cseq,
            uri: `sip:${number}@${this.config.server}`
        };
        
        this.authAttempts.set(callId, 0);
        this.currentTransaction = transaction;
        
        // Start RTP socket
        this.startRTP();
        
        this.sendInvite(transaction);
    }
    
    sendInvite(transaction, auth = null) {
        const sdp = this.createSDP();
        
        const headers = [
            `INVITE ${transaction.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${transaction.branch};rport`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${transaction.fromTag}`,
            `To: <${transaction.uri}>`,
            `Call-ID: ${transaction.callId}`,
            `CSeq: ${transaction.cseq} INVITE`,
            `Contact: <sip:${this.config.username}@${this.localIP}:${this.localPort}>`,
            `Max-Forwards: 70`,
            `User-Agent: FinalSIPClient/1.0`,
            `Allow: INVITE, ACK, CANCEL, BYE, OPTIONS, INFO`,
            `Content-Type: application/sdp`
        ];
        
        if (auth) {
            headers.push(`Authorization: ${auth}`);
        }
        
        headers.push(`Content-Length: ${sdp.length}`, '', sdp);
        
        const message = headers.join('\r\n');
        console.log('\n[SEND] INVITE');
        
        this.send(message);
    }
    
    createSDP() {
        const sessionId = Date.now();
        return [
            'v=0',
            `o=- ${sessionId} ${sessionId} IN IP4 ${this.localIP}`,
            's=SIPClient',
            `c=IN IP4 ${this.localIP}`,
            't=0 0',
            `m=audio ${this.rtpPort} RTP/AVP 0 8 101`,
            'a=rtpmap:0 PCMU/8000',
            'a=rtpmap:8 PCMA/8000',
            'a=rtpmap:101 telephone-event/8000',
            'a=fmtp:101 0-16',
            'a=sendrecv'
        ].join('\r\n');
    }
    
    startRTP() {
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        this.rtpSocket = dgram.createSocket('udp4');
        
        this.rtpSocket.on('message', (msg) => {
            // Check for DTMF
            if (msg.length >= 12) {
                const payloadType = msg[1] & 0x7f;
                if (payloadType === 101) {
                    const event = msg[12];
                    const endBit = (msg[13] & 0x80) !== 0;
                    
                    if (endBit) {
                        const digit = event <= 9 ? event.toString() : 
                                     event === 10 ? '*' : 
                                     event === 11 ? '#' : '?';
                        
                        console.log(`\n🎵 DTMF DETECTED: ${digit}\n`);
                        this.emit('dtmf', digit);
                        
                        if (digit === '1') {
                            console.log('📞 Digit 1 detected - hanging up...');
                            setTimeout(() => this.hangup(), 500);
                        }
                    }
                }
            }
        });
        
        this.rtpSocket.bind(this.rtpPort, () => {
            console.log(`[RTP] Listening on port ${this.rtpPort}`);
        });
    }
    
    handleInviteOK(msg, headers) {
        console.log('\n✅ CALL CONNECTED!\n');
        
        if (headers.to) {
            const toMatch = headers.to.match(/tag=([^;]+)/);
            if (toMatch) {
                this.currentCall.toTag = toMatch[1];
            }
        }
        
        this.currentCall.state = 'connected';
        
        // Send ACK
        this.sendAck();
        
        this.emit('connected');
        console.log('⏳ Waiting for DTMF digit 1...');
    }
    
    sendAck() {
        const headers = [
            `ACK ${this.currentCall.uri || this.currentTransaction.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=z9hG4bK${this.generateId()};rport`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${this.currentCall.fromTag}`,
            `To: <${this.currentCall.uri || this.currentTransaction.uri}>;tag=${this.currentCall.toTag || ''}`,
            `Call-ID: ${this.currentCall.callId}`,
            `CSeq: ${this.currentTransaction.cseq} ACK`,
            `Max-Forwards: 70`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
    }
    
    handleRequest(msg, lines) {
        const [method] = lines[0].split(' ');
        const headers = this.parseHeaders(lines);
        
        console.log(`\n[RECV] ${method} request`);
        
        if (method === 'OPTIONS') {
            this.sendResponse('200 OK', headers, [
                'Allow: INVITE, ACK, CANCEL, BYE, OPTIONS, INFO',
                'Accept: application/sdp, application/dtmf-relay'
            ]);
        } else if (method === 'INFO') {
            this.sendResponse('200 OK', headers);
            
            // Check for DTMF in INFO
            const contentType = headers['content-type'] || '';
            if (contentType.includes('dtmf')) {
                const bodyStart = msg.indexOf('\r\n\r\n') + 4;
                const body = msg.substring(bodyStart);
                
                let digit = null;
                if (contentType.includes('dtmf-relay')) {
                    const match = body.match(/Signal=(\d)/);
                    if (match) digit = match[1];
                } else {
                    digit = body.trim().charAt(0);
                }
                
                if (digit) {
                    console.log(`\n📱 DTMF via INFO: ${digit}\n`);
                    this.emit('dtmf', digit);
                    
                    if (digit === '1') {
                        console.log('📞 Digit 1 detected - hanging up...');
                        setTimeout(() => this.hangup(), 500);
                    }
                }
            }
        } else if (method === 'BYE') {
            this.sendResponse('200 OK', headers);
            console.log('[INFO] Call ended by remote');
            this.currentCall = null;
            this.emit('ended');
        }
    }
    
    sendResponse(status, requestHeaders, extraHeaders = []) {
        const headers = [
            `SIP/2.0 ${status}`,
            `Via: ${requestHeaders.via}`,
            `From: ${requestHeaders.from}`,
            `To: ${requestHeaders.to}`,
            `Call-ID: ${requestHeaders['call-id']}`,
            `CSeq: ${requestHeaders.cseq}`,
            ...extraHeaders,
            'Content-Length: 0',
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
    }
    
    hangup() {
        if (!this.currentCall || this.currentCall.state === 'ended') return;
        
        console.log('\n[CALL] Hanging up...');
        
        const headers = [
            `BYE ${this.currentTransaction.uri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=z9hG4bK${this.generateId()};rport`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${this.currentCall.fromTag}`,
            `To: <${this.currentTransaction.uri}>;tag=${this.currentCall.toTag || ''}`,
            `Call-ID: ${this.currentCall.callId}`,
            `CSeq: 2 BYE`,
            `Max-Forwards: 70`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
        this.currentCall.state = 'ended';
        this.emit('ended');
    }
    
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
    
    send(message) {
        const buffer = Buffer.from(message);
        this.socket.send(buffer, 0, buffer.length, this.config.port, this.config.server);
    }
    
    stop() {
        if (this.currentCall && this.currentCall.state !== 'ended') {
            this.hangup();
        }
        
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        if (this.socket) {
            this.socket.close();
        }
        
        console.log('[SIP] Client stopped');
    }
}

// Test
async function test() {
    const client = new FinalSIPClient({
        server: '10.105.0.3',
        port: 5060,
        username: '5530',
        password: '5530',
        targetNumber: '990823112'
    });
    
    console.log('=== Final SIP Client Test ===');
    console.log(`Server: ${client.config.server}`);
    console.log(`User: ${client.config.username}`);
    console.log(`Target: ${client.config.targetNumber}`);
    console.log('');
    
    try {
        await client.start();
        
        client.on('registered', () => {
            console.log('📞 Making call in 2 seconds...');
            setTimeout(() => {
                client.makeCall(client.config.targetNumber);
            }, 2000);
        });
        
        client.on('ringing', () => {
            console.log('🔔 Phone is ringing...');
        });
        
        client.on('connected', () => {
            console.log('✅ Call connected!');
        });
        
        client.on('dtmf', (digit) => {
            console.log(`🎵 DTMF: ${digit}`);
        });
        
        client.on('ended', () => {
            console.log('📵 Call ended');
            setTimeout(() => {
                client.stop();
                process.exit(0);
            }, 1000);
        });
        
        // Start registration
        client.register();
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            client.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    test();
}

module.exports = FinalSIPClient;