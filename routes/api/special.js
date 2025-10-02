const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { auth, requirePermission } = require('../../middleware/auth');
const localization = require('../../lib/localization');

const router = express.Router();

/**
 * GET /api/sip-accounts/active
 * Special route for active SIP accounts (accessible to broadcast users)
 */
router.get('/sip-accounts/active', auth, requirePermission('broadcast'), async (req, res) => {
    try {
        const safeFileOps = require('../../lib/safe-file-ops');
        const sipAccountsFile = path.join(__dirname, '../../data/sip-accounts.json');

        // Load SIP accounts
        let accounts;
        try {
            accounts = await safeFileOps.readJSON(sipAccountsFile, null);
        } catch (error) {
            // Default SIP accounts if file doesn't exist
            accounts = [
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

        if (!accounts) {
            accounts = [];
        }

        const activeAccounts = accounts.filter(acc => acc.active);
        res.json(activeAccounts);
    } catch (error) {
        console.error('Error loading active SIP accounts:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/districts-list
 * Special route for users page to get districts list without districts permission
 */
router.get('/districts-list', auth, async (req, res) => {
    try {
        const data = await fs.readFile(
            path.join(__dirname, '../../data/districts.json'),
            'utf8'
        );
        const districts = JSON.parse(data);
        res.setHeader('Content-Type', 'application/json');
        res.json(districts);
    } catch (error) {
        console.error('Error reading districts:', error);
        res.setHeader('Content-Type', 'application/json');
        res.json([]);
    }
});

/**
 * GET /api/employees-departments
 * Special route for departments page to get employees list
 */
router.get('/employees-departments', auth, requirePermission('departments'), async (req, res) => {
    try {
        const data = await fs.readFile(
            path.join(__dirname, '../../data/departments.json'),
            'utf8'
        );
        const departments = JSON.parse(data);
        res.json(departments);
    } catch (error) {
        console.error('Error reading departments:', error);
        res.json([]);
    }
});

/**
 * GET /api/employees-districts
 * Special route for districts page
 */
router.get('/employees-districts', auth, requirePermission('districts'), async (req, res) => {
    try {
        const data = await fs.readFile(
            path.join(__dirname, '../../data/districts.json'),
            'utf8'
        );
        const districts = JSON.parse(data);
        res.json(districts);
    } catch (error) {
        console.error('Error reading districts:', error);
        res.json([]);
    }
});

/**
 * GET /api/employees-dashboard
 * Special route for dashboard (home page)
 */
router.get('/employees-dashboard', auth, async (req, res) => {
    try {
        const data = await fs.readFile(
            path.join(__dirname, '../../data/employees.json'),
            'utf8'
        );
        const employees = JSON.parse(data);
        const activeEmployees = employees.filter(emp => !emp.deleted);
        res.json(activeEmployees);
    } catch (error) {
        console.error('Error reading employees for dashboard:', error);
        res.json([]);
    }
});

/**
 * GET /api/employees-groups
 * Special route for groups page
 */
router.get('/employees-groups', auth, requirePermission('groups'), async (req, res) => {
    try {
        const data = await fs.readFile(
            path.join(__dirname, '../../data/groups.json'),
            'utf8'
        );
        const groups = JSON.parse(data);
        res.json(groups);
    } catch (error) {
        console.error('Error reading groups:', error);
        res.json([]);
    }
});

/**
 * GET /api/employees-broadcast
 * Special route for broadcast page to get employees list for users with broadcast permission
 */
router.get('/employees-broadcast', auth, requirePermission('broadcast'), async (req, res) => {
    try {
        console.log('[EMPLOYEES-BROADCAST] Request from user:', req.session?.user?.username, 'Role:', req.session?.user?.role);

        const dataPath = path.join(__dirname, '../../data/employees.json');
        console.log('[EMPLOYEES-BROADCAST] Reading from:', dataPath);

        const data = await fs.readFile(dataPath, 'utf8');
        const employees = JSON.parse(data);
        console.log('[EMPLOYEES-BROADCAST] Total employees:', employees.length);

        // Filter employees based on user's allowed districts
        const user = req.session.user;
        let filteredEmployees = employees;

        if (user.role !== 'admin' && user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            // Load districts to map IDs to names
            const districtsPath = path.join(__dirname, '../../data/districts.json');
            const districtsData = await fs.readFile(districtsPath, 'utf8');
            const districts = JSON.parse(districtsData);

            // Create mapping of district IDs to names
            const districtIdToName = {};
            districts.forEach(d => {
                districtIdToName[d.id] = d.name;
            });

            // Get allowed district names
            const allowedDistrictNames = user.allowedDistricts.map(id =>
                districtIdToName[id] || id
            );

            console.log('[EMPLOYEES-BROADCAST] User allowed districts:', user.allowedDistricts);
            console.log('[EMPLOYEES-BROADCAST] Mapped to names:', allowedDistrictNames);

            filteredEmployees = employees.filter(emp =>
                allowedDistrictNames.includes(emp.district)
            );
            console.log('[EMPLOYEES-BROADCAST] Filtered to:', filteredEmployees.length, 'employees');
        }

        res.setHeader('Content-Type', 'application/json');
        res.json(filteredEmployees);
    } catch (error) {
        console.error('[EMPLOYEES-BROADCAST] Error:', error);
        res.setHeader('Content-Type', 'application/json');
        res.json([]);
    }
});

/**
 * GET /api/groups-broadcast
 * Special route for broadcast page to get groups list for users with broadcast permission
 */
router.get('/groups-broadcast', auth, requirePermission('broadcast'), async (req, res) => {
    try {
        const data = await fs.readFile(
            path.join(__dirname, '../../data/groups.json'),
            'utf8'
        );
        const groups = JSON.parse(data);
        res.setHeader('Content-Type', 'application/json');
        res.json(groups);
    } catch (error) {
        console.error('Error reading groups for broadcast:', error);
        res.setHeader('Content-Type', 'application/json');
        res.json([]);
    }
});

/**
 * GET /api/translations
 * Localization API endpoint with direct file loading as fallback
 */
router.get('/translations', (req, res) => {
    // Get locale from request
    const locale = req.query.locale || req.session?.locale || req.cookies?.locale || 'uz-latin';

    // Try to load translations directly if module cache is empty
    if (!localization.locales || Object.keys(localization.locales).length === 0) {
        console.log('[API] Localization module empty, loading directly...');
        try {
            const localeFile = path.join(__dirname, '../../locales', `${locale}.json`);
            const fallbackFile = path.join(__dirname, '../../locales', 'uz-latin.json');

            let translations = null;
            if (require('fs').existsSync(localeFile)) {
                translations = JSON.parse(require('fs').readFileSync(localeFile, 'utf8'));
            } else if (require('fs').existsSync(fallbackFile)) {
                translations = JSON.parse(require('fs').readFileSync(fallbackFile, 'utf8'));
            }

            if (translations) {
                res.json({
                    locale: locale,
                    translations: translations
                });
                return;
            }
        } catch (err) {
            console.error('[API] Error loading translations directly:', err);
        }
    }

    // Use normal endpoint
    localization.translationsEndpoint(req, res);
});

/**
 * GET /api/user-info
 * User info endpoint - no permission check needed, just auth
 */
router.get('/user-info', auth, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.session.user.id,
            username: req.session.user.username,
            name: req.session.user.name,
            role: req.session.user.role,
            permissions: req.session.user.permissions,
            allowedDistricts: req.session.user.allowedDistricts || ['all']
        }
    });
});

/**
 * GET /api/dashboard-stats
 * Dashboard statistics endpoint - no permission check needed, just auth
 */
router.get('/dashboard-stats', auth, async (req, res) => {
    try {
        const [empData, distData] = await Promise.all([
            fs.readFile(path.join(__dirname, '../../data/employees.json'), 'utf8'),
            fs.readFile(path.join(__dirname, '../../data/districts.json'), 'utf8')
        ]);

        let employees = JSON.parse(empData);
        const districts = JSON.parse(distData);

        // Check user's district permissions
        const user = req.session.user;
        if (user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            // Create mapping of district IDs to names
            const districtIdToName = {};
            districts.forEach(d => {
                districtIdToName[d.id] = d.name;
            });

            // Get allowed district names
            const allowedDistrictNames = user.allowedDistricts.map(id =>
                districtIdToName[id] || id
            );

            employees = employees.filter(emp => {
                return allowedDistrictNames.includes(emp.district);
            });
        }

        // Filter out deleted employees
        employees = employees.filter(emp => !emp.deleted);

        res.json({
            success: true,
            employees: employees,
            districts: districts
        });
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Dashboard statistikasini yuklashda xatolik'
        });
    }
});

module.exports = router;
