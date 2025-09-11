/**
 * District filtering for employees page
 * This script should be included in employees page to enable district-based filtering
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

// Update the district dropdown to only show allowed districts
function updateDistrictDropdown() {
    const districtSelect = document.getElementById('employeeDistrict');
    if (!districtSelect) return;
    
    // If user can't access all districts, filter the options
    if (!userDistrictAccess.canAccessAllDistricts) {
        const allowedDistricts = userDistrictAccess.allowedDistricts || [];
        const options = districtSelect.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value && !allowedDistricts.includes(option.value)) {
                option.style.display = 'none';
                option.disabled = true;
            }
        });
    }
}

// Override the displayEmployees function to apply filtering
if (typeof displayEmployees === 'function') {
    const originalDisplayEmployees = displayEmployees;
    
    window.displayEmployees = function(filteredEmployees = null) {
        // If no filtered data provided, use the global employees data
        let dataToDisplay = filteredEmployees || employees;
        
        // Apply district filtering
        dataToDisplay = filterEmployeesByUserDistrict(dataToDisplay);
        
        // Call original display function with filtered data
        originalDisplayEmployees.call(this, dataToDisplay);
    };
}

// Override the createEmployee function to validate district access
if (typeof createEmployee === 'function') {
    const originalCreateEmployee = createEmployee;
    
    createEmployee = async function() {
        const district = document.getElementById('employeeDistrict')?.value;
        
        // Check if user has access to the selected district
        if (district && !userDistrictAccess.canAccessAllDistricts) {
            const allowedDistricts = userDistrictAccess.allowedDistricts || [];
            if (!allowedDistricts.includes(district)) {
                alert('Sizda bu tumanga xodim qo\'shish huquqi yo\'q');
                return;
            }
        }
        
        // Call original function
        return await originalCreateEmployee();
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateDistrictDropdown();
});