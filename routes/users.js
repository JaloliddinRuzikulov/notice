const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../lib/database');
const safeFileOps = require('../lib/safe-file-ops');

const permissionsFile = path.join(__dirname, '../data/permissions.json');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await db.all('SELECT * FROM users ORDER BY username');

        // Remove passwords before sending and parse JSON fields
        const safeUsers = users.map(user => {
            const { password, permissions, allowed_districts, ...baseUser } = user;
            return {
                ...baseUser,
                permissions: JSON.parse(permissions || '{}'),
                allowedDistricts: JSON.parse(allowed_districts || '["all"]')
            };
        });

        res.json(safeUsers);
    } catch (error) {
        console.error('Error reading users:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Get permissions info
router.get('/permissions', async (req, res) => {
    try {
        const permissions = await safeFileOps.readJSON(permissionsFile, {});
        res.json(permissions);
    } catch (error) {
        console.error('Error reading permissions:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);

        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        // Remove password and parse JSON fields
        const { password, permissions, allowed_districts, ...baseUser } = user;
        res.json({
            ...baseUser,
            permissions: JSON.parse(permissions || '{}'),
            allowedDistricts: JSON.parse(allowed_districts || '["all"]')
        });
    } catch (error) {
        console.error('Error reading user:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        const { username, password, name, role, permissions, allowedDistricts } = req.body;

        // Validate required fields
        if (!username || !password || !name || !role) {
            return res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi kerak' });
        }

        // Check if username exists
        const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) {
            return res.status(400).json({ error: 'Bu foydalanuvchi nomi band' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = Date.now().toString();

        // Create new user
        await db.run(
            `INSERT INTO users (id, username, password, name, role, permissions, allowed_districts, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                id,
                username,
                hashedPassword,
                name,
                role,
                JSON.stringify(permissions || {}),
                JSON.stringify(allowedDistricts || ['all'])
            ]
        );

        // Get created user and return without password
        const newUser = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        const { password: _, permissions: perms, allowed_districts, ...baseUser } = newUser;

        res.json({
            success: true,
            user: {
                ...baseUser,
                permissions: JSON.parse(perms || '{}'),
                allowedDistricts: JSON.parse(allowed_districts || '["all"]')
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);

        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        const { username, password, name, role, permissions, active, allowedDistricts } = req.body;

        // Check if new username is available
        if (username && username !== user.username) {
            const existing = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.params.id]);
            if (existing) {
                return res.status(400).json({ error: 'Bu foydalanuvchi nomi band' });
            }
        }

        const updates = [];
        const params = [];
        if (username) { updates.push('username = ?'); params.push(username); }
        if (password) { updates.push('password = ?'); params.push(await bcrypt.hash(password, 10)); }
        if (name) { updates.push('name = ?'); params.push(name); }
        if (role) { updates.push('role = ?'); params.push(role); }
        if (permissions) { updates.push('permissions = ?'); params.push(JSON.stringify(permissions)); }
        if (typeof active === 'boolean') { updates.push('active = ?'); params.push(active ? 1 : 0); }
        if (allowedDistricts) { updates.push('allowed_districts = ?'); params.push(JSON.stringify(allowedDistricts)); }
        params.push(req.params.id);

        await db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        // Get updated user
        const updated = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
        const { password: _, permissions: perms, allowed_districts, ...baseUser } = updated;

        res.json({
            success: true,
            user: {
                ...baseUser,
                permissions: JSON.parse(perms || '{}'),
                allowedDistricts: JSON.parse(allowed_districts || '["all"]')
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const userToDelete = await db.get('SELECT * FROM users WHERE id = ?', [req.params.id]);

        if (!userToDelete) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        // Don't allow deleting the last admin
        if (userToDelete.role === 'admin') {
            const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
            if (adminCount.count === 1) {
                return res.status(400).json({ error: 'Oxirgi administratorni o\'chirish mumkin emas' });
            }
        }

        await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Check user permissions
router.post('/check-permission', async (req, res) => {
    try {
        const { module } = req.body;
        const user = req.session?.user;
        
        if (!user) {
            return res.json({ hasPermission: false });
        }
        
        // Admins have all permissions
        if (user.role === 'admin') {
            return res.json({ hasPermission: true });
        }
        
        // Check specific permission
        const hasPermission = user.permissions && user.permissions[module] === true;
        res.json({ hasPermission });
    } catch (error) {
        console.error('Error checking permission:', error);
        res.json({ hasPermission: false });
    }
});

// Get current user info
router.get('/current', async (req, res) => {
    try {
        const user = req.session?.user;
        
        if (!user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        // Return user info without password
        res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.permissions
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;