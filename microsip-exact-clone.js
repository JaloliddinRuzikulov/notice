#!/usr/bin/env node

/**
 * MicroSIP Exact Clone - 100% MicroSIP protokolini takrorlash
 */

const dgram = require('dgram');
const crypto = require('crypto');
const EventEmitter = require('events');
const os = require('os');

class MicroSIPExactClone extends EventEmitter {
    constructor() {
        super();
        
        // MicroSIP exact config
        this.config = {
            server: '10.105.0.3',
            port: 5060,
            username: '5530',
            password: '5530',
            realm: 'asterisk',
            userAgent: 'MicroSIP/3.21.3',
            expires: 300 // MicroSIP default
        };
        
        this.socket = null;
        this.localPort = 5060; // MicroSIP uses 5060
        this.localIP = this.getLocalIP();
        this.rtpPort = 4000; // MicroSIP RTP range
        
        // State
        this.registered = false;
        this.registerAuth = null;
        this.instanceId = '<urn:uuid:' + this.generateUUID() + '>';
        
        console.log('[MicroSIP Clone] Starting...');
        console.log(`[MicroSIP Clone] Local: ${this.localIP}:${this.localPort}`);
        console.log(`[MicroSIP Clone] Server: ${this.config.server}:${this.config.port}`);
    }
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
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
    
