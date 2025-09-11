/**
 * RTP Audio Handler for SIP calls
 * Handles RTP streams like MicroSIP
 */

const dgram = require('dgram');
const { Transform } = require('stream');
const EventEmitter = require('events');

class RTPHandler extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            localRtpPort: config.localRtpPort || 10000,
            localRtcpPort: config.localRtcpPort || 10001,
            codec: config.codec || 'PCMU', // G.711 μ-law
            ptime: config.ptime || 20, // 20ms packets
            ...config
        };
        
        this.rtpSocket = null;
        this.rtcpSocket = null;
        this.remoteRtpEndpoint = null;
        this.sequenceNumber = Math.floor(Math.random() * 65535);
        this.timestamp = Math.floor(Math.random() * 4294967295);
        this.ssrc = Math.floor(Math.random() * 4294967295);
        this.payloadType = this.getPayloadType(this.config.codec);
        this.isActive = false;
    }
    
    /**
     * Start RTP handler
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                // Create RTP socket
                this.rtpSocket = dgram.createSocket('udp4');
                
                this.rtpSocket.on('error', (err) => {
                    console.error('RTP socket error:', err);
                    this.emit('error', err);
                });
                
                this.rtpSocket.on('message', (msg, rinfo) => {
                    this.handleIncomingRTP(msg, rinfo);
                });
                
                this.rtpSocket.bind(this.config.localRtpPort, () => {
                    console.log(`RTP socket listening on port ${this.config.localRtpPort}`);
                    
                    // Create RTCP socket
                    this.rtcpSocket = dgram.createSocket('udp4');
                    
                    this.rtcpSocket.on('error', (err) => {
                        console.error('RTCP socket error:', err);
                    });
                    
                    this.rtcpSocket.bind(this.config.localRtcpPort, () => {
                        console.log(`RTCP socket listening on port ${this.config.localRtcpPort}`);
                        this.isActive = true;
                        resolve({
                            rtpPort: this.config.localRtpPort,
                            rtcpPort: this.config.localRtcpPort
                        });
                    });
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Set remote RTP endpoint
     */
    setRemoteEndpoint(host, port) {
        this.remoteRtpEndpoint = { host, port };
        console.log(`Remote RTP endpoint set to ${host}:${port}`);
    }
    
    /**
     * Send audio data as RTP packets
     */
    sendAudio(audioData) {
        if (!this.isActive || !this.remoteRtpEndpoint) {
            return;
        }
        
        // Split audio data into chunks based on ptime
        const samplesPerPacket = (this.config.ptime * 8); // 8 samples per ms for 8kHz
        const chunks = this.splitAudioData(audioData, samplesPerPacket);
        
        chunks.forEach((chunk) => {
            const rtpPacket = this.createRTPPacket(chunk);
            
            this.rtpSocket.send(rtpPacket, this.remoteRtpEndpoint.port, this.remoteRtpEndpoint.host, (err) => {
                if (err) {
                    console.error('Error sending RTP packet:', err);
                }
            });
            
            // Increment sequence number and timestamp
            this.sequenceNumber = (this.sequenceNumber + 1) & 0xFFFF;
            this.timestamp += samplesPerPacket;
        });
    }
    
    /**
     * Create RTP packet
     */
    createRTPPacket(payload) {
        const packet = Buffer.allocUnsafe(12 + payload.length);
        
        // RTP header (12 bytes)
        // V=2, P=0, X=0, CC=0
        packet[0] = 0x80;
        
        // M=0, PT=payloadType
        packet[1] = this.payloadType;
        
        // Sequence number
        packet.writeUInt16BE(this.sequenceNumber, 2);
        
        // Timestamp
        packet.writeUInt32BE(this.timestamp, 4);
        
        // SSRC
        packet.writeUInt32BE(this.ssrc, 8);
        
        // Copy payload
        payload.copy(packet, 12);
        
        return packet;
    }
    
    /**
     * Handle incoming RTP packets
     */
    handleIncomingRTP(msg, rinfo) {
        if (msg.length < 12) {
            return; // Invalid RTP packet
        }
        
        // Parse RTP header
        const version = (msg[0] >> 6) & 0x03;
        if (version !== 2) {
            return; // Not RTP version 2
        }
        
        const payloadType = msg[1] & 0x7F;
        const sequenceNumber = msg.readUInt16BE(2);
        const timestamp = msg.readUInt32BE(4);
        const ssrc = msg.readUInt32BE(8);
        
        // Extract payload
        const payload = msg.slice(12);
        
        // Emit audio data event
        this.emit('audioData', {
            payload,
            payloadType,
            sequenceNumber,
            timestamp,
            ssrc,
            from: rinfo
        });
    }
    
    /**
     * Split audio data into chunks
     */
    splitAudioData(audioData, samplesPerPacket) {
        const chunks = [];
        const bytesPerPacket = samplesPerPacket; // For G.711, 1 byte per sample
        
        for (let i = 0; i < audioData.length; i += bytesPerPacket) {
            chunks.push(audioData.slice(i, i + bytesPerPacket));
        }
        
        return chunks;
    }
    
    /**
     * Get payload type for codec
     */
    getPayloadType(codec) {
        const payloadTypes = {
            'PCMU': 0,  // G.711 μ-law
            'PCMA': 8,  // G.711 A-law
            'G729': 18,
            'G722': 9,
            'GSM': 3
        };
        
        return payloadTypes[codec] || 0;
    }
    
    /**
     * Convert audio format to G.711 μ-law
     */
    encodeG711u(pcmData) {
        // G.711 μ-law encoding
        const encoded = Buffer.allocUnsafe(pcmData.length / 2);
        
        for (let i = 0; i < pcmData.length; i += 2) {
            const sample = pcmData.readInt16LE(i);
            encoded[i / 2] = this.linearToUlaw(sample);
        }
        
        return encoded;
    }
    
    /**
     * Linear to μ-law conversion
     */
    linearToUlaw(sample) {
        const CLIP = 0x7FFF;
        const BIAS = 0x84;
        
        let sign = 0;
        let position = 0;
        let mask = 0;
        
        if (sample < 0) {
            sign = 0x80;
            sample = -sample;
        }
        
        if (sample > CLIP) {
            sample = CLIP;
        }
        
        sample = sample + BIAS;
        
        const exponent = this.getExponent(sample);
        const mantissa = (sample >> (exponent + 3)) & 0x0F;
        
        return ~(sign | (exponent << 4) | mantissa);
    }
    
    getExponent(sample) {
        let exponent = 0;
        
        for (let expMask = 0x4000; (sample & expMask) === 0 && exponent < 7; exponent++, expMask >>= 1) {
            // Find position of first set bit
        }
        
        return exponent;
    }
    
    /**
     * Stop RTP handler
     */
    stop() {
        this.isActive = false;
        
        if (this.rtpSocket) {
            this.rtpSocket.close();
            this.rtpSocket = null;
        }
        
        if (this.rtcpSocket) {
            this.rtcpSocket.close();
            this.rtcpSocket = null;
        }
        
        this.remoteRtpEndpoint = null;
    }
}

/**
 * Create RTP stream transform
 */
class RTPStream extends Transform {
    constructor(rtpHandler) {
        super();
        this.rtpHandler = rtpHandler;
        this.buffer = Buffer.alloc(0);
        this.packetSize = 160; // 20ms of 8kHz audio
    }
    
    _transform(chunk, encoding, callback) {
        // Buffer incoming audio
        this.buffer = Buffer.concat([this.buffer, chunk]);
        
        // Process complete packets
        while (this.buffer.length >= this.packetSize) {
            const packet = this.buffer.slice(0, this.packetSize);
            this.buffer = this.buffer.slice(this.packetSize);
            
            // Send as RTP
            this.rtpHandler.sendAudio(packet);
        }
        
        callback();
    }
}

module.exports = { RTPHandler, RTPStream };