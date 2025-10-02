const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../lib/database');

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
        // Find active user from database
        const user = await db.get(
            'SELECT * FROM users WHERE username = ? AND active = 1',
            [username]
        );

        if (!user) {
            return res.render('login', { error: 'Login yoki parol xato!' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.render('login', { error: 'Login yoki parol xato!' });
        }

        // Update last login
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Parse JSON fields
        const permissions = JSON.parse(user.permissions || '{}');
        const allowedDistricts = JSON.parse(user.allowed_districts || '["all"]');

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: permissions,
            allowedDistricts: allowedDistricts
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
