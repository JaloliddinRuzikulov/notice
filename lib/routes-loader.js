const { auth, requirePermission } = require('../middleware/auth');

/**
 * Load and register all application routes
 * @param {express.Application} app - Express app instance
 */
function loadRoutes(app) {
    // ==================== AUTH & VIEW ROUTES ====================

    // Auth routes (login, logout)
    app.use('/', require('../routes/auth'));

    // View routes (pages)
    app.use('/', require('../routes/views'));

    // ==================== SPECIAL API ROUTES ====================

    // Special API routes (user-info, dashboard-stats, etc.)
    app.use('/api', require('../routes/api/special'));

    // ==================== MAIN API ROUTES ====================

    // SIP routes
    app.use('/api/sip', auth, requirePermission('sipPhone'), require('../routes/sip'));
    app.use('/api/sip-accounts', auth, require('../routes/sip-accounts'));

    // Broadcast route
    app.use('/api/broadcast', auth, requirePermission('broadcast'), require('../routes/broadcast-simple'));

    // Employees route (database or JSON version)
    const useDatabase = true; // SQLite migration completed!
    console.log('[ROUTES] Using employees route:', useDatabase ? 'employees-db' : 'employees');
    app.use('/api/employees', auth, requirePermission('employees'),
        require(useDatabase ? '../routes/employees-db' : '../routes/employees'));

    // CRUD routes
    app.use('/api/groups', auth, requirePermission('groups'), require('../routes/groups'));
    app.use('/api/departments', auth, requirePermission('departments'), require('../routes/departments'));
    app.use('/api/districts', auth, requirePermission('districts'), require('../routes/districts'));
    app.use('/api/users', auth, requirePermission('users'), require('../routes/users'));

    // Utility routes
    app.use('/api/test', auth, require('../routes/test'));
    app.use('/api/excel-template', auth, require('../routes/excel-template'));
    app.use('/api/phonebook', auth, requirePermission('phonebook'), require('../routes/phonebook'));
    app.use('/api/system', auth, requirePermission('reports'), require('../routes/system-stats'));
    app.use('/api/test-auth', require('../routes/test-auth'));
}

module.exports = { loadRoutes };
