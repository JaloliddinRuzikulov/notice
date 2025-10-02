const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const { AppDataSource } = require('../lib/typeorm-config');
const User = require('../lib/entities/User');
const safeFileOps = require('../lib/safe-file-ops');

const permissionsFile = path.join(__dirname, '../data/permissions.json');

// Get all users
router.get('/', async (req, res) => {
    try {
        const userRepository = AppDataSource.getRepository(User);

        // Get all users using TypeORM (NO SQL INJECTION!)
        const users = await userRepository.find({
            order: { username: 'ASC' }
        });

        // Remove passwords before sending
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user;
            return {
                ...safeUser,
                allowedDistricts: safeUser.allowed_districts
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
        const userRepository = AppDataSource.getRepository(User);

        // Find user by ID using TypeORM (NO SQL INJECTION!)
        const user = await userRepository.findOne({
            where: { id: req.params.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        // Remove password
        const { password, ...safeUser } = user;
        res.json({
            ...safeUser,
            allowedDistricts: safeUser.allowed_districts
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

        const userRepository = AppDataSource.getRepository(User);

        // Check if username exists using TypeORM (NO SQL INJECTION!)
        const existing = await userRepository.findOne({
            where: { username: username }
        });
        if (existing) {
            return res.status(400).json({ error: 'Bu foydalanuvchi nomi band' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user using TypeORM
        const newUser = userRepository.create({
            id: Date.now().toString(),
            username,
            password: hashedPassword,
            name,
            role,
            permissions: permissions || {},
            allowed_districts: allowedDistricts || ['all'],
            active: true
        });

        await userRepository.save(newUser);

        // Return without password
        const { password: _, ...safeUser } = newUser;
        res.json({
            success: true,
            user: {
                ...safeUser,
                allowedDistricts: safeUser.allowed_districts
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
        const userRepository = AppDataSource.getRepository(User);

        // Find user using TypeORM (NO SQL INJECTION!)
        const user = await userRepository.findOne({
            where: { id: req.params.id }
        });

        if (!user) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        const { username, password, name, role, permissions, active, allowedDistricts } = req.body;

        // Check if new username is available
        if (username && username !== user.username) {
            const existing = await userRepository.findOne({
                where: { username: username }
            });
            if (existing && existing.id !== user.id) {
                return res.status(400).json({ error: 'Bu foydalanuvchi nomi band' });
            }
        }

        // Update fields using TypeORM
        if (username) user.username = username;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (name) user.name = name;
        if (role) user.role = role;
        if (permissions) user.permissions = permissions;
        if (typeof active === 'boolean') user.active = active;
        if (allowedDistricts) user.allowed_districts = allowedDistricts;

        await userRepository.save(user);

        // Return without password
        const { password: _, ...safeUser } = user;
        res.json({
            success: true,
            user: {
                ...safeUser,
                allowedDistricts: safeUser.allowed_districts
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
        const userRepository = AppDataSource.getRepository(User);

        // Find user using TypeORM (NO SQL INJECTION!)
        const userToDelete = await userRepository.findOne({
            where: { id: req.params.id }
        });

        if (!userToDelete) {
            return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
        }

        // Don't allow deleting the last admin
        if (userToDelete.role === 'admin') {
            const adminCount = await userRepository.count({
                where: { role: 'admin' }
            });
            if (adminCount === 1) {
                return res.status(400).json({ error: 'Oxirgi administratorni o\'chirish mumkin emas' });
            }
        }

        await userRepository.remove(userToDelete);
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