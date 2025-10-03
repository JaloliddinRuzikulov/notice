const express = require('express');
const router = express.Router();
const BroadcastHistory = require('../lib/entities/BroadcastHistory');
const { AppDataSource } = require('../lib/typeorm-config');

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
        const broadcastRepo = AppDataSource.getRepository(BroadcastHistory);

        // Find most recent active broadcast using TypeORM (NO SQL INJECTION!)
        const activeBroadcast = await broadcastRepo.findOne({
            where: { status: 'active' },
            order: { created_at: 'DESC' }
        });

        if (!activeBroadcast) {
            console.log('[INTERNAL-DTMF] No active broadcast found');
            return res.json({ status: 'no_active_broadcast' });
        }

        // Get confirmations array
        const confirmations = activeBroadcast.confirmations || [];

        // Check if already confirmed
        const alreadyConfirmed = confirmations.find(c => c.phoneNumber === phone);

        if (alreadyConfirmed) {
            console.log('[INTERNAL-DTMF] Already confirmed');
            return res.json({ status: 'already_confirmed', broadcastId: activeBroadcast.id });
        }

        // Add confirmation
        confirmations.push({
            phoneNumber: phone,
            digit: digit,
            confirmedAt: new Date(),
            method: 'asterisk-dtmf',
            channel: channel,
            uniqueid: uniqueid
        });

        // Update broadcast
        activeBroadcast.confirmations = confirmations;
        activeBroadcast.confirmed_count = confirmations.length;

        // Save using TypeORM (NO SQL INJECTION!)
        await broadcastRepo.save(activeBroadcast);

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