/**
 * Audio Bridge for MicroSIP-style SIP phone
 * Handles audio streaming between browser and SIP backend
 */

const express = require('express');
const router = express.Router();
const { RTPHandler } = require('../lib/rtp-handler');

// Store active RTP sessions
const rtpSessions = new Map();

// Create RTP session for a call
router.post('/create-session', async (req, res) => {
    try {
        const { callId } = req.body;
        
        if (!callId) {
            return res.status(400).json({
                success: false,
                message: 'Call ID is required'
            });
        }
        
        // Check if session already exists
        if (rtpSessions.has(callId)) {
            const session = rtpSessions.get(callId);
            return res.json({
                success: true,
                rtpPort: session.rtpPort,
                rtcpPort: session.rtcpPort
            });
        }
        
        // Create new RTP handler
        const rtpHandler = new RTPHandler({
            localRtpPort: 10000 + (rtpSessions.size * 2),
            localRtcpPort: 10001 + (rtpSessions.size * 2)
        });
        
        // Start RTP handler
        const { rtpPort, rtcpPort } = await rtpHandler.start();
        
        // Store session
        rtpSessions.set(callId, {
            handler: rtpHandler,
            rtpPort,
            rtcpPort,
            created: new Date()
        });
        
        // Handle incoming audio
        rtpHandler.on('audioData', (data) => {
            // Send to WebSocket client
            if (global.io) {
                global.io.emit('audio-from-sip', {
                    callId,
                    audio: data.payload.toString('base64'),
                    timestamp: data.timestamp
                });
            }
        });
        
        console.log(`RTP session created for call ${callId} on ports ${rtpPort}/${rtcpPort}`);
        
        res.json({
            success: true,
            rtpPort,
            rtcpPort,
            codec: 'PCMU'
        });
        
    } catch (error) {
        console.error('Create RTP session error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Set remote endpoint for RTP
router.post('/set-remote-endpoint', (req, res) => {
    try {
        const { callId, remoteHost, remotePort } = req.body;
        
        const session = rtpSessions.get(callId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'RTP session not found'
            });
        }
        
        session.handler.setRemoteEndpoint(remoteHost, remotePort);
        
        res.json({
            success: true,
            message: 'Remote endpoint set'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Send audio to SIP
router.post('/send-audio', (req, res) => {
    try {
        const { callId, audio } = req.body;
        
        const session = rtpSessions.get(callId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'RTP session not found'
            });
        }
        
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audio, 'base64');
        
        // Send via RTP
        session.handler.sendAudio(audioBuffer);
        
        res.json({ success: true });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// End RTP session
router.post('/end-session', (req, res) => {
    try {
        const { callId } = req.body;
        
        const session = rtpSessions.get(callId);
        if (session) {
            session.handler.stop();
            rtpSessions.delete(callId);
            console.log(`RTP session ended for call ${callId}`);
        }
        
        res.json({
            success: true,
            message: 'Session ended'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get session info
router.get('/session/:callId', (req, res) => {
    const { callId } = req.params;
    
    const session = rtpSessions.get(callId);
    if (!session) {
        return res.status(404).json({
            success: false,
            message: 'Session not found'
        });
    }
    
    res.json({
        success: true,
        rtpPort: session.rtpPort,
        rtcpPort: session.rtcpPort,
        created: session.created,
        active: session.handler.isActive
    });
});

// Cleanup old sessions
setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    for (const [callId, session] of rtpSessions) {
        if (now - session.created.getTime() > maxAge) {
            session.handler.stop();
            rtpSessions.delete(callId);
            console.log(`Cleaned up old RTP session: ${callId}`);
        }
    }
}, 60000); // Every minute

module.exports = router;