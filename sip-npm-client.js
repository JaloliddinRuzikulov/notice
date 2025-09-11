#!/usr/bin/env node

const sip = require('sip');
const crypto = require('crypto');
const dgram = require('dgram');
const { EventEmitter } = require('events');

/**
 * SIP Client using npm sip package
 */
class SIPNpmClient extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = {
            server: config.server || '10.105.0.3',
            port: config.port || 5060,
            username: config.username || '5530',
            password: config.password || '5530',
            realm: config.realm || 'asterisk',
            displayName: config.displayName || 'SIP Client'
        };
        
        this.localIP = this.getLocalIP();
        this.localPort = 5060 + Math.floor(Math.random() * 1000);
        this.rtpPort = this.localPort + 2;
        
        this.registered = false;
        this.currentCall = null;
        this.rtpSocket = null;
        
        console.log(`[SIP-NPM] Client initialized - ${this.config.username}@${this.config.server}`);
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
    
    start() {
        // Start SIP stack
        sip.start({
            port: this.localPort,
            publicAddress: this.localIP
        }, (request) => {
            this.handleRequest(request);
        });
        
        console.log(`[SIP-NPM] Started on ${this.localIP}:${this.localPort}`);
    }
    
    register() {
        const uri = `sip:${this.config.username}@${this.config.server}`;
        
        const request = {
            method: 'REGISTER',
            uri: `sip:${this.config.server}`,
            headers: {
                to: { uri: uri },
                from: { uri: uri, params: { tag: this.generateTag() } },
                'call-id': this.generateCallId(),
                cseq: { method: 'REGISTER', seq: 1 },
                contact: [{
                    uri: `sip:${this.config.username}@${this.localIP}:${this.localPort}`,
                    params: { expires: 3600 }
                }],
                expires: 3600,
                'user-agent': 'Node-SIP-Client/1.0'
            }
        };
        
        console.log('[SIP-NPM] Sending REGISTER...');
        
        sip.send(request, (response) => {
            this.handleRegisterResponse(response, request);
        });
    }
    
    handleRegisterResponse(response, originalRequest) {
        console.log(`[SIP-NPM] Register response: ${response.status} ${response.reason}`);
        
        if (response.status === 200) {
            this.registered = true;
            console.log('[SIP-NPM] Registration successful!');
            this.emit('registered');
            
            // Schedule re-registration
            setTimeout(() => this.register(), 3000000); // Re-register in 50 minutes
            
        } else if (response.status === 401 || response.status === 407) {
            // Authentication required
            const challenge = response.headers['www-authenticate'] || response.headers['proxy-authenticate'];
            
            if (challenge && !originalRequest.headers.authorization) {
                console.log('[SIP-NPM] Authentication required, retrying...');
                
                // Add authorization header
                const authHeader = this.createAuthorizationHeader(
                    originalRequest.method,
                    originalRequest.uri,
                    challenge,
                    originalRequest.headers.cseq.seq
                );
                
                originalRequest.headers.authorization = authHeader;
                originalRequest.headers.cseq.seq++;
                
                // Resend with auth
                sip.send(originalRequest, (response) => {
                    this.handleRegisterResponse(response, originalRequest);
                });
            } else {
                console.error('[SIP-NPM] Authentication failed');
                this.emit('error', new Error('Authentication failed'));
            }
        }
    }
    
    createAuthorizationHeader(method, uri, challenge, nc) {
        const parsed = sip.parseAuthenticate(challenge);
        const realm = parsed.realm;
        const nonce = parsed.nonce;
        const qop = parsed.qop;
        
        const ha1 = crypto.createHash('md5')
            .update(`${this.config.username}:${realm}:${this.config.password}`)
            .digest('hex');
            
        const ha2 = crypto.createHash('md5')
            .update(`${method}:${uri}`)
            .digest('hex');
            
        let response;
        const cnonce = crypto.randomBytes(8).toString('hex');
        const ncValue = ('00000000' + nc).slice(-8);
        
        if (qop === 'auth' || qop === 'auth-int') {
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${ncValue}:${cnonce}:${qop}:${ha2}`)
                .digest('hex');
        } else {
            response = crypto.createHash('md5')
                .update(`${ha1}:${nonce}:${ha2}`)
                .digest('hex');
        }
        
        return sip.formatAuthorization({
            scheme: 'Digest',
            username: this.config.username,
            realm: realm,
            nonce: nonce,
            uri: uri,
            qop: qop,
            nc: ncValue,
            cnonce: cnonce,
            response: response,
            algorithm: 'MD5',
            opaque: parsed.opaque
        });
    }
    
    makeCall(number) {
        if (!this.registered) {
            console.error('[SIP-NPM] Not registered!');
            return;
        }
        
        console.log(`[SIP-NPM] Calling ${number}...`);
        
        const fromUri = `sip:${this.config.username}@${this.config.server}`;
        const toUri = `sip:${number}@${this.config.server}`;
        
        // Create RTP socket
        this.createRTPSocket();
        
        // Generate SDP
        const sdp = this.generateSDP();
        
        const callId = this.generateCallId();
        const fromTag = this.generateTag();
        
        this.currentCall = {
            callId: callId,
            fromTag: fromTag,
            toTag: null,
            number: number,
            state: 'calling'
        };
        
        const request = {
            method: 'INVITE',
            uri: toUri,
            headers: {
                to: { uri: toUri },
                from: { uri: fromUri, params: { tag: fromTag } },
                'call-id': callId,
                cseq: { method: 'INVITE', seq: 1 },
                contact: [{ uri: `sip:${this.config.username}@${this.localIP}:${this.localPort}` }],
                'content-type': 'application/sdp',
                'user-agent': 'Node-SIP-Client/1.0',
                allow: 'INVITE, ACK, CANCEL, BYE, OPTIONS, INFO'
            },
            content: sdp
        };
        
        sip.send(request, (response) => {
            this.handleInviteResponse(response, request);
        });
    }
    
    handleInviteResponse(response, originalRequest) {
        console.log(`[SIP-NPM] INVITE response: ${response.status} ${response.reason}`);
        
        if (response.status === 100) {
            // Trying - ignore
        } else if (response.status === 180 || response.status === 183) {
            console.log('[SIP-NPM] Ringing...');
            this.emit('ringing');
        } else if (response.status === 200) {
            console.log('[SIP-NPM] Call connected!');
            
            // Extract to tag
            if (response.headers.to && response.headers.to.params) {
                this.currentCall.toTag = response.headers.to.params.tag;
            }
            
            // Send ACK
            this.sendAck(response);
            
            this.currentCall.state = 'connected';
            this.emit('connected');
            
        } else if (response.status === 401 || response.status === 407) {
            // Auth required for INVITE
            const challenge = response.headers['www-authenticate'] || response.headers['proxy-authenticate'];
            
            if (challenge && !originalRequest.headers.authorization) {
                const authHeader = this.createAuthorizationHeader(
                    originalRequest.method,
                    originalRequest.uri,
                    challenge,
                    originalRequest.headers.cseq.seq
                );
                
                originalRequest.headers.authorization = authHeader;
                originalRequest.headers.cseq.seq++;
                
                sip.send(originalRequest, (response) => {
                    this.handleInviteResponse(response, originalRequest);
                });
            }
        } else if (response.status === 486) {
            console.log('[SIP-NPM] Busy');
            this.emit('busy');
        } else if (response.status >= 400) {
            console.error(`[SIP-NPM] Call failed: ${response.status} ${response.reason}`);
            this.emit('error', new Error(`${response.status} ${response.reason}`));
        }
    }
    
    sendAck(inviteResponse) {
        const ack = {
            method: 'ACK',
            uri: inviteResponse.headers.contact[0].uri,
            headers: {
                to: inviteResponse.headers.to,
                from: inviteResponse.headers.from,
                'call-id': inviteResponse.headers['call-id'],
                cseq: { method: 'ACK', seq: inviteResponse.headers.cseq.seq },
                via: []
            }
        };
        
        sip.send(ack);
    }
    
    generateSDP() {
        const sessionId = Date.now();
        return [
            'v=0',
            `o=- ${sessionId} ${sessionId} IN IP4 ${this.localIP}`,
            's=SIP.js',
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
    
    createRTPSocket() {
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        this.rtpSocket = dgram.createSocket('udp4');
        
        this.rtpSocket.on('message', (msg) => {
            this.handleRTPPacket(msg);
        });
        
        this.rtpSocket.bind(this.rtpPort, () => {
            console.log(`[SIP-NPM] RTP socket on port ${this.rtpPort}`);
        });
    }
    
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
                    console.log(`[SIP-NPM] DTMF detected (RFC2833): ${digit}`);
                    this.handleDTMF(digit);
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
    
    handleRequest(request) {
        console.log(`[SIP-NPM] Received ${request.method} request`);
        
        if (request.method === 'OPTIONS') {
            // Respond to OPTIONS
            const response = sip.makeResponse(request, 200, 'OK');
            response.headers.allow = 'INVITE, ACK, CANCEL, BYE, OPTIONS, INFO';
            response.headers.accept = 'application/sdp, application/dtmf-relay, application/dtmf';
            sip.send(response);
            
        } else if (request.method === 'INFO') {
            // Handle INFO (DTMF)
            sip.send(sip.makeResponse(request, 200, 'OK'));
            
            const contentType = request.headers['content-type'] || '';
            if (contentType.includes('dtmf')) {
                let digit = null;
                
                if (contentType.includes('dtmf-relay') && request.content) {
                    const match = request.content.match(/Signal=(\d)/);
                    if (match) digit = match[1];
                } else if (request.content) {
                    digit = request.content.trim().charAt(0);
                }
                
                if (digit) {
                    console.log(`[SIP-NPM] DTMF detected (INFO): ${digit}`);
                    this.handleDTMF(digit);
                }
            }
            
        } else if (request.method === 'BYE') {
            // Handle BYE
            sip.send(sip.makeResponse(request, 200, 'OK'));
            console.log('[SIP-NPM] Call ended by remote');
            if (this.currentCall) {
                this.currentCall.state = 'ended';
            }
            this.emit('ended');
        }
    }
    
    handleDTMF(digit) {
        this.emit('dtmf', digit);
        
        if (digit === '1' && this.currentCall && this.currentCall.state === 'connected') {
            console.log('[SIP-NPM] Digit 1 detected - hanging up...');
            setTimeout(() => this.hangup(), 500);
        }
    }
    
    hangup() {
        if (!this.currentCall || this.currentCall.state === 'ended') return;
        
        console.log('[SIP-NPM] Hanging up...');
        
        const request = {
            method: 'BYE',
            uri: `sip:${this.currentCall.number}@${this.config.server}`,
            headers: {
                to: {
                    uri: `sip:${this.currentCall.number}@${this.config.server}`,
                    params: { tag: this.currentCall.toTag }
                },
                from: {
                    uri: `sip:${this.config.username}@${this.config.server}`,
                    params: { tag: this.currentCall.fromTag }
                },
                'call-id': this.currentCall.callId,
                cseq: { method: 'BYE', seq: 2 }
            }
        };
        
        sip.send(request, (response) => {
            console.log(`[SIP-NPM] BYE response: ${response.status}`);
        });
        
        this.currentCall.state = 'ended';
        this.emit('ended');
    }
    
    generateTag() {
        return crypto.randomBytes(4).toString('hex');
    }
    
    generateCallId() {
        return crypto.randomBytes(16).toString('hex') + '@' + this.localIP;
    }
    
    stop() {
        if (this.currentCall && this.currentCall.state !== 'ended') {
            this.hangup();
        }
        
        if (this.rtpSocket) {
            this.rtpSocket.close();
        }
        
        sip.stop();
        console.log('[SIP-NPM] Client stopped');
    }
}

// Test
async function test() {
    const client = new SIPNpmClient({
        server: '10.105.0.3',
        port: 5060,
        username: '5530',
        password: '5530'
    });
    
    console.log('=== SIP NPM Client Test ===\n');
    
    // Event handlers
    client.on('registered', () => {
        console.log('\n[TEST] Registered! Making call in 2 seconds...\n');
        setTimeout(() => {
            client.makeCall('990823112');
        }, 2000);
    });
    
    client.on('ringing', () => {
        console.log('[TEST] Ringing...');
    });
    
    client.on('connected', () => {
        console.log('[TEST] Connected! Waiting for DTMF...');
    });
    
    client.on('dtmf', (digit) => {
        console.log(`[TEST] DTMF: ${digit}`);
    });
    
    client.on('ended', () => {
        console.log('[TEST] Call ended');
        setTimeout(() => {
            client.stop();
            process.exit(0);
        }, 1000);
    });
    
    client.on('error', (err) => {
        console.error('[TEST] Error:', err);
    });
    
    // Start client
    client.start();
    
    // Register
    client.register();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n[TEST] Shutting down...');
        client.stop();
        process.exit(0);
    });
}

// Run if called directly
if (require.main === module) {
    test();
}

module.exports = SIPNpmClient;