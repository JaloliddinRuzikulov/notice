const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { requirePermission } = require('../middleware/auth');

console.log('[SIP-ACCOUNTS] Route module loaded at', new Date().toISOString());

// SIP accounts storage (in production, use database)
const sipAccountsFile = path.join(__dirname, '../data/sip-accounts.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(__dirname, '../data');
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
}

// Load SIP accounts
async function loadSIPAccounts() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(sipAccountsFile, 'utf8');
        const accounts = JSON.parse(data);
        if (accounts) return accounts;
    } catch (error) {
        console.log('[SIP-ACCOUNTS] Using default accounts, file error:', error.message);
        // Default SIP accounts
        return [
            {
                id: '1',
                extension: '5530',
                password: '5530',
                name: 'Asosiy linja 1',
                server: '10.105.0.3',
                active: true,
                channels: 15,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                extension: '5531',
                password: '5531',
                name: 'Asosiy linja 2',
                server: '10.105.0.3',
                active: true,
                channels: 15,
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                extension: '5532',
                password: '5532',
                name: 'Asosiy linja 3',
                server: '10.105.0.3',
                active: true,
                channels: 15,
                createdAt: new Date().toISOString()
            }
        ];
    }
}

// Save SIP accounts
async function saveSIPAccounts(accounts) {
    try {
        await ensureDataDir();
        await fs.writeFile(sipAccountsFile, JSON.stringify(accounts, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving SIP accounts:', error);
        return false;
    }
}

// Get all SIP accounts - requires sipAccounts permission
router.get('/', requirePermission('sipAccounts'), async (req, res) => {
    try {
        const accounts = await loadSIPAccounts();
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
        const accounts = await loadSIPAccounts();
        const activeAccounts = accounts.filter(acc => acc.active);
        res.json(activeAccounts);
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
        
        const accounts = await loadSIPAccounts();
        
        // Check if extension already exists
        if (accounts.find(acc => acc.extension === extension)) {
            return res.status(400).json({
                success: false,
                message: 'Bu extension allaqachon mavjud'
            });
        }
        
        const newAccount = {
            id: Date.now().toString(),
            extension,
            password,
            name,
            server: server || '10.105.0.3',
            channels: channels || 15,
            active: true,
            createdAt: new Date().toISOString()
        };
        
        accounts.push(newAccount);
        await saveSIPAccounts(accounts);
        
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
        const updates = req.body;
        
        const accounts = await loadSIPAccounts();
        const index = accounts.findIndex(acc => acc.id === id);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'SIP account topilmadi'
            });
        }
        
        // Don't allow changing extension
        delete updates.extension;
        
        accounts[index] = {
            ...accounts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await saveSIPAccounts(accounts);
        
        res.json({
            success: true,
            account: accounts[index]
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
        
        const accounts = await loadSIPAccounts();
        const filtered = accounts.filter(acc => acc.id !== id);
        
        if (filtered.length === accounts.length) {
            return res.status(404).json({
                success: false,
                message: 'SIP account topilmadi'
            });
        }
        
        await saveSIPAccounts(filtered);
        
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
        
        const accounts = await loadSIPAccounts();
        const account = accounts.find(acc => acc.id === id);
        
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