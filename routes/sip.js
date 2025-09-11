const express = require('express');
const router = express.Router();
const { getSIPBackend } = require('../lib/sip-backend');
const SIPTCPBackend = require('../lib/sip-tcp-backend');

// Store active SIP backend instance
let sipBackend = null;

// Initialize SIP backend
async function initializeSIPBackend() {
    if (!sipBackend) {
        try {
            // Check if TCP transport is requested
            if (process.env.SIP_TRANSPORT === 'TCP') {
                console.log('Using TCP transport for SIP');
                sipBackend = new SIPTCPBackend({
                    server: process.env.SIP_SERVER || '10.105.0.3',
                    port: process.env.SIP_PORT || 5060,
                    username: process.env.SIP_EXTENSION_1 || '5530',
                    password: process.env.SIP_PASSWORD || '5530',
                    domain: process.env.SIP_SERVER || '10.105.0.3'
                });
                
                await sipBackend.initialize();
                await sipBackend.register();
            } else {
                sipBackend = await getSIPBackend({
                    server: process.env.SIP_SERVER || '10.105.0.3',
                    port: process.env.SIP_PORT || 5060,
                    username: process.env.SIP_EXTENSION_1 || '5530',
                    password: process.env.SIP_PASSWORD || '5530',
                    domain: process.env.SIP_SERVER || '10.105.0.3'
                });
            }
            
            console.log('SIP Backend instance obtained, registered:', sipBackend.registered);
            
            // Listen for events
            sipBackend.on('registered', () => {
                console.log('SIP Backend: Registration event received');
            });
            
            sipBackend.on('call-trying', (data) => {
                console.log('Call trying:', data);
                if (global.io) {
                    global.io.emit('sip-call-trying', data);
                }
            });
            
            sipBackend.on('call-ringing', (data) => {
                console.log('Call ringing:', data);
                if (global.io) {
                    global.io.emit('sip-call-ringing', data);
                }
            });
            
            sipBackend.on('call-answered', (data) => {
                console.log('Call answered:', data);
                if (global.io) {
                    global.io.emit('sip-call-answered', data);
                }
            });
            
            sipBackend.on('call-failed', (data) => {
                console.log('Call failed:', data);
                if (global.io) {
                    global.io.emit('sip-call-failed', data);
                }
            });
            
            sipBackend.on('call-ended', (data) => {
                console.log('Call ended:', data);
                if (global.io) {
                    global.io.emit('sip-call-ended', data);
                }
            });
            
            sipBackend.on('audio-started', (data) => {
                console.log('Audio started:', data);
                if (global.io) {
                    global.io.emit('audio-started', data);
                }
            });
            
            sipBackend.on('call-progress', (data) => {
                console.log('Call progress (183):', data);
                if (global.io) {
                    global.io.emit('sip-call-progress', data);
                }
            });
            
            sipBackend.on('early-media', (data) => {
                console.log('Early media detected:', data);
                if (global.io) {
                    global.io.emit('sip-early-media', data);
                }
            });
            
            sipBackend.on('voice-detected', (data) => {
                console.log('Voice detected:', data);
                if (global.io) {
                    global.io.emit('sip-voice-detected', data);
                }
            });
            
            sipBackend.on('real-audio-detected', (data) => {
                console.log('Real audio detected - call truly connected:', data);
                if (global.io) {
                    global.io.emit('sip-real-audio-detected', data);
                }
            });
            
            sipBackend.on('remote-hangup', (data) => {
                console.log('Remote party hung up:', data);
                if (global.io) {
                    global.io.emit('sip-remote-hangup', data);
                }
            });
            
        } catch (error) {
            console.error('Failed to initialize SIP backend:', error);
            sipBackend = null;
        }
    }
    return sipBackend;
}

// Initialize on module load
initializeSIPBackend().catch(console.error);

// Get SIP configuration
router.get('/config', (req, res) => {
    res.json({
        server: process.env.SIP_SERVER,
        wsPort: process.env.SIP_WEBSOCKET_PORT,
        extensions: [
            process.env.SIP_EXTENSION_1,
            process.env.SIP_EXTENSION_2,
            process.env.SIP_EXTENSION_3
        ]
    });
});

