const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { auth, requirePermission } = require('../../middleware/auth');
const localization = require('../../lib/localization');
const { AppDataSource, initializeDatabase } = require('../../lib/typeorm-config');

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
        await initializeDatabase();
        const districtRepo = AppDataSource.getRepository('District');
        const districts = await districtRepo.find({
            order: { name: 'ASC' }
        });

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
        await initializeDatabase();
        const departmentRepo = AppDataSource.getRepository('Department');
        const departments = await departmentRepo.find({
            order: { name: 'ASC' }
        });

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
        await initializeDatabase();
        const districtRepo = AppDataSource.getRepository('District');
        const districts = await districtRepo.find({
            order: { name: 'ASC' }
        });

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
        await initializeDatabase();
        const employeeRepo = AppDataSource.getRepository('Employee');
        const activeEmployees = await employeeRepo.find({
            where: { deleted: false },
            order: { name: 'ASC' }
        });

        // Map database fields to JSON format for compatibility
        const employees = activeEmployees.map(emp => ({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            rank: emp.rank,
            department: emp.department,
            phoneNumber: emp.phone_number,
            servicePhone: emp.service_phone,
            district: emp.district,
            createdAt: emp.created_at,
            updatedAt: emp.updated_at,
            deleted: emp.deleted
        }));

        res.json(employees);
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
        await initializeDatabase();
        const groupRepo = AppDataSource.getRepository('Group');
        const groups = await groupRepo.find({
            order: { name: 'ASC' }
        });

        // Map database fields to JSON format for compatibility
        const groupsData = groups.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            members: g.members, // Already transformed by TypeORM
            district: g.district,
            createdBy: g.created_by,
            createdAt: g.created_at
        }));

        res.json(groupsData);
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

        await initializeDatabase();
        const employeeRepo = AppDataSource.getRepository('Employee');
        const districtRepo = AppDataSource.getRepository('District');

        // Filter employees based on user's allowed districts
        const user = req.session.user;
        let employees;

        if (user.role !== 'admin' && user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            // Load districts to map IDs to names
            const districts = await districtRepo.find();
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

            // Query with district filter
            const queryBuilder = employeeRepo.createQueryBuilder('employee');
            queryBuilder.where('employee.deleted = :deleted', { deleted: false });

            if (allowedDistrictNames.length > 0) {
                queryBuilder.andWhere('employee.district IN (:...districts)', { districts: allowedDistrictNames });
            }

            employees = await queryBuilder.orderBy('employee.name', 'ASC').getMany();
            console.log('[EMPLOYEES-BROADCAST] Filtered to:', employees.length, 'employees');
        } else {
            // Admin or user with 'all' districts - get all non-deleted employees
            employees = await employeeRepo.find({
                where: { deleted: false },
                order: { name: 'ASC' }
            });
            console.log('[EMPLOYEES-BROADCAST] Total employees:', employees.length);
        }

        // Map database fields to JSON format for compatibility
        const employeesData = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            rank: emp.rank,
            department: emp.department,
            phoneNumber: emp.phone_number,
            servicePhone: emp.service_phone,
            district: emp.district,
            createdAt: emp.created_at,
            updatedAt: emp.updated_at,
            deleted: emp.deleted
        }));

        res.setHeader('Content-Type', 'application/json');
        res.json(employeesData);
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
        await initializeDatabase();
        const groupRepo = AppDataSource.getRepository('Group');
        const groups = await groupRepo.find({
            order: { name: 'ASC' }
        });

        // Map database fields to JSON format for compatibility
        const groupsData = groups.map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            members: g.members,
            district: g.district,
            createdBy: g.created_by,
            createdAt: g.created_at
        }));

        res.setHeader('Content-Type', 'application/json');
        res.json(groupsData);
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
        await initializeDatabase();
        const employeeRepo = AppDataSource.getRepository('Employee');
        const districtRepo = AppDataSource.getRepository('District');

        const districts = await districtRepo.find({ order: { name: 'ASC' } });

        // Check user's district permissions
        const user = req.session.user;
        let employees;

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

            // Query with district filter and non-deleted
            const queryBuilder = employeeRepo.createQueryBuilder('employee');
            queryBuilder.where('employee.deleted = :deleted', { deleted: false });

            if (allowedDistrictNames.length > 0) {
                queryBuilder.andWhere('employee.district IN (:...districts)', { districts: allowedDistrictNames });
            }

            employees = await queryBuilder.orderBy('employee.name', 'ASC').getMany();
        } else {
            // Admin or user with 'all' districts
            employees = await employeeRepo.find({
                where: { deleted: false },
                order: { name: 'ASC' }
            });
        }

        // Map database fields to JSON format for compatibility
        const employeesData = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            rank: emp.rank,
            department: emp.department,
            phoneNumber: emp.phone_number,
            servicePhone: emp.service_phone,
            district: emp.district,
            createdAt: emp.created_at,
            updatedAt: emp.updated_at,
            deleted: emp.deleted
        }));

        res.json({
            success: true,
            employees: employeesData,
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
