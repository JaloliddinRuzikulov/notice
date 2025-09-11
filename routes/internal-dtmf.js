const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Internal endpoint for Asterisk to report DTMF
router.post('/dtmf-confirm', async (req, res) => {
    const { phone, digit, channel, uniqueid } = req.body;
    
    console.log('[INTERNAL-DTMF] Received confirmation:', {
        phone,
        digit,
        channel,
        uniqueid,
        timestamp: new Date()
    });
    
    try {
        // Find active broadcast for this phone
        const broadcastsPath = path.join(__dirname, '../data/broadcasts.json');
        const broadcastsData = await fs.readFile(broadcastsPath, 'utf8');
        const broadcasts = JSON.parse(broadcastsData);
        
        // Find most recent active broadcast
        const activeBroadcast = broadcasts
            .filter(b => b.status === 'in_progress')
            .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];
        
        if (!activeBroadcast) {
            console.log('[INTERNAL-DTMF] No active broadcast found');
            return res.json({ status: 'no_active_broadcast' });
        }
        
        // Find call record
        const callHistoryPath = path.join(__dirname, '../data/broadcast-history.json');
        const historyData = await fs.readFile(callHistoryPath, 'utf8');
        const history = JSON.parse(historyData);
        
        const callRecord = history.find(h => 
            h.broadcastId === activeBroadcast.id && 
            h.phoneNumber === phone &&
            h.status === 'completed' &&
            !h.confirmed
        );
        
        if (!callRecord) {
            console.log('[INTERNAL-DTMF] No matching call record found');
            return res.json({ status: 'no_call_record' });
        }
        
        // Update confirmation
        callRecord.confirmed = true;
        callRecord.confirmedAt = new Date();
        callRecord.confirmationMethod = 'asterisk-dtmf';
        callRecord.dtmfDigit = digit;
        
        await fs.writeFile(callHistoryPath, JSON.stringify(history, null, 2));
        
        console.log('[INTERNAL-DTMF] Successfully confirmed:', {
            broadcastId: activeBroadcast.id,
            phone,
            digit
        });
        
        // Emit event to any listeners
        if (global.io) {
            global.io.emit('broadcast-confirmed', {
                broadcastId: activeBroadcast.id,
                phoneNumber: phone,
                digit,
                timestamp: new Date()
            });
        }
        
        res.json({ status: 'confirmed', broadcastId: activeBroadcast.id });
        
    } catch (error) {
        console.error('[INTERNAL-DTMF] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Internal TCP listener for AGI script
const net = require('net');
const server = net.createServer((socket) => {
    let buffer = '';
    
    socket.on('data', (data) => {
        buffer += data.toString();
        
        try {
            const message = JSON.parse(buffer);
            console.log('[INTERNAL-TCP] Received:', message);
            
            if (message.type === 'dtmf-confirmation') {
                // Process DTMF confirmation
                handleDTMFConfirmation(message);
            }
            
            socket.end('OK');
            buffer = '';
        } catch (e) {
            // Wait for more data
        }
    });
    
    socket.on('error', (err) => {
        console.error('[INTERNAL-TCP] Socket error:', err);
    });
});

function handleDTMFConfirmation(data) {
    console.log('[INTERNAL-TCP] Processing DTMF confirmation:', data);
    
    // Find SIP backend instance
    const sipBackend = global.sipBackend;
    if (sipBackend) {
        // Emit event directly
        sipBackend.emit('broadcast-confirmed', {
            phoneNumber: data.phoneNumber,
            broadcastId: data.broadcastId,
            digit: data.digit,
            timestamp: data.timestamp,
            method: 'agi-script'
        });
    }
}

// Start TCP server on port 8445
server.listen(8445, 'localhost', () => {
    console.log('[INTERNAL-TCP] Listening on localhost:8445 for AGI connections');
});

module.exports = router;