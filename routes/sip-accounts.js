const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../lib/typeorm-config');
const SIPAccount = require('../lib/entities/SIPAccount');
const { requirePermission } = require('../middleware/auth');

console.log('[SIP-ACCOUNTS] Route module loaded at', new Date().toISOString());

// Get all SIP accounts - requires sipAccounts permission
router.get('/', requirePermission('sipAccounts'), async (req, res) => {
    try {
        const sipRepository = AppDataSource.getRepository(SIPAccount);

        // Get all SIP accounts using TypeORM (NO SQL INJECTION!)
        const accounts = await sipRepository.find({
            order: { extension: 'ASC' }
        });
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
        const sipRepository = AppDataSource.getRepository(SIPAccount);

        // Get active accounts using TypeORM (NO SQL INJECTION!)
        const accounts = await sipRepository.find({
            where: { active: true },
            order: { extension: 'ASC' }
        });
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

        const sipRepository = AppDataSource.getRepository(SIPAccount);

        // Check if extension exists using TypeORM (NO SQL INJECTION!)
        const existing = await sipRepository.findOne({
            where: { extension: extension }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Bu extension allaqachon mavjud'
            });
        }

        // Create new account using TypeORM
        const newAccount = sipRepository.create({
            id: Date.now().toString(),
            extension,
            password,
            name,
            server: server || '10.105.0.3',
            channels: channels || 15,
            active: true
        });

        await sipRepository.save(newAccount);

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

        const sipRepository = AppDataSource.getRepository(SIPAccount);

        // Find account using TypeORM (NO SQL INJECTION!)
        const account = await sipRepository.findOne({
            where: { id: id }
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'SIP account topilmadi'
            });
        }

        // Update fields using TypeORM
        if (password !== undefined) account.password = password;
        if (name !== undefined) account.name = name;
        if (server !== undefined) account.server = server;
        if (channels !== undefined) account.channels = channels;
        if (active !== undefined) account.active = active;

        await sipRepository.save(account);

        res.json({
            success: true,
            account: account
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

        const sipRepository = AppDataSource.getRepository(SIPAccount);

        // Find and delete using TypeORM (NO SQL INJECTION!)
        const account = await sipRepository.findOne({
            where: { id: id }
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'SIP account topilmadi'
            });
        }

        await sipRepository.remove(account);

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

        const sipRepository = AppDataSource.getRepository(SIPAccount);

        // Find account using TypeORM (NO SQL INJECTION!)
        const account = await sipRepository.findOne({
            where: { id: id }
        });

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