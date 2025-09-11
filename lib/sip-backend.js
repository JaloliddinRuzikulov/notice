/**
 * SIP Backend Client
 * Handles SIP operations for the notification system
 * Uses direct SIP protocol implementation for reliability
 */

const dgram = require('dgram');
const crypto = require('crypto');
const EventEmitter = require('events');
const SimpleRTPStream = require('./simple-rtp-stream');
const path = require('path');
const fs = require('fs');

// Call logs file
const callLogsFile = path.join(__dirname, '../data/call-logs.json');

class SIPBackend extends EventEmitter {
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
        this.registrationTimer = null;
        this.callId = this.generateCallId();
        this.tag = this.generateTag();
        this.cseq = 1;
        this.activeCalls = new Map();
        this.pendingRequests = new Map();
        this.rtpPorts = new Map(); // Map to store RTP ports for each call
        // Use global RTP port tracking to avoid conflicts between instances
        if (!global.usedRTPPorts) {
            global.usedRTPPorts = new Set(); // Track used RTP ports globally
        }
        this.usedPorts = global.usedRTPPorts; // Reference to global used ports
        // Assign different port ranges based on instance ID to avoid conflicts
        const instanceNum = parseInt(config.instanceId) || 0;
        this.rtpPortMin = 10000 + (instanceNum * 2000); // Each instance gets 2000 ports
        this.rtpPortMax = this.rtpPortMin + 1998; // Keep range within limits
        this.keepAliveInterval = null;
        this.rtpStream = new SimpleRTPStream();
    }

    // Initialize and bind socket
    async initialize() {
        return new Promise((resolve, reject) => {
            this.socket = dgram.createSocket('udp4');
            
            this.socket.on('message', this.handleMessage.bind(this));
            this.socket.on('error', (err) => {
                console.error('SIP Socket error:', err);
                this.emit('error', err);
            });
            
            this.socket.bind(0, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`SIP Backend initialized on ${this.getLocalIP()}:${this.socket.address().port}`);
                    resolve();
                }
            });
        });
    }

    // Handle incoming SIP messages
    handleMessage(msg, rinfo) {
        const msgStr = msg.toString();
        const firstLine = msgStr.split('\r\n')[0];
        
        console.log(`Received SIP message from ${rinfo.address}:${rinfo.port}`);
        console.log('First line:', firstLine);
        console.log('Full message:', msgStr.substring(0, 500));
        
        // Check if this is an INFO request
        if (firstLine.startsWith('INFO ')) {
            console.log('🔔 INFO REQUEST DETECTED IN handleMessage!');
            console.log('Full INFO message:');
            console.log(msgStr);
            console.log('--- END OF INFO MESSAGE ---');
        }
        
        const response = this.parseResponse(msg);
        
        // If response is null (it was a request), return early
        if (response === null) {
            return;
        }
        
        // If parsing failed, return
        if (!response || !response.statusCode) {
            console.log('Failed to parse response or not a response message');
            return;
        }
        
        console.log(`Response: ${response.statusCode} ${response.statusText}`);
        
        // Find matching request
        const callIdMatch = response.headers['call-id'];
        const cseqMatch = response.headers.cseq;
        
        if (callIdMatch && this.pendingRequests.has(callIdMatch)) {
            const handler = this.pendingRequests.get(callIdMatch);
            handler(response);
            
            // Clean up if final response (but not 401 auth challenge)
            if (response.statusCode >= 200 && response.statusCode !== 401 && response.statusCode !== 407) {
                this.pendingRequests.delete(callIdMatch);
            }
        }
        
        // Emit events for monitoring
        this.emit('message', response);
    }

    // Register with SIP server
    async register() {
        return new Promise((resolve, reject) => {
            const registerCallId = this.callId;
            let authAttempt = 0;
            
            const handleRegisterResponse = (response) => {
                if (response.statusCode === 401 && authAttempt === 0) {
                    authAttempt++;
                    
                    // Send authenticated REGISTER
                    const authHeader = this.createAuthHeader(
                        'REGISTER',
                        `sip:${this.config.domain}`,
                        response.headers['www-authenticate']
                    );
                    
                    const authMessage = this.createRegisterMessage(authHeader);
                    this.sendMessage(authMessage);
                    
                } else if (response.statusCode === 200) {
                    this.registered = true;
                    console.log('SIP Backend Registration successful!');
                    this.emit('registered');
                    
                    // Schedule re-registration
                    this.scheduleReRegistration();
                    
                    resolve(true);
                } else {
                    this.registered = false;
                    reject(new Error(`Registration failed: ${response.statusCode} ${response.statusText}`));
                }
            };
            
            // Register handler
            this.pendingRequests.set(registerCallId, handleRegisterResponse);
            
            // Send initial REGISTER
            const message = this.createRegisterMessage();
            console.log('Sending REGISTER:', message);
            this.sendMessage(message);
            
            // Timeout
            setTimeout(() => {
                if (this.pendingRequests.has(registerCallId)) {
                    this.pendingRequests.delete(registerCallId);
                    reject(new Error('Registration timeout'));
                }
            }, 10000);
        });
    }

    // Schedule re-registration before expiry
    scheduleReRegistration() {
        if (this.registrationTimer) {
            clearTimeout(this.registrationTimer);
        }
        
        // Re-register 60 seconds before expiry
        const reRegisterIn = (this.config.expires - 60) * 1000;
        
        this.registrationTimer = setTimeout(() => {
            this.register().catch(err => {
                console.error('Re-registration failed:', err);
                this.emit('registration-failed', err);
            });
        }, reRegisterIn);
    }

    // Make outbound call (returns call ID)
    async makeCall(toNumber, options = {}) {
        // options can include audioFile for broadcast
        if (!this.registered) {
            console.log('Warning: Not registered with SIP server, trying anyway...');
            // Try anyway for testing
        }
        
        const callId = this.generateCallId();
        const fromTag = this.generateTag();
        const callStartTime = Date.now();
        
        // Store call start time
        this.callTimings = this.callTimings || new Map();
        this.callTimings.set(callId, { startTime: callStartTime });
        
        // Store initial call info with options (including audioFile for broadcasts)
        this.activeCalls.set(callId, {
            toNumber,
            fromTag,
            status: 'initiating',
            startTime: callStartTime,
            audioFile: options.audioFile,
            broadcastId: options.broadcastId,
            employeeId: options.employeeId
        });
        
        return new Promise((resolve, reject) => {
            let authAttempt = 0;
            
            const handleInviteResponse = (response) => {
                if ((response.statusCode === 407 || response.statusCode === 401) && authAttempt === 0) {
                    authAttempt++;
                    
                    // Send authenticated INVITE
                    const authHeaderName = response.statusCode === 407 ? 'proxy-authenticate' : 'www-authenticate';
                    const authHeader = this.createAuthHeader(
                        'INVITE',
                        `sip:${toNumber}@${this.config.domain}`,
                        response.headers[authHeaderName]
                    );
                    
                    const authMessage = this.createInviteMessage(toNumber, callId, fromTag, authHeader);
                    this.sendMessage(authMessage);
                    
                } else if (response.statusCode === 100) {
                    // Trying - call is being processed
                    this.emit('call-trying', { callId, toNumber });
                    
                } else if (response.statusCode === 180) {
                    // 180 Ringing - telefon jiringlayapti
                    this.emit('call-ringing', { callId, toNumber });
                    
                } else if (response.statusCode === 183) {
                    // 183 Session Progress - early media (ring tone eshitilmoqda)
                    this.emit('call-progress', { callId, toNumber });
                    
                    // Check if SDP present for early media
                    const sdpMatch = response.body?.match(/v=0[\s\S]+/);
                    if (sdpMatch) {
                        console.log('Early media SDP detected');
                        this.emit('early-media', { callId, toNumber });
                        
                        // DO NOT start RTP streaming for early media
                        const call = this.activeCalls.get(callId);
                        if (call) {
                            console.log('⚠️ Early media SDP saqlandi, lekin audio BOSHLANMAYDI!');
                            console.log('🔔 Qo\'ng\'iroq hali chalinmoqda, javob kutilmoqda...');
                            call.earlyMediaSDP = sdpMatch[0];
                            call.hasEarlyMedia = true;
                            // Audio will start only on 200 OK (real answer)
                        }
                    }
                    
                } else if (response.statusCode === 200) {
                    // 200 OK - Check if this is answer to INVITE
                    const method = response.headers.cseq?.method;
                    console.log(`200 OK received for ${method}`);
                    
                    if (method === 'INVITE') {
                        // Real call answer - gushak ko'tarildi!
                        console.log('🎉 TELEFON JAVOB BERILDI!');
                        this.emit('call-answered', { 
                            callId, 
                            toNumber, 
                            timestamp: new Date(),
                            answeredAfter: this.getCallDuration(callId) 
                        });
                    }
                    
                    // Parse SDP from response
                    const sdpMatch = response.body?.match(/v=0[\s\S]+/);
                    if (sdpMatch) {
                        console.log('Remote SDP received');
                    }
                    
                    // Store call info with timing
                    const toTag = response.headers.to?.params?.tag;
                    const remoteCallId = response.headers['call-id'] || callId;
                    
                    this.activeCalls.set(callId, {
                        toNumber,
                        fromTag,
                        toTag: toTag,
                        status: 'active',
                        answeredAt: new Date(),
                        startTime: this.callTimings.get(callId)?.startTime,
                        remoteCallId: remoteCallId,
                        lastActivity: Date.now(),
                        audioFile: options.audioFile, // Store audio file for broadcast
                        broadcastId: options.broadcastId,
                        employeeId: options.employeeId
                    });
                    
                    // Send ACK
                    this.sendACK(toNumber, callId, fromTag, toTag, response);
                    
                    // Start RTP with parsed SDP
                    this.startRTP(callId, sdpMatch ? sdpMatch[0] : null, options);
                    
                    // Start call keepalive
                    this.startCallKeepalive();
                    
                    resolve({ callId, status: 'connected' });
                    
                } else if (response.statusCode >= 400) {
                    // Call failed
                    this.emit('call-failed', { 
                        callId, 
                        toNumber, 
                        reason: response.statusText,
                        code: response.statusCode 
                    });
                    
                    resolve({ 
                        callId, 
                        status: 'failed', 
                        reason: response.statusText,
                        code: response.statusCode
                    });
                }
            };
            
            // Register handler
            this.pendingRequests.set(callId, handleInviteResponse);
            
            // Send INVITE
            const message = this.createInviteMessage(toNumber, callId, fromTag);
            this.sendMessage(message);
            
            // Store preliminary call info for early media
            this.activeCalls.set(callId, {
                toNumber,
                fromTag,
                status: 'calling',
                startTime: callStartTime,
                audioFile: options.audioFile,
                broadcastId: options.broadcastId,
                employeeId: options.employeeId
            });
            
            // Timeout
            setTimeout(() => {
                if (this.pendingRequests.has(callId)) {
                    this.pendingRequests.delete(callId);
                    resolve({ 
                        callId, 
                        status: 'timeout',
                        reason: 'No response from server'
                    });
                }
            }, 30000);
        });
    }

    // Create REGISTER message
    createRegisterMessage(auth = null) {
        this.cseq++;
        const branch = this.generateBranch();
        
        const uri = `sip:${this.config.username}@${this.config.domain}`;
        const contact = `<sip:${this.config.username}@${this.getLocalIP()}:${this.socket.address().port}>`;
        
        let headers = [
            `REGISTER sip:${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.socket.address().port};branch=${branch};rport`,
            `From: <${uri}>;tag=${this.tag}`,
            `To: <${uri}>`,
            `Call-ID: ${this.callId}`,
            `CSeq: ${this.cseq} REGISTER`,
            `Contact: ${contact}`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Allow: INVITE, ACK, OPTIONS, CANCEL, BYE, REFER, NOTIFY, MESSAGE, SUBSCRIBE, INFO`,
            `Expires: ${this.config.expires}`,
            `Content-Length: 0`
        ];

        if (auth) {
            headers.splice(6, 0, `Authorization: ${auth}`);
        }

        return headers.join('\r\n') + '\r\n\r\n';
    }

    // Create INVITE message
    createInviteMessage(toNumber, callId, fromTag, auth = null) {
        this.cseq++;
        const branch = this.generateBranch();
        
        const fromUri = `sip:${this.config.username}@${this.config.domain}`;
        const toUri = `sip:${toNumber}@${this.config.domain}`;
        const contact = `<sip:${this.config.username}@${this.getLocalIP()}:${this.socket.address().port}>`;
        
        // Generate SDP with allocated RTP port
        const rtpPort = this.rtpPorts.get(callId) || this.allocateRTPPort();
        const sdp = this.generateSDP(rtpPort);
        
        let headers = [
            `INVITE ${toUri} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.socket.address().port};branch=${branch};rport`,
            `From: <${fromUri}>;tag=${fromTag}`,
            `To: <${toUri}>`,
            `Call-ID: ${callId}`,
            `CSeq: ${this.cseq} INVITE`,
            `Contact: ${contact}`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Allow: INVITE, ACK, BYE, CANCEL, OPTIONS, INFO, UPDATE`,
            `Content-Type: application/sdp`,
            `Content-Length: ${sdp.length}`
        ];

        if (auth) {
            headers.splice(6, 0, `Authorization: ${auth}`);
        }

        return headers.join('\r\n') + '\r\n\r\n' + sdp;
    }

    // Generate SDP
    generateSDP(rtpPort) {
        const localIP = this.getLocalIP();
        // Use provided RTP port or allocate a new one
        const port = rtpPort || this.allocateRTPPort();
        return [
            'v=0',
            `o=- ${Date.now()} ${Date.now()} IN IP4 ${localIP}`,
            's=Xabarnoma',
            `c=IN IP4 ${localIP}`,
            't=0 0',
            `m=audio ${port} RTP/AVP 8 0 9 111 101`,
            'a=rtpmap:8 PCMA/8000',        // G.711 A-law (FIRST PRIORITY)
            'a=rtpmap:0 PCMU/8000',        // G.711 μ-law
            'a=rtpmap:9 G722/8000',        // G.722
            'a=rtpmap:111 opus/48000/2',   // Opus
            'a=rtpmap:101 telephone-event/8000',
            'a=fmtp:101 0-16',
            'a=fmtp:111 minptime=10;useinbandfec=1',
            'a=ptime:20',
            'a=maxptime:60',
            'a=sendrecv'
        ].join('\r\n');
    }
    
    // Allocate a free RTP port
    allocateRTPPort() {
        let port = this.rtpPortMin;
        const maxAttempts = Math.floor((this.rtpPortMax - this.rtpPortMin) / 2);
        let attempts = 0;
        
        while (port <= this.rtpPortMax && attempts < maxAttempts) {
            if (!this.usedPorts.has(port)) {
                this.usedPorts.add(port);
                console.log(`[RTP] Allocated port ${port} for instance ${this.config.instanceId || 'default'} (range: ${this.rtpPortMin}-${this.rtpPortMax})`);
                return port;
            }
            port += 2; // RTP uses even ports, RTCP uses odd
            attempts++;
        }
        
        // If no ports available, reuse from beginning (cleanup old ones)
        console.warn(`[RTP] Port pool exhausted for instance ${this.config.instanceId || 'default'}, cleaning up old ports...`);
        this.cleanupOldPorts();
        
        // Try again after cleanup
        port = this.rtpPortMin;
        while (port <= this.rtpPortMax) {
            if (!this.usedPorts.has(port)) {
                this.usedPorts.add(port);
                console.log(`[RTP] Allocated port ${port} after cleanup for instance ${this.config.instanceId || 'default'}`);
                return port;
            }
            port += 2;
        }
        
        // Fallback to a port outside the range if everything fails
        const fallbackPort = 20000 + (parseInt(this.config.instanceId) || 0) * 100;
        console.error(`[RTP] Using fallback port ${fallbackPort} for instance ${this.config.instanceId || 'default'}`);
        return fallbackPort;
    }
    
    // Free an RTP port
    freeRTPPort(port) {
        if (port) {
            this.usedPorts.delete(port);
            console.log(`[RTP] Freed port ${port} for instance ${this.config.instanceId || 'default'}`);
        }
    }
    
    // Cleanup old ports from ended calls
    cleanupOldPorts() {
        const activeCallIds = new Set(this.activeCalls.keys());
        for (const [callId, port] of this.rtpPorts) {
            if (!activeCallIds.has(callId)) {
                this.freeRTPPort(port);
                this.rtpPorts.delete(callId);
            }
        }
    }

    // Parse SIP response
    parseResponse(data) {
        const lines = data.toString().split('\r\n');
        const statusLine = lines[0];
        
        // Check if it's a response or request
        const responseMatch = statusLine.match(/SIP\/2\.0 (\d+) (.+)/);
        const requestMatch = statusLine.match(/^(\w+) .+ SIP\/2\.0/);
        
        if (!responseMatch && !requestMatch) {
            return null;
        }
        
        // Handle SIP requests (OPTIONS, NOTIFY, etc.)
        if (requestMatch) {
            const method = requestMatch[1];
            console.log(`Received SIP request: ${method}`);
            
            // Send automatic response for OPTIONS (keepalive)
            if (method === 'OPTIONS') {
                this.sendOptionsResponse(data);
                return null;
            } else if (method === 'NOTIFY') {
                this.sendNotifyResponse(data);
                return null;
            } else if (method === 'BYE') {
                this.sendByeResponse(data);
                return null;
            } else if (method === 'INVITE') {
                // Incoming call - we don't handle these, just reject
                this.sendBusyResponse(data);
                return null;
            } else if (method === 'INFO') {
                // Handle DTMF INFO messages
                console.log('=== Received INFO request (possible DTMF) ===');
                console.log('Raw data:', data.toString());
                this.handleDTMFInfo(data);
                return null;
            }
            
            // Don't process requests as responses
        }
        
        const statusMatch = responseMatch;

        const headers = {};
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line === '') break;
            
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim().toLowerCase();
                const value = line.substring(colonIndex + 1).trim();
                
                // Parse specific headers
                if (key === 'to' || key === 'from') {
                    headers[key] = this.parseNameAddr(value);
                } else if (key === 'cseq') {
                    const [seq, method] = value.split(' ');
                    headers[key] = { seq: parseInt(seq), method };
                } else {
                    headers[key] = value;
                }
            }
        }

        // Find body (after empty line)
        let body = '';
        const emptyLineIndex = lines.indexOf('');
        if (emptyLineIndex !== -1 && emptyLineIndex < lines.length - 1) {
            body = lines.slice(emptyLineIndex + 1).join('\r\n');
        }
        
        // Return parsed response
        return {
            statusCode: parseInt(statusMatch[1]),
            statusText: statusMatch[2],
            headers,
            body
        };
    }

    // Parse name-addr format (used in To/From headers)
    parseNameAddr(value) {
        const match = value.match(/<(.+?)>(.*)$/);
        if (match) {
            const uri = match[1];
            const params = {};
            
            // Parse parameters
            const paramString = match[2];
            if (paramString) {
                const paramPairs = paramString.split(';').filter(p => p);
                paramPairs.forEach(pair => {
                    const [key, val] = pair.split('=');
                    if (key) {
                        params[key.trim()] = val ? val.trim() : true;
                    }
                });
            }
            
            return { uri, params };
        }
        return { uri: value, params: {} };
    }

    // Create auth header
    createAuthHeader(method, uri, authChallenge) {
        const authParams = this.parseAuthChallenge(authChallenge);
        const digestInfo = this.calculateDigestResponse(method, uri, authParams);
        
        let authHeader = `Digest username="${this.config.username}",realm="${authParams.realm}",nonce="${authParams.nonce}",uri="${uri}",response="${digestInfo.response}"`;
        
        if (authParams.algorithm) {
            authHeader += `,algorithm=${authParams.algorithm}`;
        }
        
        if (authParams.opaque) {
            authHeader += `,opaque="${authParams.opaque}"`;
        }
        
        if (digestInfo.qop) {
            authHeader += `,qop=${digestInfo.qop},nc=${digestInfo.nc},cnonce="${digestInfo.cnonce}"`;
        }
        
        return authHeader;
    }

    // Parse auth challenge
    parseAuthChallenge(wwwAuth) {
        const params = {};
        const regex = /(\w+)=(?:"([^"]+)"|([^,\s]+))/g;
        let match;
        
        while ((match = regex.exec(wwwAuth)) !== null) {
            const key = match[1];
            const value = match[2] || match[3];
            params[key] = value;
        }
        
        return params;
    }

    // Calculate digest response
    calculateDigestResponse(method, uri, authParams) {
        const ha1 = crypto.createHash('md5')
            .update(`${this.config.username}:${authParams.realm}:${this.config.password}`)
            .digest('hex');
        
        const ha2 = crypto.createHash('md5')
            .update(`${method}:${uri}`)
            .digest('hex');
        
        let response;
        if (authParams.qop) {
            const nc = '00000001';
            const cnonce = crypto.randomBytes(8).toString('hex');
            
            response = crypto.createHash('md5')
                .update(`${ha1}:${authParams.nonce}:${nc}:${cnonce}:${authParams.qop}:${ha2}`)
                .digest('hex');
            
            return {
                response,
                nc,
                cnonce,
                qop: authParams.qop
            };
        } else {
            response = crypto.createHash('md5')
                .update(`${ha1}:${authParams.nonce}:${ha2}`)
                .digest('hex');
            
            return { response };
        }
    }

    // Send SIP message
    sendMessage(message) {
        console.log(`Sending SIP message to ${this.config.server}:${this.config.port}`);
        console.log('Message:', message.split('\r\n')[0]); // Log first line
        
        this.socket.send(
            Buffer.from(message),
            this.config.port,
            this.config.server,
            (err) => {
                if (err) {
                    console.error('Failed to send SIP message:', err);
                    this.emit('error', err);
                } else {
                    console.log('SIP message sent successfully');
                }
            }
        );
    }

    // Utility methods
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
    
    // Get call duration in seconds
    getCallDuration(callId) {
        const timing = this.callTimings?.get(callId);
        if (timing && timing.startTime) {
            return Math.round((Date.now() - timing.startTime) / 1000);
        }
        return 0;
    }
    
    // Send OPTIONS response (keepalive)
    sendOptionsResponse(request) {
        const lines = request.toString().split('\r\n');
        const headers = {};
        
        // Parse headers
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':', 2);
                headers[key.toLowerCase().trim()] = value.trim();
            }
        }
        
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers.via}`,
            `From: ${headers.from}`,
            `To: ${headers.to}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers.cseq}`,
            'Content-Length: 0',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
    }
    
    // Send NOTIFY response
    sendNotifyResponse(request) {
        const lines = request.toString().split('\r\n');
        const headers = {};
        
        // Parse headers
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':', 2);
                headers[key.toLowerCase().trim()] = value.trim();
            }
        }
        
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers.via}`,
            `From: ${headers.from}`,
            `To: ${headers.to}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers.cseq}`,
            'Content-Length: 0',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
    }
    
    // Send BYE response
    sendByeResponse(request) {
        const lines = request.toString().split('\r\n');
        const headers = {};
        
        // Parse headers
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':', 2);
                headers[key.toLowerCase().trim()] = value.trim();
            }
        }
        
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers.via}`,
            `From: ${headers.from}`,
            `To: ${headers.to}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers.cseq}`,
            'Content-Length: 0',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
        
        // Emit call ended event
        const callId = headers['call-id'];
        if (callId) {
            // Check if this is our active call
            let callFound = false;
            for (const [activeCallId, call] of this.activeCalls) {
                if (activeCallId === callId || call.remoteCallId === callId) {
                    console.log('BYE received - Remote party hung up');
                    
                    // Clean up call data to avoid circular references
                    const cleanCall = {
                        toNumber: call.toNumber,
                        fromTag: call.fromTag,
                        toTag: call.toTag,
                        status: call.status,
                        answeredAt: call.answeredAt,
                        startTime: call.startTime,
                        audioFile: call.audioFile
                    };
                    
                    // Stop RTP if active
                    if (call.rtpInterval) {
                        clearInterval(call.rtpInterval);
                    }
                    if (call.rtpSocket && call.rtpSocket.readyState === 'open') {
                        try {
                            call.rtpSocket.close();
                        } catch (err) {
                            console.log('RTP socket already closed');
                        }
                    }
                    
                    // Free RTP port
                    const rtpPort = this.rtpPorts.get(activeCallId);
                    if (rtpPort) {
                        this.freeRTPPort(rtpPort);
                        this.rtpPorts.delete(activeCallId);
                    }
                    
                    this.emit('remote-hangup', { 
                        callId: activeCallId, 
                        reason: 'Remote party ended call',
                        ...cleanCall 
                    });
                    this.emit('call-ended', { callId: activeCallId, ...cleanCall });
                    this.activeCalls.delete(activeCallId);
                    callFound = true;
                    break;
                }
            }
            
            if (!callFound) {
                console.log('BYE received for unknown call:', callId);
            }
        }
    }

    // Handle DTMF INFO messages
    handleDTMFInfo(data) {
        console.log('=== Processing DTMF INFO message ===');
        const lines = data.toString().split('\r\n');
        const headers = {};
        
        // Parse headers
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':', 2);
                headers[key.toLowerCase().trim()] = value.trim();
            }
        }
        
        // Find body (DTMF info)
        const emptyLineIndex = lines.indexOf('');
        let body = '';
        if (emptyLineIndex !== -1 && emptyLineIndex < lines.length - 1) {
            body = lines.slice(emptyLineIndex + 1).join('\r\n');
        }
        
        console.log('INFO Headers:', headers);
        console.log('INFO Body:', body);
        
        // Extract DTMF digit from body - check multiple formats
        let dtmfDigit = null;
        
        // Format 1: application/dtmf-relay with Signal=X
        if (body.includes('application/dtmf-relay') || body.includes('dtmf-relay')) {
            const signalMatch = body.match(/Signal=(\d+)/);
            if (signalMatch) {
                dtmfDigit = signalMatch[1];
                console.log('Found DTMF in dtmf-relay format:', dtmfDigit);
            }
        }
        
        // Format 2: application/dtmf with digit
        if (!dtmfDigit && body.includes('application/dtmf')) {
            const digitMatch = body.match(/(\d)/);
            if (digitMatch) {
                dtmfDigit = digitMatch[1];
                console.log('Found DTMF in dtmf format:', dtmfDigit);
            }
        }
        
        // Format 3: Plain text digit
        if (!dtmfDigit && headers['content-type'] && headers['content-type'].includes('text/plain')) {
            const digitMatch = body.match(/(\d)/);
            if (digitMatch) {
                dtmfDigit = digitMatch[1];
                console.log('Found DTMF in plain text format:', dtmfDigit);
            }
        }
        
        // Send 200 OK response to INFO
        const response = [
            'SIP/2.0 200 OK',
            `Via: ${headers.via}`,
            `From: ${headers.from}`,
            `To: ${headers.to}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers.cseq}`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
        
        // Process DTMF digit
        if (dtmfDigit) {
            console.log(`🎯 DTMF digit received: ${dtmfDigit}`);
            console.log('Call-ID:', headers['call-id']);
            console.log('From:', headers.from);
            console.log('To:', headers.to);
            
            // Check if digit is '1' for broadcast confirmation
            if (dtmfDigit === '1') {
                const callId = headers['call-id'];
                const call = this.findCallByRemoteCallId(callId);
                
                if (call) {
                    console.log(`🎉 Broadcast confirmed by pressing 1! Call: ${call.callId}`);
                    console.log(`Employee: ${call.employeeId}, Phone: ${call.toNumber}`);
                    console.log('Active call details:', call);
                    
                    // Emit broadcast confirmation event
                    this.emit('broadcast-confirmed', {
                        callId: call.callId,
                        phoneNumber: call.toNumber,
                        broadcastId: call.broadcastId,
                        employeeId: call.employeeId,
                        timestamp: new Date(),
                        dtmfDigit: dtmfDigit
                    });
                    
                    // Also emit specific event for this phone number
                    this.emit(`broadcast-confirmed-${call.toNumber}`, {
                        broadcastId: call.broadcastId,
                        employeeId: call.employeeId
                    });
                    
                    // End the call immediately after confirmation
                    console.log('📞 Ending call immediately after confirmation');
                    this.hangupCall(call.callId);
                }
            }
        }
    }
    
    // Find call by remote call ID
    findCallByRemoteCallId(remoteCallId) {
        for (const [callId, call] of this.activeCalls) {
            if (call.remoteCallId === remoteCallId || callId === remoteCallId) {
                return { callId, ...call };
            }
        }
        return null;
    }

    // Send busy response for incoming INVITE
    sendBusyResponse(requestData) {
        const lines = requestData.toString().split('\r\n');
        const headers = {};
        
        // Parse headers
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':', 2);
                headers[key.toLowerCase().trim()] = value.trim();
            }
        }
        
        const response = [
            'SIP/2.0 486 Busy Here',
            `Via: ${headers.via}`,
            `From: ${headers.from}`,
            `To: ${headers.to}`,
            `Call-ID: ${headers['call-id']}`,
            `CSeq: ${headers.cseq}`,
            'Content-Length: 0',
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(response);
    }

    // Send ACK message
    sendACK(toNumber, callId, fromTag, toTag, response) {
        const branch = this.generateBranch();
        const fromUri = `sip:${this.config.username}@${this.config.domain}`;
        const toUri = `sip:${toNumber}@${this.config.domain}`;
        const contact = `<sip:${this.config.username}@${this.getLocalIP()}:${this.socket.address().port}>`;
        
        // Get CSeq from response
        const cseq = response.headers.cseq ? response.headers.cseq.seq : this.cseq;
        
        const ackMessage = [
            `ACK sip:${toNumber}@${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.socket.address().port};branch=${branch};rport`,
            `From: <${fromUri}>;tag=${fromTag}`,
            `To: <${toUri}>;tag=${toTag}`,
            `Call-ID: ${callId}`,
            `CSeq: ${cseq} ACK`,
            `Contact: ${contact}`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Content-Length: 0`,
            '',
            ''
        ].join('\r\n');
        
        console.log('Sending ACK for call:', callId);
        this.sendMessage(ackMessage);
    }
    
    // Start RTP audio stream
    startRTP(callId, remoteSDP, options = {}) {
        const call = this.activeCalls.get(callId);
        if (!call) {
            console.error('Call not found:', callId);
            return;
        }
        
        console.log('Starting RTP for call:', callId);
        console.log('Remote SDP:', remoteSDP ? 'Present' : 'Not present');
        console.log('⏱️ 2 soniya kutilmoqda audio boshlashdan oldin...');
        
        // Parse remote SDP to get RTP port and codecs
        if (remoteSDP) {
            const lines = remoteSDP.split('\r\n');
            let remoteRTPPort = null;
            let remoteIP = null;
            
            lines.forEach(line => {
                // Get connection IP
                if (line.startsWith('c=IN IP4 ')) {
                    remoteIP = line.substring(9);
                    console.log('Found remote IP:', remoteIP);
                }
                // Get audio port
                if (line.startsWith('m=audio ')) {
                    const parts = line.split(' ');
                    remoteRTPPort = parseInt(parts[1]);
                    console.log('Found remote RTP port:', remoteRTPPort);
                }
            });
            
            if (remoteIP && remoteRTPPort) {
                console.log(`Remote RTP endpoint: ${remoteIP}:${remoteRTPPort}`);
                call.rtpEndpoint = { ip: remoteIP, port: remoteRTPPort };
                
                // Allocate RTP port for this call before creating socket
                const rtpPort = this.allocateRTPPort();
                this.rtpPorts.set(callId, rtpPort);
                call.localRTPPort = rtpPort;
                
                // Create RTP socket for audio
                this.createRTPSocket(callId, call, options);
            } else {
                console.log('Could not parse RTP endpoint from SDP');
            }
        } else {
            console.log('No SDP in response');
        }
    }
    
    // Create RTP socket for audio streaming
    async createRTPSocket(callId, call, options = {}) {
        // Check if we're only sending audio (broadcast mode)
        const isBroadcastOnly = options.audioFile || call.audioFile;
        
        if (isBroadcastOnly) {
            console.log(`Broadcast mode for call ${callId} - setting up RTP with DTMF detection`);
            
            // Create RTP socket for receiving DTMF even in broadcast mode
            const rtpSocket = dgram.createSocket('udp4');
            
            // Allocate dynamic RTP port for this call
            const rtpPort = this.allocateRTPPort();
            this.rtpPorts.set(callId, rtpPort);
            
            rtpSocket.bind(rtpPort, async () => {
                const localPort = rtpSocket.address().port;
                console.log(`RTP socket bound to port ${localPort} for DTMF detection`);
                call.rtpSocket = rtpSocket;
                
                // Handle incoming RTP packets (DTMF detection)
                rtpSocket.on('message', (msg, rinfo) => {
                    if (msg.length > 12) {
                        const payloadType = msg[1] & 0x7F;
                        
                        // Check for DTMF payload type (RFC 4733 - usually 101)
                        if (payloadType === 101 || payloadType === 96 || payloadType === 97 || payloadType === 98) {
                            const dtmfPayload = msg.slice(12);
                            if (dtmfPayload.length >= 4) {
                                const event = dtmfPayload[0];
                                const endBit = (dtmfPayload[1] & 0x80) !== 0;
                                const volume = dtmfPayload[1] & 0x3F;
                                const duration = (dtmfPayload[2] << 8) | dtmfPayload[3];
                                
                                // Only process on end bit to avoid duplicates
                                if (endBit) {
                                    // Convert event to digit
                                    const digit = event <= 9 ? event.toString() :
                                                 event === 10 ? '*' :
                                                 event === 11 ? '#' : '?';
                                    
                                    console.log(`📞 RFC 4733 DTMF detected: ${digit} (duration: ${duration}ms)`);
                                    
                                    // Emit general DTMF event
                                    this.emit('dtmf', {
                                        callId,
                                        digit,
                                        event,
                                        duration,
                                        method: 'rfc4733',
                                        timestamp: new Date()
                                    });
                                    
                                    // Special handling for digit 1
                                    if (digit === '1') {
                                        console.log('✅ DTMF 1 tugmasi bosildi! Tasdiqlandi!');
                                        this.emit('dtmf-received', {
                                            callId,
                                            digit: '1',
                                            timestamp: new Date()
                                        });
                                        
                                        // Update broadcast confirmation
                                        this.emit('broadcast-confirmed', {
                                            callId,
                                            phoneNumber: call.toNumber,
                                            broadcastId: call.broadcastId,
                                            employeeId: call.employeeId,
                                            timestamp: new Date(),
                                            dtmfDigit: '1',
                                            method: 'rfc4733'
                                        });
                                        
                                        // Auto-hangup after confirmation
                                        console.log('📞 Ending call after DTMF confirmation');
                                        setTimeout(() => {
                                            this.hangupCall(callId);
                                        }, 1000);
                                    }
                                }
                            }
                        }
                    }
                });
                
                // Stream audio
                const audioFile = options.audioFile || call.audioFile;
                if (audioFile) {
                    console.log(`Starting audio stream for ${audioFile}`);
                    
                    // 2 soniya kutish
                    const delay = 2000; // 2 soniya
                    console.log(`⏱️  Waiting ${delay}ms (2 soniya) before playing audio...`);
                    
                    setTimeout(async () => {
                        console.log('Starting audio playback after delay...');
                        
                        // Set callback to end call when audio finishes
                        this.rtpStream.onPlaybackComplete = (finishedCallId) => {
                            console.log(`Audio playback complete for call ${finishedCallId}, ending call...`);
                            setTimeout(() => {
                                this.endCall(finishedCallId);
                            }, 1000); // 1 second delay after audio ends
                        };
                        
                        const success = await this.rtpStream.streamAudio(
                            audioFile,
                            call.rtpEndpoint.ip,
                            call.rtpEndpoint.port,
                            localPort, // Use dynamically allocated port
                            callId,
                            { repeat: 3 } // 3 marta takrorlash
                        );
                        
                        if (!success) {
                            console.error('Failed to start audio stream');
                            this.emit('audio-stream-failed', { callId });
                        }
                        
                        // Safety timeout - end call after 60 seconds (audio should be done by then)
                        // 2.5s delay + ~15s audio * 3 repetitions = ~50s total
                        setTimeout(() => {
                            if (this.activeCalls.has(callId)) {
                                console.log(`Safety timeout: ending call ${callId}`);
                                this.endCall(callId);
                            }
                        }, 60000);
                    }, delay);
                }
            });
            
            return;
        }
        
        // For bidirectional calls, create RTP socket
        const rtpSocket = dgram.createSocket('udp4');
        
        // Use dynamically allocated port to avoid conflicts
        const rtpPort = this.rtpPorts.get(callId) || this.allocateRTPPort();
        rtpSocket.bind(rtpPort, async () => {
            console.log(`RTP socket bound to port ${rtpPort} for call ${callId}`);
            call.rtpSocket = rtpSocket;
            
            // Handle incoming RTP packets
            rtpSocket.on('message', (msg, rinfo) => {
                // Process incoming audio
                if (!call.rtpReceiving) {
                    console.log(`Receiving RTP audio from ${rinfo.address}:${rinfo.port}`);
                    call.rtpReceiving = true;
                    this.emit('audio-started', { callId });
                }
                
                // Analyze RTP packet for voice activity
                if (msg.length > 12) { // RTP header is 12 bytes
                    const rtpHeader = msg.slice(0, 12);
                    const payload = msg.slice(12);
                    
                    // Check payload for non-silence (basic voice activity detection)
                    let hasVoice = false;
                    let voiceLevel = 0;
                    
                    for (let i = 0; i < Math.min(payload.length, 50); i++) {
                        // In PCMU/PCMA, values far from 0xFF/0x7F indicate voice
                        const deviation = Math.max(
                            Math.abs(payload[i] - 0xFF),
                            Math.abs(payload[i] - 0x7F),
                            Math.abs(payload[i] - 0x00)
                        );
                        voiceLevel = Math.max(voiceLevel, deviation);
                        
                        if (deviation > 20) {
                            hasVoice = true;
                        }
                    }
                    
                    // If this is first time receiving real audio (not just comfort noise)
                    if (!call.realAudioDetected && payload.length > 100) {
                        call.realAudioDetected = true;
                        console.log('📞 HAQIQIY AUDIO KELMOQDA - Qo\'ng\'iroq ulandi!');
                        this.emit('real-audio-detected', { 
                            callId, 
                            timestamp: new Date()
                        });
                    }
                    
                    if (hasVoice && !call.voiceDetected) {
                        call.voiceDetected = true;
                        console.log('🎤 OVOZ ANIQLANDI - Suhbat boshlandi!');
                        this.emit('voice-detected', { 
                            callId, 
                            timestamp: new Date(),
                            afterSeconds: this.getCallDuration(callId),
                            voiceLevel: voiceLevel
                        });
                    }
                }
            });
            
            rtpSocket.on('error', (err) => {
                console.error('RTP socket error:', err);
            });
            
            // For bidirectional calls, just send keepalive
            this.startRTPKeepalive(callId, call);
        });
    }
    
    // Send RTP keepalive packets
    startRTPKeepalive(callId, call) {
        if (!call.rtpEndpoint || !call.rtpSocket) return;
        
        // Send silence/comfort noise packets every 20ms
        call.rtpInterval = setInterval(() => {
            // RTP header (12 bytes)
            const rtpHeader = Buffer.alloc(12);
            rtpHeader[0] = 0x80; // Version 2, no padding, no extension, no CSRC
            rtpHeader[1] = 0x00; // Payload type 0 (PCMU), no marker
            
            // Sequence number (increments)
            if (!call.rtpSeq) call.rtpSeq = Math.floor(Math.random() * 65535);
            call.rtpSeq = (call.rtpSeq + 1) & 0xFFFF;
            rtpHeader.writeUInt16BE(call.rtpSeq, 2);
            
            // Timestamp (increments by 160 for 20ms @ 8kHz)
            if (!call.rtpTimestamp) call.rtpTimestamp = Math.floor(Math.random() * 0x7FFFFFFF); // Use smaller range to avoid negative
            call.rtpTimestamp = (call.rtpTimestamp + 160) % 0xFFFFFFFF; // Use modulo instead of bitwise AND
            rtpHeader.writeUInt32BE(call.rtpTimestamp >>> 0, 4); // Force unsigned
            
            // SSRC (random, but consistent for the call)
            if (!call.rtpSSRC) call.rtpSSRC = Math.floor(Math.random() * 0x7FFFFFFF);
            rtpHeader.writeUInt32BE(call.rtpSSRC >>> 0, 8);
            
            // Payload: 160 bytes of silence (PCMU encoded)
            const payload = Buffer.alloc(160, 0xFF); // 0xFF is silence in PCMU
            
            const rtpPacket = Buffer.concat([rtpHeader, payload]);
            
            // Send to remote endpoint
            call.rtpSocket.send(rtpPacket, call.rtpEndpoint.port, call.rtpEndpoint.ip, (err) => {
                if (err && !call.rtpError) {
                    console.error('RTP send error:', err);
                    call.rtpError = true;
                }
            });
        }, 20); // Send every 20ms
        
        console.log(`RTP keepalive started for call ${callId}`);
    }
    
    // Stream audio file via RTP
    startRTPAudioStream(callId, call, audioFile) {
        if (!call.rtpEndpoint || !call.rtpSocket) return;
        
        console.log(`Starting audio stream for call ${callId}, file: ${audioFile}`);
        
        // Build full path to audio file
        const audioPath = path.join(__dirname, '../public/audio/uploads', audioFile);
        
        // Initialize RTP parameters
        if (!call.rtpSeq) call.rtpSeq = Math.floor(Math.random() * 65535);
        if (!call.rtpTimestamp) call.rtpTimestamp = Math.floor(Math.random() * 0xFFFFFFFF);
        if (!call.rtpSSRC) call.rtpSSRC = Math.floor(Math.random() * 0xFFFFFFFF);
        
        // Create RTP stream from audio file
        this.audioStream.createRTPStream(audioPath, (rtpPacket) => {
            // Send RTP packet to remote endpoint
            call.rtpSocket.send(rtpPacket, call.rtpEndpoint.port, call.rtpEndpoint.ip, (err) => {
                if (err && !call.rtpError) {
                    console.error('RTP audio send error:', err);
                    call.rtpError = true;
                }
            });
        }, {
            ssrc: call.rtpSSRC,
            initialSeq: call.rtpSeq,
            initialTimestamp: call.rtpTimestamp,
            loop: true, // Loop the audio for broadcast
            onError: (error) => {
                console.error('Audio streaming error:', error);
                // Fallback to silence if audio fails
                this.startRTPKeepalive(callId, call);
            },
            onEnd: () => {
                console.log('Audio playback completed for call:', callId);
            }
        });
        
        console.log(`Audio streaming started for call ${callId}`);
    }
    
    // Hangup call (alias for endCall)
    hangupCall(callId) {
        return this.endCall(callId);
    }
    
    // End call (update to include RTP cleanup)
    endCall(callId) {
        const call = this.activeCalls.get(callId);
        if (!call) return;
        
        // Stop RTP
        if (call.rtpInterval) {
            clearInterval(call.rtpInterval);
        }
        
        if (call.rtpSocket && call.rtpSocket.readyState === 'open') {
            try {
                call.rtpSocket.close();
            } catch (err) {
                console.log('RTP socket already closed');
            }
        }
        
        // Send BYE if call is active
        if (call.status === 'active') {
            this.sendBYE(call.toNumber, callId, call.fromTag, call.toTag);
        }
        
        this.activeCalls.delete(callId);
        this.emit('call-ended', { callId });
    }
    
    // Send BYE message
    sendBYE(toNumber, callId, fromTag, toTag) {
        this.cseq++;
        const branch = this.generateBranch();
        const fromUri = `sip:${this.config.username}@${this.config.domain}`;
        const toUri = `sip:${toNumber}@${this.config.domain}`;
        const contact = `<sip:${this.config.username}@${this.getLocalIP()}:${this.socket.address().port}>`;
        
        const byeMessage = [
            `BYE sip:${toNumber}@${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.socket.address().port};branch=${branch};rport`,
            `From: <${fromUri}>;tag=${fromTag}`,
            `To: <${toUri}>;tag=${toTag}`,
            `Call-ID: ${callId}`,
            `CSeq: ${this.cseq} BYE`,
            `Contact: ${contact}`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Content-Length: 0`,
            '',
            ''
        ].join('\r\n');
        
        console.log('Sending BYE for call:', callId);
        this.sendMessage(byeMessage);
    }
    
    // Send keepalive to maintain call
    sendKeepAlive(callId) {
        const call = this.activeCalls.get(callId);
        if (!call || call.status !== 'active') return;
        
        // Send OPTIONS or re-INVITE to keep NAT/firewall open
        this.cseq++;
        const branch = this.generateBranch();
        const fromUri = `sip:${this.config.username}@${this.config.domain}`;
        const toUri = `sip:${call.toNumber}@${this.config.domain}`;
        
        const optionsMessage = [
            `OPTIONS sip:${call.toNumber}@${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.socket.address().port};branch=${branch};rport`,
            `From: <${fromUri}>;tag=${call.fromTag}`,
            `To: <${toUri}>;tag=${call.toTag}`,
            `Call-ID: ${callId}`,
            `CSeq: ${this.cseq} OPTIONS`,
            `Contact: <sip:${this.config.username}@${this.getLocalIP()}:${this.socket.address().port}>`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Content-Length: 0`,
            '',
            ''
        ].join('\r\n');
        
        this.sendMessage(optionsMessage);
        console.log(`Keepalive sent for call ${callId}`);
    }
    
    // Start call keepalive
    startCallKeepalive() {
        // Stop existing keepalive
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        
        // Send UPDATE or re-INVITE every 30 seconds to keep call alive
        this.keepAliveInterval = setInterval(() => {
            this.activeCalls.forEach((call, callId) => {
                if (call.status === 'active') {
                    const timeSinceActivity = Date.now() - call.lastActivity;
                    
                    // If no activity for 25 seconds, send keepalive
                    if (timeSinceActivity > 25000) {
                        console.log(`Sending keepalive for call ${callId}`);
                        this.sendUpdate(call.toNumber, callId, call.fromTag, call.toTag);
                        call.lastActivity = Date.now();
                    }
                }
            });
        }, 10000); // Check every 10 seconds
    }
    
    // Send UPDATE message to keep call alive
    sendUpdate(toNumber, callId, fromTag, toTag) {
        this.cseq++;
        const branch = this.generateBranch();
        const fromUri = `sip:${this.config.username}@${this.config.domain}`;
        const toUri = `sip:${toNumber}@${this.config.domain}`;
        const contact = `<sip:${this.config.username}@${this.getLocalIP()}:${this.socket.address().port}>`;
        
        const updateMessage = [
            `UPDATE sip:${toNumber}@${this.config.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.socket.address().port};branch=${branch};rport`,
            `From: <${fromUri}>;tag=${fromTag}`,
            `To: <${toUri}>;tag=${toTag}`,
            `Call-ID: ${callId}`,
            `CSeq: ${this.cseq} UPDATE`,
            `Contact: ${contact}`,
            `Max-Forwards: 70`,
            `User-Agent: ${this.config.userAgent}`,
            `Content-Length: 0`,
            '',
            ''
        ].join('\r\n');
        
        console.log('Sending UPDATE for keepalive');
        this.sendMessage(updateMessage);
    }
    
    // Cleanup method
    destroy() {
        console.log('[SIPBackend] Destroying instance...');
        
        // Clear all timeouts and intervals
        if (this.registrationTimer) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = null;
        }
        
        // Free all RTP ports
        for (const [callId, port] of this.rtpPorts) {
            this.freeRTPPort(port);
        }
        this.rtpPorts.clear();
        // Don't clear global usedPorts here as other instances may be using it
        
        // End all active calls
        for (const [callId, call] of this.activeCalls) {
            try {
                this.endCall(callId);
            } catch (error) {
                console.error(`[SIPBackend] Error ending call ${callId}:`, error);
            }
        }
        
        // Clear maps
        this.activeCalls.clear();
        this.pendingRequests.clear();
        
        // Remove all event listeners
        this.removeAllListeners();
        
        // Close socket
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.registered = false;
        console.log('[SIPBackend] Instance destroyed');
    }
}