    async start() {
        return new Promise((resolve, reject) => {
            try {
                // Try to use port 5060 first (like MicroSIP)
                this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
                
                this.socket.on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        // If 5060 is busy, use random port
                        this.localPort = 5060 + Math.floor(Math.random() * 1000);
                        console.log(`[MicroSIP Clone] Port 5060 busy, using ${this.localPort}`);
                        this.socket.close();
                        this.socket = dgram.createSocket('udp4');
                        this.bindSocket(resolve, reject);
                    } else {
                        console.error('[MicroSIP Clone] Socket error:', err);
                        reject(err);
                    }
                });
                
                this.socket.on('message', (msg, rinfo) => {
                    this.handleMessage(msg, rinfo);
                });
                
                this.bindSocket(resolve, reject);
            } catch (err) {
                reject(err);
            }
        });
    }
    
    bindSocket(resolve, reject) {
        this.socket.bind(this.localPort, '0.0.0.0', (err) => {
            if (err) {
                reject(err);
            } else {
                console.log(`[MicroSIP Clone] Socket bound to ${this.localIP}:${this.localPort}`);
                resolve();
            }
        });
    }
    
    // MicroSIP style REGISTER
    register() {
        const callId = this.generateCallId();
        const fromTag = this.generateTag();
        const branch = this.generateBranch();
        const cseq = 1;
        
        this.registerTransaction = {
            callId,
            fromTag,
            branch,
            cseq
        };
        
        this.sendRegister();
    }
    
    sendRegister(withAuth = false) {
        const t = this.registerTransaction;
        
        // MicroSIP exact format
        const headers = [
            `REGISTER sip:${this.config.server} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${t.branch}`,
            `Max-Forwards: 70`,
            `Contact: <sip:${this.config.username}@${this.localIP}:${this.localPort}>;+sip.instance="${this.instanceId}"`,
            `To: <sip:${this.config.username}@${this.config.server}>`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${t.fromTag}`,
            `Call-ID: ${t.callId}`,
            `CSeq: ${t.cseq} REGISTER`,
            `Expires: ${this.config.expires}`,
            `Allow: INVITE, ACK, CANCEL, OPTIONS, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO, UPDATE`,
            `User-Agent: ${this.config.userAgent}`
        ];
        
        if (withAuth && this.registerAuth) {
            headers.push(`Authorization: ${this.registerAuth}`);
        }
        
        headers.push(`Supported: replaces, norefersub, extended-refer, timer, X-cisco-serviceuri`);
        headers.push(`Content-Length: 0`);
        headers.push('');
        headers.push('');
        
        const message = headers.join('\r\n');
        
        console.log('\n[MicroSIP Clone] >>> REGISTER');
        if (withAuth) {
            console.log('[MicroSIP Clone] (with Authorization)');
        }
        
        this.send(message);
    }
    
    handleMessage(msg, rinfo) {
        const message = msg.toString();
        const lines = message.split('\r\n');
        const firstLine = lines[0];
        
        console.log(`\n[MicroSIP Clone] <<< ${firstLine}`);
        
        if (firstLine.startsWith('SIP/2.0')) {
            const [, statusCode, ...statusText] = firstLine.split(' ');
            const headers = this.parseHeaders(lines);
            
            if (statusCode === '401' && headers['www-authenticate']) {
                this.handle401(headers);
            } else if (statusCode === '200') {
                const cseq = headers['cseq'] || '';
                if (cseq.includes('REGISTER')) {
                    this.handleRegisterSuccess();
                } else if (cseq.includes('INVITE')) {
                    this.handleInviteSuccess(message, headers);
                }
            } else if (statusCode === '100') {
                console.log('[MicroSIP Clone] Trying...');
            } else if (statusCode === '180') {
                console.log('[MicroSIP Clone] Ringing...');
                this.emit('ringing');
            }
        } else {
            // Request
            const [method] = firstLine.split(' ');
            this.handleRequest(method, message, lines);
        }
    }
    
    handle401(headers) {
        console.log('[MicroSIP Clone] Authentication required');
        
        const authHeader = headers['www-authenticate'];
        const challenge = this.parseAuthChallenge(authHeader);
        
        // MicroSIP style auth
        const username = this.config.username;
        const password = this.config.password;
        const realm = challenge.realm || this.config.realm;
        const uri = `sip:${this.config.server}`;
        const nonce = challenge.nonce;
        const method = 'REGISTER';
        
        // Calculate response exactly like MicroSIP
        const ha1 = crypto.createHash('md5')
            .update(`${username}:${realm}:${password}`)
            .digest('hex');
            
        const ha2 = crypto.createHash('md5')
            .update(`${method}:${uri}`)
            .digest('hex');
            
        let response;
        let authStr = `Digest username="${username}",realm="${realm}",nonce="${nonce}",uri="${uri}"`;
        
        if (challenge.qop) {
            const nc = '00000001';
            const cnonce = crypto.randomBytes(16).toString('hex');
            
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${nc}:${cnonce}:${challenge.qop}:${ha2}`)
                .digest('hex');
                
            authStr += `,response="${response}",cnonce="${cnonce}",nc=${nc},qop=${challenge.qop}`;
        } else {
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${ha2}`)
                .digest('hex');
                
            authStr += `,response="${response}"`;
        }
        
        authStr += `,algorithm=MD5`;
        
        if (challenge.opaque) {
            authStr += `,opaque="${challenge.opaque}"`;
        }
        
        this.registerAuth = authStr;
        
        // Update transaction
        this.registerTransaction.cseq++;
        this.registerTransaction.branch = this.generateBranch();
        
        // Resend with auth
        this.sendRegister(true);
    }
    
    parseAuthChallenge(header) {
        const challenge = {};
        const authLine = header.replace('Digest ', '');
        
        // Parse exactly like MicroSIP expects
        const parts = authLine.split(',');
        parts.forEach(part => {
            const [key, value] = part.trim().split('=');
            if (key && value) {
                // Remove quotes
                challenge[key] = value.replace(/"/g, '');
            }
        });
        
        return challenge;
    }
    
    handleRegisterSuccess() {
        console.log('\n✅ [MicroSIP Clone] REGISTERED SUCCESSFULLY!\n');
        this.registered = true;
        this.emit('registered');
        
        // Make call after 1 second
        setTimeout(() => {
            this.makeCall('990823112');
        }, 1000);
    }
    
    makeCall(number) {
        console.log(`\n[MicroSIP Clone] Calling ${number}...`);
        
        const callId = this.generateCallId();
        const fromTag = this.generateTag();
        const branch = this.generateBranch();
        const cseq = 1;
        
        this.currentCall = {
            callId,
            fromTag,
            branch,
            cseq,
            number,
            toTag: null
        };
        
        this.sendInvite();
    }
    
    sendInvite(withAuth = false) {
        const c = this.currentCall;
        const sdp = this.createSDP();
        
        // MicroSIP exact INVITE format
        const headers = [
            `INVITE sip:${c.number}@${this.config.server} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${c.branch}`,
            `Max-Forwards: 70`,
            `Contact: <sip:${this.config.username}@${this.localIP}:${this.localPort}>`,
            `To: <sip:${c.number}@${this.config.server}>`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${c.fromTag}`,
            `Call-ID: ${c.callId}`,
            `CSeq: ${c.cseq} INVITE`,
            `Allow: INVITE, ACK, CANCEL, OPTIONS, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO, UPDATE`,
            `Content-Type: application/sdp`,
            `Supported: replaces, norefersub, extended-refer, timer, X-cisco-serviceuri`,
            `User-Agent: ${this.config.userAgent}`,
            `Allow-Events: hold, talk, conference`
        ];
        
        if (withAuth && this.inviteAuth) {
            headers.push(`Authorization: ${this.inviteAuth}`);
        }
        
        headers.push(`Content-Length: ${sdp.length}`);
        headers.push('');
        headers.push(sdp);
        
        const message = headers.join('\r\n');
        
        console.log('\n[MicroSIP Clone] >>> INVITE');
        this.send(message);
        
        // Start RTP
        this.startRTP();
    }
    
    createSDP() {
        const sessionId = Date.now();
        const sessionVersion = sessionId;
        
        // MicroSIP SDP format
        return [
            'v=0',
            `o=- ${sessionId} ${sessionVersion} IN IP4 ${this.localIP}`,
            's=pjmedia',
            `c=IN IP4 ${this.localIP}`,
            `b=AS:84`,
            't=0 0',
            'a=X-nat:0',
            `m=audio ${this.rtpPort} RTP/AVP 0 8 101`,
            `c=IN IP4 ${this.localIP}`,
            `b=TIAS:64000`,
            'a=rtcp:' + (this.rtpPort + 1) + ' IN IP4 ' + this.localIP,
            'a=sendrecv',
            'a=rtpmap:0 PCMU/8000',
            'a=rtpmap:8 PCMA/8000',
            'a=rtpmap:101 telephone-event/8000',
            'a=fmtp:101 0-16'
        ].join('\r\n');
    }
    
    startRTP() {
        this.rtpSocket = dgram.createSocket('udp4');
        
        this.rtpSocket.on('message', (msg) => {
            // Check for DTMF
            if (msg.length >= 12) {
                const payloadType = msg[1] & 0x7f;
                if (payloadType === 101) {
                    this.handleDTMF(msg);
                }
            }
        });
        
        this.rtpSocket.bind(this.rtpPort, () => {
            console.log(`[MicroSIP Clone] RTP on port ${this.rtpPort}`);
        });
    }
    
    handleDTMF(rtpPacket) {
        const event = rtpPacket[12];
        const endBit = (rtpPacket[13] & 0x80) !== 0;
        const volume = rtpPacket[13] & 0x3f;
        const duration = (rtpPacket[14] << 8) | rtpPacket[15];
        
        if (endBit) {
            const digit = event <= 9 ? event.toString() :
                         event === 10 ? '*' :
                         event === 11 ? '#' : '?';
                         
            console.log(`\n🎵 [MicroSIP Clone] DTMF: ${digit} (duration: ${duration}ms)\n`);
            this.emit('dtmf', digit);
            
            if (digit === '1') {
                console.log('✅ [MicroSIP Clone] Digit 1 detected! Hanging up...');
                setTimeout(() => this.hangup(), 500);
            }
        }
    }
    
    handleInviteSuccess(message, headers) {
        console.log('\n✅ [MicroSIP Clone] Call connected!');
        
        // Extract to-tag
        const toHeader = headers['to'] || '';
        const tagMatch = toHeader.match(/tag=([^;]+)/);
        if (tagMatch) {
            this.currentCall.toTag = tagMatch[1];
        }
        
        // Send ACK
        this.sendACK();
        
        this.emit('connected');
        console.log('⏳ Waiting for DTMF digit 1...');
    }
    
    sendACK() {
        const c = this.currentCall;
        
        const headers = [
            `ACK sip:${c.number}@${this.config.server} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${this.generateBranch()}`,
            `Max-Forwards: 70`,
            `Contact: <sip:${this.config.username}@${this.localIP}:${this.localPort}>`,
            `To: <sip:${c.number}@${this.config.server}>;tag=${c.toTag}`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${c.fromTag}`,
            `Call-ID: ${c.callId}`,
            `CSeq: ${c.cseq} ACK`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        console.log('[MicroSIP Clone] >>> ACK');
        this.send(headers.join('\r\n'));
    }
    
    handleRequest(method, message, lines) {
        const headers = this.parseHeaders(lines);
        
        console.log(`[MicroSIP Clone] <<< ${method} request`);
        
        if (method === 'OPTIONS') {
            this.sendOptionsResponse(headers);
        } else if (method === 'INFO') {
            this.handleINFO(message, headers);
        } else if (method === 'BYE') {
            this.handleBYE(headers);
        }
    }
    
    sendOptionsResponse(reqHeaders) {
        const headers = [
            'SIP/2.0 200 OK',
            `Via: ${reqHeaders['via']}`,
            `From: ${reqHeaders['from']}`,
            `To: ${reqHeaders['to']}`,
            `Call-ID: ${reqHeaders['call-id']}`,
            `CSeq: ${reqHeaders['cseq']}`,
            `Contact: <sip:${this.config.username}@${this.localIP}:${this.localPort}>`,
            `Allow: INVITE, ACK, CANCEL, OPTIONS, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO, UPDATE`,
            `Accept: application/sdp, application/pidf+xml, application/xpidf+xml, application/simple-message-summary, message/sipfrag;version=2.0, application/im-iscomposing+xml, text/plain`,
            `Supported: replaces, norefersub, extended-refer, timer, X-cisco-serviceuri`,
            `Allow-Events: presence, message-summary, refer`,
            `User-Agent: ${this.config.userAgent}`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
    }
    
    handleINFO(message, headers) {
        // Send 200 OK first
        this.send200OK(headers);
        
        // Check for DTMF
        const contentType = headers['content-type'] || '';
        if (contentType.includes('dtmf')) {
            const bodyStart = message.indexOf('\r\n\r\n') + 4;
            const body = message.substring(bodyStart);
            
            let digit = null;
            if (contentType.includes('dtmf-relay')) {
                const match = body.match(/Signal=(\d)/);
                if (match) digit = match[1];
            } else {
                digit = body.trim();
            }
            
            if (digit) {
                console.log(`\n📱 [MicroSIP Clone] DTMF via INFO: ${digit}\n`);
                this.emit('dtmf', digit);
                
                if (digit === '1') {
                    console.log('✅ [MicroSIP Clone] Digit 1 detected! Hanging up...');
                    setTimeout(() => this.hangup(), 500);
                }
            }
        }
    }
    
    handleBYE(headers) {
        console.log('[MicroSIP Clone] Remote hangup');
        this.send200OK(headers);
        this.emit('ended');
    }
    
    send200OK(reqHeaders) {
        const headers = [
            'SIP/2.0 200 OK',
            `Via: ${reqHeaders['via']}`,
            `From: ${reqHeaders['from']}`,
            `To: ${reqHeaders['to']}`,
            `Call-ID: ${reqHeaders['call-id']}`,
            `CSeq: ${reqHeaders['cseq']}`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        this.send(headers.join('\r\n'));
    }
    
    hangup() {
        if (!this.currentCall) return;
        
        console.log('\n[MicroSIP Clone] Hanging up...');
        
        const c = this.currentCall;
        c.cseq++;
        
        const headers = [
            `BYE sip:${c.number}@${this.config.server} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.localIP}:${this.localPort};branch=${this.generateBranch()}`,
            `Max-Forwards: 70`,
            `Contact: <sip:${this.config.username}@${this.localIP}:${this.localPort}>`,
            `To: <sip:${c.number}@${this.config.server}>;tag=${c.toTag}`,
            `From: <sip:${this.config.username}@${this.config.server}>;tag=${c.fromTag}`,
            `Call-ID: ${c.callId}`,
            `CSeq: ${c.cseq} BYE`,
            `User-Agent: ${this.config.userAgent}`,
            `Content-Length: 0`,
            '',
            ''
        ];
        
        console.log('[MicroSIP Clone] >>> BYE');
        this.send(headers.join('\r\n'));
        
        this.currentCall = null;
        this.emit('ended');
    }
    
    parseHeaders(lines) {
        const headers = {};
        for (let i = 1; i < lines.length && lines[i]; i++) {
            const colonIndex = lines[i].indexOf(':');
            if (colonIndex > 0) {
                const name = lines[i].substring(0, colonIndex).toLowerCase().trim();
                const value = lines[i].substring(colonIndex + 1).trim();
                headers[name] = value;
            }
        }
        return headers;
    }
    
    send(message) {
        const buffer = Buffer.from(message);
        this.socket.send(buffer, 0, buffer.length, this.config.port, this.config.server);
    }
    
    generateTag() {
        return Math.random().toString(36).substring(2, 10);
    }
    
    generateCallId() {
        const random = crypto.randomBytes(16).toString('hex');
        return random + '@' + this.localIP;
    }
    
    generateBranch() {
        return 'z9hG4bK' + crypto.randomBytes(8).toString('hex');
    }
    
    stop() {
        if (this.currentCall) {
            this.hangup();
        }
        
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        if (this.socket) {
            this.socket.close();
        }
        
        console.log('[MicroSIP Clone] Stopped');
    }
}

// Test
async function runTest() {
    console.log('=== MicroSIP Exact Clone Test ===');
    console.log('This client mimics MicroSIP 3.21.3 exactly');
    console.log('');
    
    const client = new MicroSIPExactClone();
    
    try {
        // Event handlers
        client.on('registered', () => {
            console.log('📞 Will call 990823112 in 1 second...');
        });
        
        client.on('ringing', () => {
            console.log('🔔 Ringing...');
        });
        
        client.on('connected', () => {
            console.log('✅ Connected!');
            console.log('📱 Please press 1 on your phone...');
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
        
        // Start
        await client.start();
        
        // Register
        client.register();
        
        // Handle Ctrl+C
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

runTest();