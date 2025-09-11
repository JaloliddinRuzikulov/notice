const PermissionService = require('../lib/permission-service');

// Authentication middleware
const auth = (req, res, next) => {
    // Minimal debug logging
    // console.log(`[AUTH] ${req.method} ${req.path}`);
    
    // Check if user is authenticated
    if (!req.session || !req.session.user) {
        // Check if this is an AJAX request
        const isAjax = req.xhr || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                      req.headers['content-type']?.includes('application/json') ||
                      req.headers['content-type']?.includes('multipart/form-data') ||
                      req.path.startsWith('/api/');
        
        // console.log('[AUTH] No session/user found. Is AJAX:', isAjax);
        
        if (isAjax) {
            // For AJAX/API requests, return JSON error
            return res.status(401).json({
                success: false,
                message: 'Autentifikatsiya talab qilinadi'
            });
        }
        
        // For page routes, redirect to login
        return res.redirect('/login');
    }
    
    // User is authenticated
    req.user = req.session.user;
    next();
};

// Admin check middleware
const adminAuth = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin huquqi talab qilinadi'
        });
    }
    next();
};

// Permission check middleware factory
const requirePermission = (module) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            PermissionService.logPermissionCheck(null, module, false, req.method);
            
            // Check if this is an AJAX request
            const isAjax = req.xhr || 
                          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                          req.headers['content-type']?.includes('application/json') ||
                          req.path.startsWith('/api/');
            
            if (isAjax) {
                return res.status(401).json({
                    success: false,
                    message: 'Autentifikatsiya talab qilinadi'
                });
            }
            
            // For page routes, redirect to login
            return res.redirect('/login');
        }
        
        const user = req.session.user;
        const hasPermission = PermissionService.hasPermission(user, module);
        
        // Log the permission check
        PermissionService.logPermissionCheck(user, module, hasPermission, req.method);
        
        if (!hasPermission) {
            // Check if this is an AJAX request
            const isAjax = req.xhr || 
                          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                          req.headers['content-type']?.includes('application/json') ||
                          req.path.startsWith('/api/');
            
            if (isAjax) {
                return res.status(403).json({
                    success: false,
                    message: `Sizda ${module} bo'limiga kirish huquqi yo'q`
                });
            }
            
            // For page routes, redirect to home with error message
            return res.redirect('/?error=permission_denied');
        }
        
        // Permission granted
        req.user = user;
        next();
    };
};

// District access check middleware
const checkDistrictAccess = (getDistrictFromRequest) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Autentifikatsiya talab qilinadi'
            });
        }
        
        const user = req.session.user;
        
        // Admins have access to all districts
        if (user.role === 'admin') {
            req.userCanAccessAllDistricts = true;
            req.userAllowedDistricts = ['all'];
            console.log(`[checkDistrictAccess] Admin user: ${user.username}`);
            return next();
        }
        
        // Get allowed districts for the user
        const allowedDistricts = user.allowedDistricts || [];
        
        // If user has access to all districts
        if (allowedDistricts.includes('all')) {
            req.userCanAccessAllDistricts = true;
            return next();
        }
        
        // Get the district being accessed from the request
        const requestedDistrict = getDistrictFromRequest ? getDistrictFromRequest(req) : null;
        
        // If a specific district is being accessed, check if user has permission
        if (requestedDistrict && !allowedDistricts.includes(requestedDistrict)) {
            return res.status(403).json({
                success: false,
                message: 'Sizda bu tumanga kirish huquqi yo\'q'
            });
        }
        
        // Store allowed districts in request for later use
        req.userAllowedDistricts = allowedDistricts;
        req.userCanAccessAllDistricts = false;
        
        console.log(`[checkDistrictAccess] User: ${user.username}, Role: ${user.role}, Allowed Districts:`, allowedDistricts);
        
        next();
    };
};

// Filter data by district access
const filterByDistrictAccess = (data, districtField = 'district') => {
    return (req, res, next) => {
        // If user can access all districts, no filtering needed
        if (req.userCanAccessAllDistricts) {
            return next();
        }
        
        // Filter the data based on allowed districts
        const allowedDistricts = req.userAllowedDistricts || [];
        
        if (req.body && Array.isArray(req.body)) {
            req.body = req.body.filter(item => 
                !item[districtField] || allowedDistricts.includes(item[districtField])
            );
        }
        
        next();
    };
};

module.exports = {
    auth,
    adminAuth,
    requirePermission,
    checkDistrictAccess,
    filterByDistrictAccess
};