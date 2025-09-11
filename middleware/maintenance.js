/**
 * Maintenance Mode Middleware
 * Shows maintenance banner to all users except admin
 */

const maintenanceMode = (req, res, next) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        return next();
    }
    
    // Admin users can access normally
    if (req.session.user.username === 'admin') {
        res.locals.maintenanceMode = false;
        return next();
    }
    
    // For all other users, show maintenance banner
    res.locals.maintenanceMode = true;
    res.locals.maintenanceMessage = 'Xurmatli Foydalanuvchilar! Tizimda profilaktik ishlar olib borilmoqda.';
    
    next();
};

module.exports = maintenanceMode;