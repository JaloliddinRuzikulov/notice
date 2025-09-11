const dgram = require('dgram');
const crypto = require('crypto');

class SimpleSIPCall {
    constructor() {
        this.socket = dgram.createSocket('udp4');
        this.sipServer = '10.105.0.3';
        this.sipPort = 5060;
        this.username = '5530';
        this.password = '5530';
        this.domain = '10.105.0.3';
        this.localPort = 5070;
        this.callId = this.generateCallId();
        this.fromTag = this.generateTag();
        this.branch = this.generateBranch();
        this.cseq = 1;
    }

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
        const os = require('os');
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

    async makeCall(phoneNumber) {
        console.log(`\n📞 Qo'ng'iroq qilinmoqda: ${phoneNumber}`);
        console.log(`SIP: ${this.username}@${this.sipServer}`);
        
        return new Promise((resolve, reject) => {
            this.socket.bind(this.localPort, () => {
                console.log(`Socket ochildi: ${this.localPort}`);
                
                // Send INVITE
                const invite = this.createInvite(phoneNumber);
                console.log('\nINVITE yuborilmoqda...');
                
                this.socket.send(invite, this.sipPort, this.sipServer, (err) => {
                    if (err) {
                        console.error('INVITE yuborishda xato:', err);
                        reject(err);
                    } else {
                        console.log('✅ INVITE yuborildi');
                    }
                });
                
                // Listen for responses
                let answered = false;
                let startTime = Date.now();
                
                this.socket.on('message', (msg, rinfo) => {
                    const message = msg.toString();
                    console.log(`\n[${new Date().toLocaleTimeString()}] Javob:`, message.split('\\r\\n')[0]);
                    
                    if (message.includes('200 OK')) {
                        answered = true;
                        console.log('✅ JAVOB BERILDI!');
                        
                        // Send ACK
                        const ack = this.createACK(phoneNumber);
                        this.socket.send(ack, this.sipPort, this.sipServer);
                        
                        // Keep call alive for testing
                        setTimeout(() => {
                            const duration = Math.round((Date.now() - startTime) / 1000);
                            console.log(`\\n📊 Qo'ng'iroq davomiyligi: ${duration} sekund`);
                            
                            // Send BYE
                            const bye = this.createBYE(phoneNumber);
                            this.socket.send(bye, this.sipPort, this.sipServer);
                            
                            setTimeout(() => {
                                this.socket.close();
                                resolve({ answered, duration });
                            }, 1000);
                        }, 30000); // 30 seconds
                    }
                    
                    if (message.includes('BYE')) {
                        const duration = Math.round((Date.now() - startTime) / 1000);
                        console.log(`\\n📊 Remote tugadi. Davomiyligi: ${duration} sekund`);
                        this.socket.close();
                        resolve({ answered, duration });
                    }
                });
                
                // Timeout
                setTimeout(() => {
                    if (!answered) {
                        console.log('\\n❌ Javob berilmadi (timeout)');
                        this.socket.close();
                        resolve({ answered: false, duration: 0 });
                    }
                }, 60000);
            });
        });
    }

    createInvite(phoneNumber) {
        const localIP = this.getLocalIP();
        const sdp = this.createSDP();
        
        const invite = [
            `INVITE sip:${phoneNumber}@${this.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${localIP}:${this.localPort};branch=${this.branch};rport`,
            `From: <sip:${this.username}@${this.domain}>;tag=${this.fromTag}`,
            `To: <sip:${phoneNumber}@${this.domain}>`,
            `Call-ID: ${this.callId}`,
            `CSeq: ${this.cseq} INVITE`,
            `Contact: <sip:${this.username}@${localIP}:${this.localPort}>`,
            `Content-Type: application/sdp`,
            `Max-Forwards: 70`,
            `User-Agent: Test SIP Client`,
            `Content-Length: ${sdp.length}`,
            '',
            sdp
        ].join('\\r\\n');
        
        return Buffer.from(invite);
    }

    createSDP() {
        const localIP = this.getLocalIP();
        const rtpPort = 10000 + Math.floor(Math.random() * 10000);
        
        return [
            'v=0',
            `o=- ${Date.now()} ${Date.now()} IN IP4 ${localIP}`,
            's=-',
            `c=IN IP4 ${localIP}`,
            't=0 0',
            `m=audio ${rtpPort} RTP/AVP 0 8 101`,
            'a=rtpmap:0 PCMU/8000',
            'a=rtpmap:8 PCMA/8000',
            'a=rtpmap:101 telephone-event/8000',
            'a=sendrecv'
        ].join('\\r\\n');
    }

    createACK(phoneNumber) {
        this.cseq++;
        const ack = [
            `ACK sip:${phoneNumber}@${this.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=${this.generateBranch()};rport`,
            `From: <sip:${this.username}@${this.domain}>;tag=${this.fromTag}`,
            `To: <sip:${phoneNumber}@${this.domain}>`,
            `Call-ID: ${this.callId}`,
            `CSeq: ${this.cseq} ACK`,
            `Content-Length: 0`,
            '',
            ''
        ].join('\\r\\n');
        
        return Buffer.from(ack);
    }

    createBYE(phoneNumber) {
        this.cseq++;
        const bye = [
            `BYE sip:${phoneNumber}@${this.domain} SIP/2.0`,
            `Via: SIP/2.0/UDP ${this.getLocalIP()}:${this.localPort};branch=${this.generateBranch()};rport`,
            `From: <sip:${this.username}@${this.domain}>;tag=${this.fromTag}`,
            `To: <sip:${phoneNumber}@${this.domain}>`,
            `Call-ID: ${this.callId}`,
            `CSeq: ${this.cseq} BYE`,
            `Content-Length: 0`,
            '',
            ''
        ].join('\\r\\n');
        
        return Buffer.from(bye);
    }
}

// Test
async function testCall() {
    console.log('=== TO\\'G\\'RIDAN-TO\\'G\\'RI SIP QO\\'NG\\'IROQ ===');
    console.log('Vaqt:', new Date().toLocaleString());
    
    const sip = new SimpleSIPCall();
    
    try {
        const result = await sip.makeCall('990823112');
        
        console.log('\\n=== NATIJA ===');
        console.log('Javob berildi:', result.answered ? 'HA' : 'YO\\'Q');
        console.log('Davomiyligi:', result.duration, 'sekund');
        
        if (result.duration >= 20) {
            console.log('\\n🎉 MUVAFFAQIYAT! Muammo hal bo\\'ldi!');
        } else if (result.answered && result.duration < 10) {
            console.log('\\n❌ MUAMMO! Qo\\'ng\\'iroq juda qisqa!');
        }
        
    } catch (error) {
        console.error('Xato:', error);
    }
}

testCall();