// Export factory for multiple instances
const instances = new Map();

module.exports = {
    getSIPBackend: async (config) => {
        // Use instanceId or username as key for multiple instances
        const instanceKey = config.instanceId || config.username || 'default';
        
        // Check if instance already exists
        let instance = instances.get(instanceKey);
        
        if (!instance) {
            instance = new SIPBackend(config);
            instances.set(instanceKey, instance);
            
            // Store reference for cleanup
            if (!global.sipBackends) {
                global.sipBackends = new Map();
            }
            global.sipBackends.set(instanceKey, instance);
            
            await instance.initialize();
            try {
                await instance.register();
                console.log(`SIP Backend [${instanceKey}] registered successfully`);
            } catch (error) {
                console.error(`SIP Backend [${instanceKey}] registration failed:`, error.message);
                // Don't throw, let it retry later
            }
        }
        return instance;
    },
    
    // Function to clean up specific instance
    cleanupInstance: (instanceKey) => {
        const instance = instances.get(instanceKey);
        if (instance) {
            instance.destroy();
            instances.delete(instanceKey);
            if (global.sipBackends) {
                global.sipBackends.delete(instanceKey);
            }
            console.log(`SIP Backend [${instanceKey}] cleaned up`);
        }
    },
    
    // Function to clean up all instances
    cleanupAllInstances: () => {
        instances.forEach((instance, key) => {
            instance.destroy();
            console.log(`SIP Backend [${key}] cleaned up`);
        });
        instances.clear();
        if (global.sipBackends) {
            global.sipBackends.clear();
        }
    },
    
    // Clean up global RTP port tracking when all instances are done
    cleanupGlobalRTPPorts: () => {
        if (global.usedRTPPorts) {
            console.log(`[RTP] Cleaning up global RTP port tracking. Ports in use: ${global.usedRTPPorts.size}`);
            global.usedRTPPorts.clear();
        }
    },
    
    SIPBackend
};