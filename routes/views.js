const express = require('express');
const path = require('path');
const { auth, requirePermission } = require('../middleware/auth');

const router = express.Router();

/**
 * GET / - Dashboard (home page)
 */
router.get('/', auth, (req, res) => {
    res.render('index', { user: req.session.user });
});

/**
 * Test HTML files routes
 */
router.get('/simple-test.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/simple-test.html'));
});

router.get('/xodimlar-final.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/xodimlar-final.html'));
});

router.get('/test-buttons.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/test-buttons.html'));
});

/**
 * GET /sip-phone - SIP Phone page
 */
router.get('/sip-phone', auth, requirePermission('sipPhone'), (req, res) => {
    res.render('sip-phone', { user: req.session.user });
});

/**
 * GET /broadcast - Broadcast page
 */
router.get('/broadcast', auth, requirePermission('broadcast'), (req, res) => {
    res.render('broadcast', { user: req.session.user });
});

/**
 * GET /employees - Employees page
 */
router.get('/employees', auth, requirePermission('employees'), (req, res) => {
    res.render('employees', { user: req.session.user });
});

/**
 * GET /reports - Reports page
 */
router.get('/reports', auth, requirePermission('reports'), (req, res) => {
    res.render('reports', { user: req.session.user });
});

/**
 * GET /sip-accounts - SIP Accounts page
 */
router.get('/sip-accounts', auth, requirePermission('sipAccounts'), (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.render('sip-accounts', {
        user: req.session.user,
        timestamp: Date.now()
    });
});

/**
 * GET /professional-phone - Professional Phone page
 */
router.get('/professional-phone', auth, (req, res) => {
    res.render('professional-phone', { user: req.session.user });
});

/**
 * GET /phonebook - Phonebook page
 */
router.get('/phonebook', auth, requirePermission('phonebook'), (req, res) => {
    res.render('phonebook', { user: req.session.user });
});

/**
 * GET /departments - Departments page
 */
router.get('/departments', auth, requirePermission('departments'), (req, res) => {
    res.render('departments', { user: req.session.user });
});

/**
 * GET /groups - Groups page
 */
router.get('/groups', auth, requirePermission('groups'), (req, res) => {
    res.render('groups', { user: req.session.user });
});

/**
 * GET /districts - Districts page
 */
router.get('/districts', auth, requirePermission('districts'), (req, res) => {
    res.render('districts', { user: req.session.user });
});

/**
 * GET /users - Users page
 */
router.get('/users', auth, requirePermission('users'), (req, res) => {
    res.render('users', { user: req.session.user });
});

/**
 * Handle legacy /recent endpoint
 */
router.get('/recent', auth, (req, res) => {
    res.redirect('/api/broadcast/recent');
});

module.exports = router;
