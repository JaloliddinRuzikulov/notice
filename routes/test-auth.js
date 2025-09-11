const express = require('express');
const router = express.Router();

// Test session endpoint without auth
router.get('/test-session', (req, res) => {
    console.log('[TEST] Session check without auth middleware');
    console.log('[TEST] Session ID:', req.sessionID);
    console.log('[TEST] Session exists:', !!req.session);
    console.log('[TEST] Session user:', req.session?.user);
    console.log('[TEST] Cookie header:', req.headers.cookie);
    
    res.json({
        sessionExists: !!req.session,
        sessionID: req.sessionID,
        user: req.session?.user,
        cookie: req.headers.cookie
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;