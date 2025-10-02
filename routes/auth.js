const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

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
        // Read users from users.json
        const usersData = await fs.readFile(
            path.join(__dirname, '../data/users.json'),
            'utf8'
        );
        const users = JSON.parse(usersData);

        // Find active user
        const user = users.find(u => u.username === username && u.active);

        if (!user) {
            return res.render('login', { error: 'Login yoki parol xato!' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.render('login', { error: 'Login yoki parol xato!' });
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        await fs.writeFile(
            path.join(__dirname, '../data/users.json'),
            JSON.stringify(users, null, 2)
        );

        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            allowedDistricts: user.allowedDistricts || ['all']
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
