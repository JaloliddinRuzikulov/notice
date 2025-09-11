const express = require('express');
const router = express.Router();

// Test backend SIP
router.post('/backend-sip', async (req, res) => {
    try {
        const { number } = req.body;
        
        if (!number) {
            return res.status(400).json({
                success: false,
                message: 'Phone number required'
            });
        }
        
        const { getSIPBackend } = require('../lib/sip-backend');
        const sip = await getSIPBackend({
            server: process.env.SIP_SERVER || '10.105.0.3',
            port: 5060,
            username: process.env.SIP_EXTENSION_1 || '5530',
            password: process.env.SIP_PASSWORD || '5530',
            domain: process.env.SIP_SERVER || '10.105.0.3'
        });
        
        if (!sip || !sip.registered) {
            return res.json({
                success: false,
                message: 'SIP backend not registered'
            });
        }
        
        // Make test call
        const result = await sip.makeCall(number);
        
        // Hang up after 5 seconds
        setTimeout(() => {
            sip.hangup(result.callId);
        }, 5000);
        
        res.json({
            success: true,
            message: 'Test call initiated',
            callId: result.callId
        });
        
    } catch (error) {
        console.error('Backend SIP test error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;