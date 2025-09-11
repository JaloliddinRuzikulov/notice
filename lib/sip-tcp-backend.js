/**
 * SIP TCP Backend Client
 * TCP transport for better compatibility with some FreePBX configurations
 */

const net = require('net');
const crypto = require('crypto');
const EventEmitter = require('events');

class SIPTCPBackend extends EventEmitter {
    constructor(config) {
        super();
        
        this.config = {
            server: config.server || '10.105.0.3',
            port: config.port || 5060,
            username: config.username,
            password: config.password,
            domain: config.domain || config.server || '10.105.0.3',
            userAgent: 'Xabarnoma-Backend/1.0',
            expires: 3600,
            ...config
        };
        
        this.socket = null;
        this.registered = false;
        this.callId = this.generateCallId();
        this.tag = this.generateTag();
        this.cseq = 1;
        this.activeCalls = new Map();
        this.messageBuffer = '';
    }

    // Initialize TCP connection
    async initialize() {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();
            
            this.socket.on('connect', () => {
                console.log(`TCP SIP connection established to ${this.config.server}:${this.config.port}`);
                resolve();
            });
            
            this.socket.on('data', (data) => {
                this.messageBuffer += data.toString();
                this.processBuffer();
            });
            
            this.socket.on('error', (err) => {
                console.error('TCP SIP Socket error:', err);
                this.emit('error', err);
                reject(err);
            });
            
            this.socket.on('close', () => {
                console.log('TCP SIP connection closed');
                this.registered = false;
                this.emit('disconnected');
            });
            
            // Connect to SIP server
            this.socket.connect(this.config.port, this.config.server);
        });
    }

    // Process incoming messages from buffer
    processBuffer() {
        // SIP messages are separated by double CRLF
        const messages = this.messageBuffer.split('\r\n\r\n');
        
        // Keep incomplete message in buffer
        this.messageBuffer = messages.pop() || '';
        
        // Process complete messages
        for (const msg of messages) {
            if (msg.trim()) {
                this.handleMessage(msg + '\r\n\r\n');
            }
        }
    }

    // Handle incoming SIP messages
    handleMessage(msg) {
        const msgStr = msg.toString();
        const firstLine = msgStr.split('\r\n')[0];
        
        console.log(`Received TCP SIP message: ${firstLine}`);
        
        const response = this.parseResponse(msgStr);
        
        if (response && response.statusCode) {
            console.log(`Response: ${response.statusCode} ${response.statusText}`);
            
            // Handle registration response
            if (response.headers.cseq?.includes('REGISTER')) {
                if (response.statusCode === 200) {
                    console.log('✅ SIP TCP Registration successful!');
                    this.registered = true;
                    this.emit('registered');
                } else if (response.statusCode === 401) {
                    // Need authentication
                    this.sendAuthenticatedRegister(response);
                }
            }
            
            // Handle INVITE response
            if (response.headers.cseq?.includes('INVITE')) {
                const callId = response.headers['call-id'];
                
                if (response.statusCode === 100) {
                    this.emit('call-trying', { callId });
                } else if (response.statusCode >= 180 && response.statusCode < 200) {
                    this.emit('call-ringing', { callId });
                } else if (response.statusCode === 200) {
                    this.emit('call-answered', { callId });
                    this.sendAck(response);
                } else if (response.statusCode >= 400) {
                    this.emit('call-failed', { callId, reason: response.statusText });
                }
            }
        }
    }

    // Parse SIP response
    parseResponse(msg) {
        const lines = msg.split('\r\n');
        const firstLine = lines[0];
        
        if (!firstLine.startsWith('SIP/2.0')) {
            return null;
        }
        
        const [, statusCode, ...statusTextParts] = firstLine.split(' ');
        const headers = {};
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) break;
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).toLowerCase().trim();
                const value = line.substring(colonIndex + 1).trim();
                headers[key] = value;
            }
        }
        
        return {
            statusCode: parseInt(statusCode),
            statusText: statusTextParts.join(' '),
            headers
        };
    }

    // Send message via TCP
    sendMessage(message) {
        if (this.socket && this.socket.writable) {
            console.log('Sending TCP SIP message:', message.split('\r\n')[0]);
            this.socket.write(message);
        } else {
            console.error('TCP socket not connected');
        }
    }

    // Register with SIP server
    async register() {
        const branch = this.generateBranch();
        const message = [
            `REGISTER sip:${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/TCP ${this.getLocalIP()}:${this.socket.localPort};branch=${branch};rport`,
            `From: <sip:${this.config.username}@${this.config.domain}>;tag=${this.tag}`,
            `To: <sip:${this.config.username}@${this.config.domain}>`,
            `Call-ID: ${this.callId}`,
            `CSeq: ${this.cseq++} REGISTER`,
            `Contact: <sip:${this.config.username}@${this.getLocalIP()}:${this.socket.localPort};transport=tcp>`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Allow: INVITE, ACK, OPTIONS, CANCEL, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO`,
            `Expires: ${this.config.expires}`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(message);
        
        // Wait for response
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Registration timeout'));
            }, 30000);
            
            this.once('registered', () => {
                clearTimeout(timeout);
                resolve();
            });
            
            this.once('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    // Send authenticated REGISTER
    sendAuthenticatedRegister(challengeResponse) {
        const authHeader = this.createAuthHeader(
            'REGISTER',
            `sip:${this.config.domain}`,
            challengeResponse.headers['www-authenticate']
        );
        
        const branch = this.generateBranch();
        const message = [
            `REGISTER sip:${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/TCP ${this.getLocalIP()}:${this.socket.localPort};branch=${branch};rport`,
            `From: <sip:${this.config.username}@${this.config.domain}>;tag=${this.tag}`,
            `To: <sip:${this.config.username}@${this.config.domain}>`,
            `Call-ID: ${this.callId}`,
            `CSeq: ${this.cseq++} REGISTER`,
            `Contact: <sip:${this.config.username}@${this.getLocalIP()}:${this.socket.localPort};transport=tcp>`,
            `Authorization: ${authHeader}`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Allow: INVITE, ACK, OPTIONS, CANCEL, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO`,
            `Expires: ${this.config.expires}`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(message);
    }

    // Make a call
    async makeCall(phoneNumber, options = {}) {
        const callId = this.generateCallId();
        const fromTag = this.generateTag();
        const branch = this.generateBranch();
        
        const message = [
            `INVITE sip:${phoneNumber}@${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/TCP ${this.getLocalIP()}:${this.socket.localPort};branch=${branch};rport`,
            `From: <sip:${this.config.username}@${this.config.domain}>;tag=${fromTag}`,
            `To: <sip:${phoneNumber}@${this.config.domain}>`,
            `Call-ID: ${callId}`,
            `CSeq: ${this.cseq++} INVITE`,
            `Contact: <sip:${this.config.username}@${this.getLocalIP()}:${this.socket.localPort};transport=tcp>`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Allow: INVITE, ACK, OPTIONS, CANCEL, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO`,
            'Content-Type: application/sdp',
            `Content-Length: 0`, // Simplified - no SDP for now
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(message);
        
        this.activeCalls.set(callId, {
            phoneNumber,
            status: 'calling',
            startTime: new Date()
        });
        
        // Wait for response
        return new Promise((resolve) => {
            setTimeout(() => {
                const call = this.activeCalls.get(callId);
                if (call && call.status === 'calling') {
                    resolve({ callId, status: 'timeout', reason: 'No response from server' });
                } else {
                    resolve({ callId, status: call?.status || 'unknown' });
                }
            }, 30000);
        });
    }

    // Send ACK
    sendAck(response) {
        const branch = this.generateBranch();
        const message = [
            `ACK ${response.headers.contact || `sip:${this.config.domain}`} SIP/2.0`,
            `Via: SIP/2.0/TCP ${this.getLocalIP()}:${this.socket.localPort};branch=${branch};rport`,
            response.headers.from,
            response.headers.to,
            `Call-ID: ${response.headers['call-id']}`,
            `CSeq: ${response.headers.cseq.split(' ')[0]} ACK`,
            `Max-Forwards: 70`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(message);
    }

    // Create authentication header
    createAuthHeader(method, uri, authChallenge) {
        if (!authChallenge) return '';
        
        const challenge = this.parseAuthChallenge(authChallenge);
        const ha1 = crypto.createHash('md5')
            .update(`${this.config.username}:${challenge.realm}:${this.config.password}`)
            .digest('hex');
        const ha2 = crypto.createHash('md5')
            .update(`${method}:${uri}`)
            .digest('hex');
        const response = crypto.createHash('md5')
            .update(`${ha1}:${challenge.nonce}:${ha2}`)
            .digest('hex');
        
        return `Digest username="${this.config.username}",realm="${challenge.realm}",nonce="${challenge.nonce}",uri="${uri}",response="${response}",algorithm=MD5`;
    }

    // Parse authentication challenge
    parseAuthChallenge(challenge) {
        const result = {};
        const regex = /(\w+)="([^"]+)"/g;
        let match;
        
        while ((match = regex.exec(challenge)) !== null) {
            result[match[1]] = match[2];
        }
        
        return result;
    }

    // Helper methods
    generateCallId() {
        return crypto.randomBytes(16).toString('hex') + '@' + this.getLocalIP();
    }

    generateTag() {
        return crypto.randomBytes(8).toString('hex');
    }

    generateBranch() {
        return 'z9hG4bK' + crypto.randomBytes(8).toString('hex');
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

    // Cleanup
    close() {
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
        this.registered = false;
    }
}

module.exports = SIPTCPBackend;