// Get SIP status
router.get('/status', async (req, res) => {
    try {
        // Get backend SIP status
        const sip = await initializeSIPBackend();
        const registered = sip ? sip.registered : false;
        
        res.json({
            success: true,
            sip: {
                server: process.env.SIP_SERVER || '10.105.0.3',
                extensions: {
                    primary: process.env.SIP_EXTENSION_1 || '5530',
                    secondary: process.env.SIP_EXTENSION_2,
                    tertiary: process.env.SIP_EXTENSION_3
                },
                backend: {
                    initialized: !!sip,
                    registered: registered
                },
                websocket: {
                    url: `wss://172.27.64.10:8444/ws`,
                    status: 'active'
                }
            },
            ami: {
                host: process.env.AMI_HOST,
                port: process.env.AMI_PORT,
                connected: process.env.AMI_HOST ? true : false
            },
            channels: {
                active: sip ? sip.activeCalls.size : 0,
                available: 45 // 3 lines x 15 channels
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Test SIP connection
router.post('/test', async (req, res) => {
    try {
        const sip = await initializeSIPBackend();
        if (!sip) {
            return res.status(500).json({
                success: false,
                message: 'SIP backend not initialized'
            });
        }
        
        res.json({
            success: true,
            message: 'SIP server mavjud',
            registered: sip.registered
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Make a call through backend
router.post('/call', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqami kiritilmagan'
            });
        }
        
        const sip = await initializeSIPBackend();
        if (!sip) {
            return res.status(500).json({
                success: false,
                message: 'SIP backend not initialized'
            });
        }
        
        if (!sip.registered) {
            return res.status(503).json({
                success: false,
                message: 'SIP phone not registered'
            });
        }
        
        console.log(`Making call to ${phoneNumber}...`);
        const result = await sip.makeCall(phoneNumber);
        
        res.json({
            success: true,
            message: 'Qo\'ng\'iroq boshlandi',
            callId: result.callId,
            status: result.status
        });
        
    } catch (error) {
        console.error('Call error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Test call to specific number
router.post('/test-call', async (req, res) => {
    try {
        const testNumber = '990823112'; // Test number
        
        const sip = await initializeSIPBackend();
        if (!sip) {
            return res.status(503).json({
                success: false,
                message: 'SIP backend not initialized'
            });
        }
        
        // Give it a moment if just initialized
        if (!sip.registered) {
            console.log('SIP not registered yet, trying anyway...');
            // Try anyway, maybe registration will work during call
        }
        
        console.log(`Making test call to ${testNumber}...`);
        const result = await sip.makeCall(testNumber);
        
        res.json({
            success: true,
            message: `Test qo'ng'iroq ${testNumber} raqamiga yuborildi`,
            callId: result.callId,
            status: result.status,
            details: result
        });
        
    } catch (error) {
        console.error('Test call error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get active calls
router.get('/calls', async (req, res) => {
    try {
        const sip = await initializeSIPBackend();
        if (!sip) {
            return res.json({
                success: true,
                calls: []
            });
        }
        
        const calls = Array.from(sip.activeCalls.entries()).map(([callId, call]) => ({
            callId,
            ...call
        }));
        
        res.json({
            success: true,
            calls
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Test UDP connectivity
router.post('/test-udp', async (req, res) => {
    try {
        const sip = await initializeSIPBackend();
        if (!sip) {
            return res.status(500).json({
                success: false,
                message: 'SIP backend not initialized'
            });
        }
        
        // Send OPTIONS request to test UDP connectivity
        const testResult = await new Promise((resolve) => {
            // Set timeout
            const timeout = setTimeout(() => {
                resolve({
                    success: false,
                    message: 'UDP request timeout - port might be blocked'
                });
            }, 5000);
            
            // If we're registered, UDP is working
            if (sip.registered) {
                clearTimeout(timeout);
                resolve({
                    success: true,
                    message: 'UDP port is accessible'
                });
            } else {
                clearTimeout(timeout);
                resolve({
                    success: false,
                    message: 'UDP port not accessible or SIP not registered'
                });
            }
        });
        
        res.json(testResult);
    } catch (error) {
        console.error('UDP test error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Keepalive endpoint
router.post('/keepalive', async (req, res) => {
    try {
        const { callId } = req.body;
        
        if (!callId) {
            return res.status(400).json({
                success: false,
                message: 'Call ID is required'
            });
        }
        
        const sip = await initializeSIPBackend();
        if (!sip) {
            return res.status(500).json({
                success: false,
                message: 'SIP backend not initialized'
            });
        }
        
        // Send keepalive to maintain call
        sip.sendKeepAlive(callId);
        
        res.json({
            success: true,
            message: 'Keepalive sent'
        });
    } catch (error) {
        console.error('Keepalive error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// End call
router.post('/hangup', async (req, res) => {
    try {
        const { callId } = req.body;
        
        if (!callId) {
            return res.status(400).json({
                success: false,
                message: 'Call ID is required'
            });
        }
        
        const sip = await initializeSIPBackend();
        if (!sip) {
            return res.status(500).json({
                success: false,
                message: 'SIP backend not initialized'
            });
        }
        
        sip.endCall(callId);
        
        res.json({
            success: true,
            message: 'Call ended'
        });
    } catch (error) {
        console.error('Hangup error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;