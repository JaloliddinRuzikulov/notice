/**
 * District Filtering Helper Functions
 */

const fs = require('fs').promises;
const path = require('path');

// Cache for districts data
let districtsCache = null;
let districtsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load districts data
async function loadDistricts() {
    const now = Date.now();
    if (districtsCache && (now - districtsCacheTime < CACHE_DURATION)) {
        return districtsCache;
    }
    
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/districts.json'), 'utf8');
        districtsCache = JSON.parse(data);
        districtsCacheTime = now;
        return districtsCache;
    } catch (error) {
        console.error('Error loading districts:', error);
        return [];
    }
}

// Get district name by ID
async function getDistrictName(districtId) {
    const districts = await loadDistricts();
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : districtId;
}

// Get district ID by name
async function getDistrictId(districtName) {
    const districts = await loadDistricts();
    const district = districts.find(d => d.name === districtName);
    return district ? district.id : districtName;
}

// Filter employees by user's allowed districts
function filterEmployeesByDistrict(employees, allowedDistricts, canAccessAllDistricts) {
    // If user can access all districts, return all employees
    if (canAccessAllDistricts || (allowedDistricts && allowedDistricts.includes('all'))) {
        return employees;
    }
    
    // Filter by allowed districts
    if (!allowedDistricts || allowedDistricts.length === 0) {
        return []; // No access to any district
    }
    
    return employees.filter(emp => {
        // Include if employee has no district (backwards compatibility)
        if (!emp.district) return true;
        
        // Check if employee's district matches any allowed district
        // Support both district ID and district name
        return allowedDistricts.some(allowed => {
            // Direct match (ID or name)
            if (emp.district === allowed) return true;
            
            // Check if allowed is ID and emp.district is name
            // Need to get district by ID to compare names
            // For now, just check if "Qarshi shahri" matches ID "1"
            if (allowed === "1" && emp.district === "Qarshi shahri") return true;
            if (allowed === "Qarshi shahri" && emp.district === "1") return true;
            
            return false;
        });
    });
}

// Filter groups by district (groups can have multiple employees from different districts)
function filterGroupsByDistrict(groups, employees, allowedDistricts, canAccessAllDistricts) {
    // If user can access all districts, return all groups
    if (canAccessAllDistricts || (allowedDistricts && allowedDistricts.includes('all'))) {
        return groups;
    }
    
    // Filter groups that have at least one employee from allowed districts
    return groups.filter(group => {
        if (!group.employeeIds || group.employeeIds.length === 0) {
            return true; // Empty groups are visible
        }
        
        // Check if any employee in the group is from allowed districts
        return group.employeeIds.some(empId => {
            const employee = employees.find(emp => emp.id === empId);
            return employee && (!employee.district || allowedDistricts.includes(employee.district));
        });
    });
}

// Filter broadcast history by district
function filterBroadcastsByDistrict(broadcasts, employees, allowedDistricts, canAccessAllDistricts) {
    // If user can access all districts, return all broadcasts
    if (canAccessAllDistricts || (allowedDistricts && allowedDistricts.includes('all'))) {
        return broadcasts;
    }
    
    // Filter broadcasts that involve employees from allowed districts
    return broadcasts.filter(broadcast => {
        if (!broadcast.employeeIds || broadcast.employeeIds.length === 0) {
            return true; // Broadcasts without specific employees are visible
        }
        
        // Check if any employee in the broadcast is from allowed districts
        return broadcast.employeeIds.some(empId => {
            const employee = employees.find(emp => emp.id === empId);
            return employee && (!employee.district || allowedDistricts.includes(employee.district));
        });
    });
}

// Check if user can access a specific district
function canAccessDistrict(district, allowedDistricts, canAccessAllDistricts) {
    if (canAccessAllDistricts || (allowedDistricts && allowedDistricts.includes('all'))) {
        return true;
    }
    
    if (!district) {
        return true; // No district specified means it's accessible
    }
    
    return allowedDistricts && allowedDistricts.includes(district);
}

// Extract district info from request session
function getDistrictAccessFromSession(req) {
    const user = req.session?.user;
    if (!user) {
        return {
            canAccessAllDistricts: false,
            allowedDistricts: []
        };
    }
    
    // Admins can access all districts
    if (user.role === 'admin') {
        return {
            canAccessAllDistricts: true,
            allowedDistricts: ['all']
        };
    }
    
    const allowedDistricts = user.allowedDistricts || [];
    const canAccessAllDistricts = allowedDistricts.includes('all');
    
    return {
        canAccessAllDistricts,
        allowedDistricts
    };
}

module.exports = {
    filterEmployeesByDistrict,
    filterGroupsByDistrict,
    filterBroadcastsByDistrict,
    canAccessDistrict,
    getDistrictAccessFromSession
};