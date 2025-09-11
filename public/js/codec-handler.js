/**
 * WebRTC Codec Handler
 * Manages audio codec preferences and negotiation
 */

class CodecHandler {
    constructor() {
        // Supported codecs with priorities
        this.codecs = {
            opus: {
                name: 'opus',
                displayName: 'Opus',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
                sdpFmtpLine: 'minptime=10;useinbandfec=1',
                priority: 1,
                quality: 'excellent',
                bandwidth: 'adaptive'
            },
            g722: {
                name: 'G722',
                displayName: 'G.722 HD',
                mimeType: 'audio/G722',
                clockRate: 8000,
                channels: 1,
                priority: 2,
                quality: 'high',
                bandwidth: '64 kbps'
            },
            pcmu: {
                name: 'PCMU',
                displayName: 'G.711 μ-law',
                mimeType: 'audio/PCMU',
                clockRate: 8000,
                channels: 1,
                priority: 3,
                quality: 'standard',
                bandwidth: '64 kbps'
            },
            pcma: {
                name: 'PCMA',
                displayName: 'G.711 A-law',
                mimeType: 'audio/PCMA',
                clockRate: 8000,
                channels: 1,
                priority: 4,
                quality: 'standard',
                bandwidth: '64 kbps'
            },
            g729: {
                name: 'G729',
                displayName: 'G.729',
                mimeType: 'audio/G729',
                clockRate: 8000,
                channels: 1,
                priority: 5,
                quality: 'compressed',
                bandwidth: '8 kbps'
            },
            telephone_event: {
                name: 'telephone-event',
                displayName: 'DTMF',
                mimeType: 'audio/telephone-event',
                clockRate: 8000,
                channels: 1,
                priority: 10,
                quality: 'n/a',
                bandwidth: 'n/a'
            }
        };
        
        // Default codec order
        this.codecOrder = ['opus', 'g722', 'pcmu', 'pcma', 'g729'];
    }
    
    /**
     * Set codec preferences for RTCPeerConnection
     */
    setCodecPreferences(peerConnection, preferredCodec = 'opus') {
        if (!peerConnection.getTransceivers) {
            console.warn('Codec preferences not supported in this browser');
            return;
        }
        
        const transceivers = peerConnection.getTransceivers();
        transceivers.forEach(transceiver => {
            if (transceiver.sender && transceiver.sender.track && 
                transceiver.sender.track.kind === 'audio') {
                
                const capabilities = RTCRtpSender.getCapabilities('audio');
                if (!capabilities) return;
                
                // Sort codecs by preference
                const orderedCodecs = this.orderCodecs(capabilities.codecs, preferredCodec);
                
                if (transceiver.setCodecPreferences) {
                    transceiver.setCodecPreferences(orderedCodecs);
                    console.log('Codec preferences set:', orderedCodecs.map(c => c.mimeType));
                }
            }
        });
    }
    
    /**
     * Order codecs by preference
     */
    orderCodecs(availableCodecs, preferredCodec) {
        const ordered = [];
        
        // First, add preferred codec
        const preferred = availableCodecs.find(codec => 
            codec.mimeType.toLowerCase().includes(preferredCodec.toLowerCase())
        );
        if (preferred) {
            ordered.push(preferred);
        }
        
        // Then add other codecs in priority order
        this.codecOrder.forEach(codecName => {
            if (codecName === preferredCodec) return; // Already added
            
            const codec = availableCodecs.find(c => 
                c.mimeType.toLowerCase().includes(codecName.toLowerCase())
            );
            if (codec && !ordered.includes(codec)) {
                ordered.push(codec);
            }
        });
        
        // Add any remaining codecs
        availableCodecs.forEach(codec => {
            if (!ordered.includes(codec)) {
                ordered.push(codec);
            }
        });
        
        return ordered;
    }
    
    /**
     * Modify SDP to set codec preferences
     */
    modifySDP(sdp, preferredCodec = 'opus') {
        const lines = sdp.split('\r\n');
        const mediaLineIndex = lines.findIndex(line => line.startsWith('m=audio'));
        
        if (mediaLineIndex === -1) return sdp;
        
        // Get all payload types from m=audio line
        const mediaLine = lines[mediaLineIndex];
        const parts = mediaLine.split(' ');
        const payloadTypes = parts.slice(3);
        
        // Find rtpmap lines for each payload type
        const codecMap = new Map();
        payloadTypes.forEach(pt => {
            const rtpmapIndex = lines.findIndex(line => 
                line.startsWith(`a=rtpmap:${pt} `)
            );
            if (rtpmapIndex !== -1) {
                const codecName = lines[rtpmapIndex].split(' ')[1].split('/')[0];
                codecMap.set(pt, codecName.toLowerCase());
            }
        });
        
        // Reorder payload types based on preference
        const orderedPayloads = this.reorderPayloadTypes(payloadTypes, codecMap, preferredCodec);
        
        // Rebuild m=audio line
        parts.splice(3, payloadTypes.length, ...orderedPayloads);
        lines[mediaLineIndex] = parts.join(' ');
        
        return lines.join('\r\n');
    }
    
