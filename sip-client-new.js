#!/usr/bin/env node

const dgram = require('dgram');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class CompleteSIPClient extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = {
            server: config.server || '10.105.0.3',
            port: config.port || 5060,
            username: config.username || '5530',
            password: config.password || '5530',
            domain: config.domain || config.server || '10.105.0.3',
            transport: config.transport || 'UDP',
            dtmfMethod: config.dtmfMethod || 'auto', // auto, rfc2833, info, both
            debugDTMF: config.debugDTMF !== false,
            targetNumber: config.targetNumber || '990823112'
        };

        this.localPort = Math.floor(Math.random() * 30000) + 20000;
        this.rtpPort = this.localPort + 2;
        this.tag = this.generateTag();
        this.callId = this.generateCallId();
        this.cseq = 1;
        this.branch = this.generateBranch();
        
        this.registered = false;
        this.inCall = false;
        this.callInfo = {};
        this.dtmfDetected = false;
        
        this.socket = null;
        this.rtpSocket = null;
        this.authChallenge = null;
    }

    generateTag() {
        return Math.random().toString(36).substring(2, 10);
    }

    generateCallId() {
        return `${Date.now()}.${Math.random().toString(36).substring(2, 10)}@${this.config.domain}`;
    }

    generateBranch() {
        return `z9hG4bK${Math.random().toString(36).substring(2, 10)}`;
    }

    async start() {
        return new Promise((resolve, reject) => {
            this.socket = dgram.createSocket('udp4');
            
            this.socket.on('error', (err) => {
                console.error('[SIP] Socket error:', err);
                reject(err);
            });

            this.socket.on('message', (msg, rinfo) => {
                this.handleMessage(msg.toString(), rinfo);
            });

            this.socket.bind(this.localPort, () => {
                console.log(`[SIP] Client listening on port ${this.localPort}`);
                resolve();
            });
        });
    }

    async register() {
        const uri = `sip:${this.config.username}@${this.config.domain}`;
        const requestUri = `sip:${this.config.domain}`;
        
        let headers = [
            `REGISTER ${requestUri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=${this.branch};rport`,
            `Max-Forwards: 70`,
            `From: <${uri}>;tag=${this.tag}`,
            `To: <${uri}>`,
            `Call-ID: ${this.callId}`,
            `CSeq: ${this.cseq} REGISTER`,
            `Contact: <sip:${this.config.username}@${this.getLocalIP()}:${this.localPort}>`,
            `Expires: 3600`,
            `User-Agent: NodeSIPClient/1.0`,
            `Content-Length: 0`
        ];

        if (this.authChallenge) {
            const authHeader = this.createAuthHeader('REGISTER', requestUri);
            headers.splice(7, 0, `Authorization: ${authHeader}`);
        }

        const message = headers.join('\r\n') + '\r\n\r\n';
        this.sendMessage(message);
        
        console.log('[SIP] Sending REGISTER request');
    }

    createAuthHeader(method, uri) {
        const realm = this.authChallenge.realm;
        const nonce = this.authChallenge.nonce;
        const qop = this.authChallenge.qop;
        
        const ha1 = crypto.createHash('md5')
            .update(`${this.config.username}:${realm}:${this.config.password}`)
            .digest('hex');
            
        const ha2 = crypto.createHash('md5')
            .update(`${method}:${uri}`)
            .digest('hex');
            
        let response;
        let authParams = `Digest username="${this.config.username}",realm="${realm}",nonce="${nonce}",uri="${uri}"`;
        
        if (qop) {
            const nc = '00000001';
            const cnonce = crypto.randomBytes(8).toString('hex');
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
                .digest('hex');
            authParams += `,qop=${qop},nc=${nc},cnonce="${cnonce}"`;
        } else {
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${ha2}`)
                .digest('hex');
        }
        
        authParams += `,response="${response}",algorithm=MD5`;
        return authParams;
    }

    async makeCall(targetNumber) {
        if (!this.registered) {
            throw new Error('Not registered');
        }

        const fromUri = `sip:${this.config.username}@${this.config.domain}`;
        const toUri = `sip:${targetNumber}@${this.config.domain}`;
        const requestUri = toUri;
        
        this.callInfo = {
            fromTag: this.generateTag(),
            callId: this.generateCallId(),
            targetNumber: targetNumber
        };

        this.cseq++;
        this.branch = this.generateBranch();

        // Create SDP with DTMF support
        const sdp = this.createSDP();
        
        let headers = [
            `INVITE ${requestUri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=${this.branch};rport`,
            `Max-Forwards: 70`,
            `From: <${fromUri}>;tag=${this.callInfo.fromTag}`,
            `To: <${toUri}>`,
            `Call-ID: ${this.callInfo.callId}`,
            `CSeq: ${this.cseq} INVITE`,
            `Contact: <sip:${this.config.username}@${this.getLocalIP()}:${this.localPort}>`,
            `Content-Type: application/sdp`,
            `User-Agent: NodeSIPClient/1.0`,
            `Content-Length: ${sdp.length}`
        ];

        if (this.authChallenge) {
            const authHeader = this.createAuthHeader('INVITE', requestUri);
            headers.splice(7, 0, `Authorization: ${authHeader}`);
        }

        const message = headers.join('\r\n') + '\r\n\r\n' + sdp;
        this.sendMessage(message);
        
        console.log(`[SIP] Making call to ${targetNumber}`);
        this.setupRTPSocket();
    }

    createSDP() {
        const localIP = this.getLocalIP();
        const sessionId = Date.now();
        
        const sdp = [
            'v=0',
            `o=- ${sessionId} ${sessionId} IN IP4 ${localIP}`,
            's=NodeSIPClient',
            `c=IN IP4 ${localIP}`,
            't=0 0',
            `m=audio ${this.rtpPort} RTP/AVP 0 8 101`,
            'a=rtpmap:0 PCMU/8000',
            'a=rtpmap:8 PCMA/8000',
            'a=rtpmap:101 telephone-event/8000',
            'a=fmtp:101 0-16',
            'a=sendrecv',
            'a=ptime:20'
        ].join('\r\n');
        
        return sdp;
    }

    setupRTPSocket() {
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }

        this.rtpSocket = dgram.createSocket('udp4');
        
        this.rtpSocket.on('message', (msg) => {
            this.handleRTPPacket(msg);
        });

        this.rtpSocket.bind(this.rtpPort, () => {
            console.log(`[RTP] Socket listening on port ${this.rtpPort}`);
        });
    }

    handleRTPPacket(packet) {
        if (packet.length < 12) return;
        
        // Parse RTP header
        const payloadType = packet[1] & 0x7f;
        
        // Check for telephone-event (RFC 2833)
        if (payloadType === 101) {
            const dtmfPayload = packet.slice(12);
            if (dtmfPayload.length >= 4) {
                const event = dtmfPayload[0];
                const endBit = (dtmfPayload[1] & 0x80) !== 0;
                const volume = dtmfPayload[1] & 0x3f;
                const duration = (dtmfPayload[2] << 8) | dtmfPayload[3];
                
                if (endBit && !this.dtmfDetected) {
                    const digit = this.eventToDigit(event);
                    console.log(`[DTMF-RFC2833] Detected digit: ${digit} (duration: ${duration}ms)`);
                    this.handleDTMFDigit(digit, 'rfc2833');
                }
            }
        }
    }

    eventToDigit(event) {
        if (event >= 0 && event <= 9) return event.toString();
        if (event === 10) return '*';
        if (event === 11) return '#';
        return '?';
    }

    handleMessage(msg, rinfo) {
        const lines = msg.split('\r\n');
        const firstLine = lines[0];
        
        console.log(`\n[SIP] Received from ${rinfo.address}:${rinfo.port}:`);
        console.log('--- Full Message ---');
        console.log(msg);
        console.log('--- End Message ---');

        if (firstLine.startsWith('SIP/2.0')) {
            this.handleResponse(msg);
        } else {
            this.handleRequest(msg);
        }
    }

    handleResponse(msg) {
        const lines = msg.split('\r\n');
        const statusLine = lines[0];
        const [, statusCode, statusText] = statusLine.match(/SIP\/2.0 (\d+) (.+)/) || [];
        
        const headers = this.parseHeaders(lines);
        const cseqHeader = headers['cseq'] || '';
        const method = cseqHeader.split(' ')[1];
        
        console.log(`[SIP] Response: ${statusCode} ${statusText} for ${method}`);

        switch (statusCode) {
            case '200':
                if (method === 'REGISTER') {
                    this.registered = true;
                    console.log('[SIP] Registration successful');
                    this.emit('registered');
                } else if (method === 'INVITE') {
                    console.log('[SIP] Call connected');
                    this.inCall = true;
                    this.sendACK(headers);
                    this.emit('callConnected');
                } else if (method === 'BYE') {
                    console.log('[SIP] Call ended');
                    this.inCall = false;
                    this.emit('callEnded');
                }
                break;
                
            case '401':
            case '407':
                if (!this.authChallenge) {
                    this.authChallenge = this.parseAuthChallenge(headers);
                    console.log('[SIP] Authentication required, retrying...');
                    this.cseq++;
                    if (method === 'REGISTER') {
                        this.register();
                    } else if (method === 'INVITE') {
                        this.makeCall(this.callInfo.targetNumber);
                    }
                } else {
                    console.error('[SIP] Authentication failed');
                    this.emit('error', new Error('Authentication failed'));
                }
                break;
                
            case '180':
                console.log('[SIP] Call ringing');
                this.emit('ringing');
                break;
                
            case '486':
                console.log('[SIP] Busy');
                this.emit('busy');
                break;
                
            default:
                if (parseInt(statusCode) >= 400) {
                    console.error(`[SIP] Error response: ${statusCode} ${statusText}`);
                    this.emit('error', new Error(`${statusCode} ${statusText}`));
                }
        }
    }

    handleRequest(msg) {
        const lines = msg.split('\r\n');
        const requestLine = lines[0];
        const [method] = requestLine.split(' ');
        const headers = this.parseHeaders(lines);
        
        console.log(`[SIP] Request: ${method}`);
        
        switch (method) {
            case 'INFO':
                this.handleINFO(msg, headers);
                break;
            case 'BYE':
                this.handleBYE(headers);
                break;
            case 'OPTIONS':
                this.sendOptionsResponse(headers);
                break;
        }
    }

    handleINFO(msg, headers) {
        // Send 200 OK response first
        this.sendInfoResponse(headers);
        
        // Parse body for DTMF
        const bodyStart = msg.indexOf('\r\n\r\n') + 4;
        const body = msg.substring(bodyStart);
        const contentType = headers['content-type'] || '';
        
        console.log(`[SIP-INFO] Content-Type: ${contentType}`);
        console.log(`[SIP-INFO] Body: ${body}`);
        
        let digit = null;
        
        if (contentType.includes('application/dtmf-relay')) {
            const match = body.match(/Signal=(\d)/);
            if (match) {
                digit = match[1];
            }
        } else if (contentType.includes('application/dtmf')) {
            const lines = body.split('\r\n');
            for (const line of lines) {
                if (line.trim()) {
                    digit = line.trim();
                    break;
                }
            }
        } else if (contentType.includes('text/plain')) {
            digit = body.trim();
        }
        
        if (digit) {
            console.log(`[DTMF-INFO] Detected digit: ${digit}`);
            this.handleDTMFDigit(digit, 'info');
        }
    }

    handleDTMFDigit(digit, method) {
        console.log(`\n*** DTMF DETECTED: ${digit} (via ${method}) ***\n`);
        
        if (digit === '1' && !this.dtmfDetected) {
            this.dtmfDetected = true;
            console.log('[DTMF] Target digit 1 detected! Hanging up...');
            this.emit('dtmfDetected', digit);
            
            // Hang up the call
            setTimeout(() => {
                this.hangup();
            }, 500);
        }
    }

    sendInfoResponse(requestHeaders) {
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${requestHeaders['via']}`,
            `From: ${requestHeaders['from']}`,
            `To: ${requestHeaders['to']}`,
            `Call-ID: ${requestHeaders['call-id']}`,
            `CSeq: ${requestHeaders['cseq']}`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
    }

    sendACK(responseHeaders) {
        const toHeader = responseHeaders['to'];
        const toTag = this.extractTag(toHeader);
        const requestUri = this.extractUri(toHeader);
        
        this.cseq++;
        this.branch = this.generateBranch();
        
        const ack = [
            `ACK ${requestUri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=${this.branch};rport`,
            `Max-Forwards: 70`,
            `From: ${responseHeaders['from']}`,
            `To: ${toHeader}`,
            `Call-ID: ${responseHeaders['call-id']}`,
            `CSeq: ${this.cseq} ACK`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(ack);
    }

    hangup() {
        if (!this.inCall) {
            console.log('[SIP] No active call to hang up');
            return;
        }

        const toUri = `sip:${this.callInfo.targetNumber}@${this.config.domain}`;
        const fromUri = `sip:${this.config.username}@${this.config.domain}`;
        
        this.cseq++;
        this.branch = this.generateBranch();
        
        const bye = [
            `BYE ${toUri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=${this.branch};rport`,
            `Max-Forwards: 70`,
            `From: <${fromUri}>;tag=${this.callInfo.fromTag}`,
            `To: <${toUri}>`,
            `Call-ID: ${this.callInfo.callId}`,
            `CSeq: ${this.cseq} BYE`,
            `Contact: <sip:${this.config.username}@${this.getLocalIP()}:${this.localPort}>`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(bye);
        console.log('[SIP] Sending BYE request');
    }

    handleBYE(headers) {
        console.log('[SIP] Received BYE request');
        
        // Send 200 OK response
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers['via']}`,
            `From: ${headers['from']}`,
            `To: ${headers['to']}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers['cseq']}`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
        this.inCall = false;
        this.emit('callEnded');
    }

    sendOptionsResponse(headers) {
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers['via']}`,
            `From: ${headers['from']}`,
            `To: ${headers['to']}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers['cseq']}`,
            'Allow: INVITE, ACK, CANCEL, BYE, OPTIONS, INFO',
            'Accept: application/sdp, application/dtmf-relay, application/dtmf, text/plain',
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
    }

    parseHeaders(lines) {
        const headers = {};
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line === '') break;
            
            const [name, ...valueParts] = line.split(':');
            if (name && valueParts.length > 0) {
                headers[name.toLowerCase().trim()] = valueParts.join(':').trim();
            }
        }
        return headers;
    }

    parseAuthChallenge(headers) {
        const authHeader = headers['www-authenticate'] || headers['proxy-authenticate'];
        if (!authHeader) return null;
        
        const challenge = {};
        const params = authHeader.substring(7).split(',');
        
        params.forEach(param => {
            const [key, value] = param.trim().split('=');
            challenge[key] = value ? value.replace(/"/g, '') : '';
        });
        
        return challenge;
    }

    extractTag(header) {
        const match = header.match(/tag=([^;]+)/);
        return match ? match[1] : '';
    }

    extractUri(header) {
        const match = header.match(/<([^>]+)>/);
        return match ? match[1] : header;
    }

    sendMessage(message) {
        const buffer = Buffer.from(message);
        this.socket.send(buffer, 0, buffer.length, this.config.port, this.config.server, (err) => {
            if (err) {
                console.error('[SIP] Send error:', err);
            }
        });
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

    async stop() {
        if (this.inCall) {
            this.hangup();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (this.socket) {
            this.socket.close();
        }
        
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        console.log('[SIP] Client stopped');
    }
}

// Test script
async function testSIPClient() {
    const client = new CompleteSIPClient({
        server: '10.105.0.3',
        port: 5060,
        username: '5530',
        password: '5530',
        domain: '10.105.0.3',
        targetNumber: '990823112',
        debugDTMF: true
    });

    console.log('=== SIP Client Test ===');
    console.log('Configuration:', client.config);
    console.log('');

    try {
        // Start client
        await client.start();
        console.log('[TEST] SIP client started');

        // Register
        client.on('registered', async () => {
            console.log('[TEST] Registration successful! Making call...');
            
            // Make call
            setTimeout(() => {
                client.makeCall('990823112');
            }, 1000);
        });

        client.on('ringing', () => {
            console.log('[TEST] Phone is ringing...');
        });

        client.on('callConnected', () => {
            console.log('[TEST] Call connected! Waiting for DTMF digit 1...');
        });

        client.on('dtmfDetected', (digit) => {
            console.log(`[TEST] DTMF digit ${digit} detected!`);
        });

        client.on('callEnded', () => {
            console.log('[TEST] Call ended');
            setTimeout(() => {
                client.stop();
                process.exit(0);
            }, 1000);
        });

        client.on('error', (err) => {
            console.error('[TEST] Error:', err);
        });

        // Start registration
        await client.register();

        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n[TEST] Shutting down...');
            await client.stop();
            process.exit(0);
        });

    } catch (error) {
        console.error('[TEST] Fatal error:', error);
        await client.stop();
        process.exit(1);
    }
}

// Run test if executed directly
if (require.main === module) {
    testSIPClient();
}

module.exports = CompleteSIPClient;