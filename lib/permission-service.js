/**
 * Permission Service
 * Centralized permission management for the Xabarnoma system
 */

class PermissionService {
    /**
     * Check if a user has permission for a specific module
     * @param {Object} user - User object with role and permissions
     * @param {string} module - Module name to check permission for
     * @returns {boolean} - True if user has permission
     */
    static hasPermission(user, module) {
        if (!user) return false;
        
        // Admins have all permissions
        if (user.role === 'admin') return true;
        
        // Check specific permission
        return user.permissions && user.permissions[module] === true;
    }
    
    /**
     * Get list of modules available to a user
     * @param {Object} user - User object
     * @returns {Array<string>} - Array of module names
     */
    static getAvailableModules(user) {
        if (!user) return [];
        
        // All available modules
        const allModules = [
            'dashboard', 'employees', 'broadcast', 'reports', 
            'sipAccounts', 'phonebook', 'departments', 'groups', 
            'users', 'settings', 'districts', 'sipPhone'
        ];
        
        // Admins get all modules
        if (user.role === 'admin') {
            return allModules;
        }
        
        // Filter based on user permissions
        return Object.keys(user.permissions || {})
            .filter(key => user.permissions[key] === true);
    }
    
    /**
     * Check if user can perform specific action on a module
     * @param {Object} user - User object
     * @param {string} module - Module name
     * @param {string} action - Action name (create, read, update, delete)
     * @returns {boolean} - True if user can perform action
     */
    static canPerformAction(user, module, action) {
        // First check if user has module access
        if (!this.hasPermission(user, module)) {
            return false;
        }
        
        // For now, having module permission means all actions are allowed
        // This can be extended for more granular permissions
        return true;
    }
    
    /**
     * Get permission matrix for UI rendering
     * @param {Object} user - User object
     * @returns {Object} - Permission matrix
     */
    static getPermissionMatrix(user) {
        const modules = {
            dashboard: { label: 'Bosh sahifa', icon: 'fas fa-home' },
            sipPhone: { label: 'SIP Telefon', icon: 'fas fa-phone-alt' },
            broadcast: { label: 'Xabar yuborish', icon: 'fas fa-microphone' },
            employees: { label: 'Xodimlar', icon: 'fas fa-users' },
            reports: { label: 'Hisobotlar', icon: 'fas fa-chart-bar' },
            sipAccounts: { label: 'SIP Raqamlar', icon: 'fas fa-phone-square' },
            phonebook: { label: 'Telefon kitobi', icon: 'fas fa-address-book' },
            departments: { label: 'Bo\'limlar', icon: 'fas fa-building' },
            groups: { label: 'Guruhlar', icon: 'fas fa-layer-group' },
            districts: { label: 'Shahar/Tumanlar', icon: 'fas fa-map-marked-alt' },
            users: { label: 'Foydalanuvchilar', icon: 'fas fa-user-shield' },
            settings: { label: 'Sozlamalar', icon: 'fas fa-cog' }
        };
        
        const matrix = {};
        
        Object.keys(modules).forEach(module => {
            matrix[module] = {
                ...modules[module],
                hasAccess: this.hasPermission(user, module)
            };
        });
        
        return matrix;
    }
    
    /**
     * Validate permission object structure
     * @param {Object} permissions - Permissions object to validate
     * @returns {Object} - Validated permissions object
     */
    static validatePermissions(permissions) {
        const validModules = [
            'dashboard', 'employees', 'broadcast', 'reports', 
            'sipAccounts', 'phonebook', 'departments', 'groups', 
            'users', 'settings', 'districts', 'sipPhone'
        ];
        
        const validated = {};
        
        // Only include valid modules with boolean values
        validModules.forEach(module => {
            if (permissions && typeof permissions[module] === 'boolean') {
                validated[module] = permissions[module];
            } else {
                validated[module] = false;
            }
        });
        
        return validated;
    }
    
    /**
     * Log permission check for audit trail
     * @param {Object} user - User object
     * @param {string} module - Module being accessed
     * @param {boolean} granted - Whether access was granted
     * @param {string} action - Optional action being performed
     */
    static logPermissionCheck(user, module, granted, action = 'access') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userId: user?.id || 'unknown',
            username: user?.username || 'unknown',
            module,
            action,
            granted,
            userRole: user?.role || 'none'
        };
        
        // In production, this would write to a proper audit log
        console.log('[PERMISSION]', JSON.stringify(logEntry));
    }
}

module.exports = PermissionService;