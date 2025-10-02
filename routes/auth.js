const express = require('express');
const bcrypt = require('bcrypt');
const { AppDataSource } = require('../lib/typeorm-config');
const User = require('../lib/entities/User');

const router = express.Router();

/**
 * GET /login - Login page
 */
router.get('/login', (req, res) => {
    res.render('login');
});

/**
 * POST /login - Handle login
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const userRepository = AppDataSource.getRepository(User);

        // Find active user using TypeORM (NO SQL INJECTION!)
        const user = await userRepository.findOne({
            where: {
                username: username,
                active: true
            }
        });

        if (!user) {
            return res.render('login', { error: 'Login yoki parol xato!' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.render('login', { error: 'Login yoki parol xato!' });
        }

        // Update last login using TypeORM
        user.last_login = new Date();
        await userRepository.save(user);

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.permissions, // Already parsed by transformer
            allowedDistricts: user.allowed_districts // Already parsed by transformer
        };

        // Force session save before redirect
        req.session.save((err) => {
            if (err) {
                console.error('[LOGIN] Session save error:', err);
                return res.render('login', { error: 'Session xatosi!' });
            }
            res.redirect('/');
        });
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login xatosi!' });
    }
});

/**
 * GET /logout - Handle logout
 */
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