    /**
     * Reorder payload types based on codec preference
     */
    reorderPayloadTypes(payloadTypes, codecMap, preferredCodec) {
        const ordered = [];
        
        // First add preferred codec
        payloadTypes.forEach(pt => {
            if (codecMap.get(pt) === preferredCodec.toLowerCase()) {
                ordered.push(pt);
            }
        });
        
        // Then add others in priority order
        this.codecOrder.forEach(codecName => {
            if (codecName === preferredCodec) return;
            
            payloadTypes.forEach(pt => {
                if (codecMap.get(pt) === codecName.toLowerCase() && !ordered.includes(pt)) {
                    ordered.push(pt);
                }
            });
        });
        
        // Add remaining payload types
        payloadTypes.forEach(pt => {
            if (!ordered.includes(pt)) {
                ordered.push(pt);
            }
        });
        
        return ordered;
    }
    
    /**
     * Get codec from SDP
     */
    getCodecFromSDP(sdp) {
        const lines = sdp.split('\r\n');
        const mediaLineIndex = lines.findIndex(line => line.startsWith('m=audio'));
        
        if (mediaLineIndex === -1) return null;
        
        const mediaLine = lines[mediaLineIndex];
        const firstPayloadType = mediaLine.split(' ')[3];
        
        const rtpmapLine = lines.find(line => 
            line.startsWith(`a=rtpmap:${firstPayloadType} `)
        );
        
        if (rtpmapLine) {
            const codecName = rtpmapLine.split(' ')[1].split('/')[0];
            return this.codecs[codecName.toLowerCase()] || { name: codecName };
        }
        
        return null;
    }
    
    /**
     * Add Opus specific parameters
     */
    enhanceOpusParameters(sdp) {
        const lines = sdp.split('\r\n');
        const opusRtpmapIndex = lines.findIndex(line => 
            line.includes('opus/48000')
        );
        
        if (opusRtpmapIndex === -1) return sdp;
        
        const payloadType = lines[opusRtpmapIndex].split(':')[1].split(' ')[0];
        
        // Find or add fmtp line for Opus
        const fmtpIndex = lines.findIndex(line => 
            line.startsWith(`a=fmtp:${payloadType}`)
        );
        
        const opusParams = [
            'stereo=1',
            'sprop-stereo=1',
            'maxplaybackrate=48000',
            'maxaveragebitrate=510000',
            'useinbandfec=1',
            'usedtx=1'
        ].join(';');
        
        if (fmtpIndex !== -1) {
            // Enhance existing fmtp line
            lines[fmtpIndex] = `a=fmtp:${payloadType} ${opusParams}`;
        } else {
            // Add new fmtp line after rtpmap
            lines.splice(opusRtpmapIndex + 1, 0, `a=fmtp:${payloadType} ${opusParams}`);
        }
        
        return lines.join('\r\n');
    }
    
    /**
     * Get supported codecs for browser
     */
    getSupportedCodecs() {
        if (!window.RTCRtpSender || !RTCRtpSender.getCapabilities) {
            console.warn('RTCRtpSender.getCapabilities not supported');
            return [];
        }
        
        const capabilities = RTCRtpSender.getCapabilities('audio');
        if (!capabilities) return [];
        
        return capabilities.codecs.map(codec => {
            const codecInfo = Object.values(this.codecs).find(c => 
                codec.mimeType.toLowerCase().includes(c.name.toLowerCase())
            );
            
            return {
                ...codec,
                displayName: codecInfo ? codecInfo.displayName : codec.mimeType,
                quality: codecInfo ? codecInfo.quality : 'unknown',
                bandwidth: codecInfo ? codecInfo.bandwidth : 'unknown'
            };
        });
    }
    
    /**
     * Estimate bandwidth for codec
     */
    estimateBandwidth(codecName, duration = 60) {
        const codec = this.codecs[codecName.toLowerCase()];
        if (!codec) return 0;
        
        const bitrates = {
            opus: 32000, // 32 kbps average
            g722: 64000, // 64 kbps
            pcmu: 64000, // 64 kbps
            pcma: 64000, // 64 kbps
            g729: 8000   // 8 kbps
        };
        
        const bitrate = bitrates[codecName.toLowerCase()] || 64000;
        return (bitrate * duration) / 8; // Convert to bytes
    }
}

// Export for use
window.CodecHandler = CodecHandler;