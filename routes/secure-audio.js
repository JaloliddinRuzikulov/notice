const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');

// Secure audio file access - require authentication
router.get('/audio/uploads/:filename', requireAuth, (req, res) => {
    const filename = req.params.filename;
    
    // Validate filename to prevent path traversal
    if (!/^[a-zA-Z0-9\-_.]+$/.test(filename)) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filepath = path.join(__dirname, '../public/audio/uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    // Send file
    res.sendFile(filepath);
});

module.exports = router;