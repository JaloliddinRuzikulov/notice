/**
 * Client-side permission checking utility
 * Provides functions to check user permissions from the frontend
 */

class PermissionChecker {
    constructor() {
        this.permissionCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Check if current user has permission for a module
     * @param {string} module - Module name to check
     * @returns {Promise<boolean>} - True if user has permission
     */
    async hasPermission(module) {
        // Check cache first
        const cached = this.permissionCache.get(module);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.hasPermission;
        }

        try {
            const response = await fetch('/api/users/check-permission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ module })
            });

            if (!response.ok) {
                console.error('Permission check failed:', response.status);
                return false;
            }

            const data = await response.json();
            
            // Cache the result
            this.permissionCache.set(module, {
                hasPermission: data.hasPermission,
                timestamp: Date.now()
            });

            return data.hasPermission;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }

    /**
     * Check multiple permissions at once
     * @param {Array<string>} modules - Array of module names
     * @returns {Promise<Object>} - Object with module names as keys and boolean permissions as values
     */
    async hasPermissions(modules) {
        const results = {};
        
        // Check all permissions in parallel
        const promises = modules.map(async module => {
            results[module] = await this.hasPermission(module);
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Show/hide elements based on permissions
     * Elements should have data-permission attribute with module name
     */
    async updateUIPermissions() {
        const elements = document.querySelectorAll('[data-permission]');
        const modulesToCheck = new Set();

        // Collect all unique modules
        elements.forEach(el => {
            const permission = el.getAttribute('data-permission');
            if (permission) {
                modulesToCheck.add(permission);
            }
        });

        // Check all permissions
        const permissions = await this.hasPermissions(Array.from(modulesToCheck));

        // Update UI
        elements.forEach(el => {
            const permission = el.getAttribute('data-permission');
            const hasPermission = permissions[permission];
            
            if (hasPermission) {
                el.style.display = '';
                el.classList.remove('permission-hidden');
            } else {
                el.style.display = 'none';
                el.classList.add('permission-hidden');
            }
        });
    }

    /**
     * Clear permission cache
     */
    clearCache() {
        this.permissionCache.clear();
    }

    /**
     * Check if user is admin
     * @returns {Promise<boolean>}
     */
    async isAdmin() {
        try {
            const response = await fetch('/api/users/current', {
                credentials: 'same-origin'
            });

            if (!response.ok) {
                return false;
            }

            const user = await response.json();
            return user.role === 'admin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    /**
     * Disable form elements if user doesn't have permission
     * @param {string} formId - ID of the form
     * @param {string} module - Module name to check
     */
    async protectForm(formId, module) {
        const hasPermission = await this.hasPermission(module);
        const form = document.getElementById(formId);
        
        if (!form) return;

        if (!hasPermission) {
            // Disable all form inputs
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = true;
            });

            // Add warning message
            const warning = document.createElement('div');
            warning.className = 'alert alert-warning permission-warning';
            warning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sizda bu bo\'limni tahrirlash huquqi yo\'q';
            form.insertBefore(warning, form.firstChild);
        }
    }
}

// Create global instance
window.permissionChecker = new PermissionChecker();

// Auto-update UI permissions on page load
document.addEventListener('DOMContentLoaded', () => {
    window.permissionChecker.updateUIPermissions();
});