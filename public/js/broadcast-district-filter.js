/**
 * District filtering for broadcast page
 * This script filters employees and groups based on user's district access
 */

// Get user's district access from session (passed from server)
const userDistrictAccess = window.userDistrictAccess || { canAccessAllDistricts: true, allowedDistricts: ['all'] };

// Filter employees based on district access
function filterEmployeesByUserDistrict(employees) {
    // If user can access all districts, return all employees
    if (userDistrictAccess.canAccessAllDistricts || 
        (userDistrictAccess.allowedDistricts && userDistrictAccess.allowedDistricts.includes('all'))) {
        return employees;
    }
    
    // Filter by allowed districts
    const allowedDistricts = userDistrictAccess.allowedDistricts || [];
    return employees.filter(emp => 
        !emp.district || allowedDistricts.includes(emp.district)
    );
}

// Filter groups based on district access
function filterGroupsByUserDistrict(groups, employees) {
    // If user can access all districts, return all groups
    if (userDistrictAccess.canAccessAllDistricts || 
        (userDistrictAccess.allowedDistricts && userDistrictAccess.allowedDistricts.includes('all'))) {
        return groups;
    }
    
    const allowedDistricts = userDistrictAccess.allowedDistricts || [];
    
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

// Override loadEmployees function in broadcast.js
document.addEventListener('DOMContentLoaded', () => {
    // Wait for broadcast.js to load
    setTimeout(() => {
        if (typeof window.loadEmployees === 'function') {
            const originalLoadEmployees = window.loadEmployees;
            
            window.loadEmployees = async function() {
                // Call original function
                await originalLoadEmployees();
                
                // Apply district filtering
                if (window.employees) {
                    window.employees = filterEmployeesByUserDistrict(window.employees);
                    // Re-render employee list
                    renderEmployeeList();
                }
            };
        }
        
        // Override loadGroups function
        if (typeof window.loadGroups === 'function') {
            const originalLoadGroups = window.loadGroups;
            
            window.loadGroups = async function() {
                // Call original function
                await originalLoadGroups();
                
                // Apply district filtering
                if (window.groups && window.employees) {
                    window.groups = filterGroupsByUserDistrict(window.groups, window.employees);
                    // Re-render groups list
                    renderGroupsList();
                }
            };
        }
        
        // Override updateEmployeeCount to show filtered count
        if (typeof window.updateEmployeeCount === 'function') {
            window.updateEmployeeCount = function() {
                const selectedCount = document.querySelectorAll('#employeesList input[type="checkbox"]:checked').length;
                const totalCount = window.employees ? window.employees.length : 0;
                document.getElementById('selectedEmployeesCount').textContent = 
                    `Tanlangan: ${selectedCount} / Jami: ${totalCount}`;
            };
        }
    }, 100); // Small delay to ensure broadcast.js is loaded
});