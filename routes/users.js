const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const safeFileOps = require('../lib/safe-file-ops');

const usersFile = path.join(__dirname, '../data/users.json');
const permissionsFile = path.join(__dirname, '../data/permissions.json');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await safeFileOps.readJSON(usersFile, []);
        
        // Remove passwords before sending
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
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
        const users = await safeFileOps.readJSON(usersFile, []);
        const user = users.find(u => u.id === req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }
        
        // Remove password
        const { password, ...safeUser } = user;
        res.json(safeUser);
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
        
        // Read existing users
        const users = await safeFileOps.readJSON(usersFile, []);
        
        // Check if username exists
        if (users.some(u => u.username === username)) {
            return res.status(400).json({ error: 'Bu foydalanuvchi nomi band' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            password: hashedPassword,
            name,
            role,
            permissions: permissions || {},
            allowedDistricts: allowedDistricts || ['all'], // 'all' means access to all districts
            active: true,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        await safeFileOps.writeJSON(usersFile, users);
        
        // Return without password
        const { password: _, ...safeUser } = newUser;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const users = await safeFileOps.readJSON(usersFile, []);
        const index = users.findIndex(u => u.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }
        
        const { username, password, name, role, permissions, active, allowedDistricts } = req.body;
        const user = users[index];
        
        // Update fields
        if (username && username !== user.username) {
            // Check if new username is available
            if (users.some(u => u.username === username && u.id !== user.id)) {
                return res.status(400).json({ error: 'Bu foydalanuvchi nomi band' });
            }
            user.username = username;
        }
        
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        
        if (name) user.name = name;
        if (role) user.role = role;
        if (permissions) user.permissions = permissions;
        if (typeof active === 'boolean') user.active = active;
        if (allowedDistricts) user.allowedDistricts = allowedDistricts;
        
        users[index] = user;
        await safeFileOps.writeJSON(usersFile, users);
        
        // Return without password
        const { password: _, ...safeUser } = user;
        res.json({ success: true, user: safeUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const users = await safeFileOps.readJSON(usersFile, []);
        
        // Don't allow deleting the last admin
        const admins = users.filter(u => u.role === 'admin');
        const userToDelete = users.find(u => u.id === req.params.id);
        
        if (userToDelete && userToDelete.role === 'admin' && admins.length === 1) {
            return res.status(400).json({ error: 'Oxirgi administratorni o\'chirish mumkin emas' });
        }
        
        const filteredUsers = users.filter(u => u.id !== req.params.id);
        
        if (filteredUsers.length === users.length) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }
        
        await safeFileOps.writeJSON(usersFile, filteredUsers);
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