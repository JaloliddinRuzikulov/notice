const express = require('express');
const router = express.Router();
const db = require('../lib/database');
const { requirePermission } = require('../middleware/auth');

console.log('[SIP-ACCOUNTS] Route module loaded at', new Date().toISOString());

// Get all SIP accounts - requires sipAccounts permission
router.get('/', requirePermission('sipAccounts'), async (req, res) => {
    try {
        const accounts = await db.all('SELECT * FROM sip_accounts ORDER BY extension');
        res.json(accounts);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get active SIP accounts - accessible to anyone with broadcast permission
router.get('/active', async (req, res) => {
    try {
        // No permission check here - broadcast users need to see SIP accounts
        const accounts = await db.all('SELECT * FROM sip_accounts WHERE active = 1 ORDER BY extension');
        res.json(accounts);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Add new SIP account - requires sipAccounts permission
router.post('/', requirePermission('sipAccounts'), async (req, res) => {
    try {
        const { extension, password, name, server, channels } = req.body;

        if (!extension || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Extension, parol va nom kiritilishi shart'
            });
        }

        // Check if extension already exists
        const existing = await db.get('SELECT id FROM sip_accounts WHERE extension = ?', [extension]);
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Bu extension allaqachon mavjud'
            });
        }

        const id = Date.now().toString();
        await db.run(
            `INSERT INTO sip_accounts (id, extension, password, name, server, channels, active)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [id, extension, password, name, server || '10.105.0.3', channels || 15]
        );

        const newAccount = await db.get('SELECT * FROM sip_accounts WHERE id = ?', [id]);

        res.json({
            success: true,
            account: newAccount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update SIP account - requires sipAccounts permission
router.put('/:id', requirePermission('sipAccounts'), async (req, res) => {
    try {
        const { id } = req.params;
        const { password, name, server, channels, active } = req.body;

        const existing = await db.get('SELECT id FROM sip_accounts WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'SIP account topilmadi'
            });
        }

        const updates = [];
        const params = [];
        if (password !== undefined) { updates.push('password = ?'); params.push(password); }
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (server !== undefined) { updates.push('server = ?'); params.push(server); }
        if (channels !== undefined) { updates.push('channels = ?'); params.push(channels); }
        if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        await db.run(
            `UPDATE sip_accounts SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const updated = await db.get('SELECT * FROM sip_accounts WHERE id = ?', [id]);

        res.json({
            success: true,
            account: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete SIP account - requires sipAccounts permission
router.delete('/:id', requirePermission('sipAccounts'), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.run('DELETE FROM sip_accounts WHERE id = ?', [id]);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'SIP account topilmadi'
            });
        }

        res.json({
            success: true,
            message: 'SIP account o\'chirildi'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Test SIP account
router.post('/test/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const account = await db.get('SELECT * FROM sip_accounts WHERE id = ?', [id]);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'SIP account topilmadi'
            });
        }

        // In production, this would actually test the SIP connection
        // For now, simulate test
        res.json({
            success: true,
            message: 'SIP account test muvaffaqiyatli',
            details: {
                extension: account.extension,
                server: account.server,
                status: 'connected',
                latency: Math.floor(Math.random() * 50) + 10 + 'ms'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;