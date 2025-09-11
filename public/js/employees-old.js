// Employees management
console.log('employees.js: Script starting to load...');

// Fix for onclick handlers - define functions immediately
window.showAddModal = function() {
    console.log('showAddModal called');
    const modal = document.getElementById('employeeModal');
    if (!modal) {
        console.error('employeeModal not found!');
        return;
    }
    document.getElementById('modalTitle').textContent = 'Yangi xodim qo\'shish';
    resetForm();
    modal.classList.add('active');
    
    // Fix phone input
    setTimeout(() => {
        const phoneInput = document.getElementById('employeePhone');
        if (phoneInput) {
            phoneInput.removeAttribute('maxlength');
            phoneInput.type = 'text';
        }
    }, 100);
};

window.closeModal = function() {
    document.getElementById('employeeModal').classList.remove('active');
    resetForm();
};

window.resetForm = function() {
    const form = document.getElementById('employeeForm');
    if (form) form.reset();
    document.getElementById('employeeId').value = '';
};

let employees = [];
let departments = [];
let districts = [];
let groups = [];
let currentPage = 1;
const itemsPerPage = 10;
let deleteEmployeeId = null;

// Store employees data globally for district filtering
window.employeesData = [];

// Log immediately
console.log('employees.js: Variables initialized');

// Initialize  
document.addEventListener('DOMContentLoaded', () => {
    console.log('employees.js: DOMContentLoaded fired');
    loadEmployees();
    loadDistricts();
    loadGroups();
    
    // Custom department functionality removed
    // const deptSelect = document.getElementById('employeeDepartment');
    // Custom department input removed from UI
});

// Load groups
async function loadGroups() {
    try {
        const response = await fetch('/api/groups', { 
            credentials: 'same-origin' 
        });
        
        if (response.ok) {
            const data = await response.json();
            groups = data;
            console.log('Loaded groups:', groups.length);
            
            // Populate groups checkboxes
            const container = document.getElementById('groupsCheckboxes');
            if (container) {
                container.innerHTML = groups.map(group => `
                    <label style="display: flex; align-items: center; gap: var(--md-sys-spacing-2); cursor: pointer;">
                        <input type="checkbox" name="groups" value="${group.id}" style="cursor: pointer;">
                        <span>${group.name}</span>
                    </label>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Load districts
async function loadDistricts() {
    try {
        const response = await fetch('/api/districts-list');
        districts = await response.json(); // Store globally
        const districtSelect = document.getElementById('employeeDistrict');
        const districtFilter = document.getElementById('districtFilter');
        
        if (districtSelect) {
            // Clear existing options except the first one
            districtSelect.innerHTML = '<option value="">Tanlanmagan</option>';
            
            // Add district options
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district.name;
                option.textContent = district.name;
                districtSelect.appendChild(option);
            });
        }
        
        // Also populate the filter dropdown
        if (districtFilter) {
            districtFilter.innerHTML = '<option value="">Barcha tumanlar</option>';
            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district.name;
                option.textContent = district.name;
                districtFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading districts:', error);
    }
}

// Load employees
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees', {
            credentials: 'same-origin'
        });
        
        console.log('Employees API response status:', response.status);
        
        if (!response.ok) {
            console.error('Employees API error:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        employees = await response.json();
        console.log('Loaded employees:', employees.length, employees);
        
        // Debug: Show first few employees
        if (employees.length > 0) {
            console.log('First employee:', employees[0]);
            console.log('Employees with Qarshi shahri:', employees.filter(e => e.district === 'Qarshi shahri'));
        }
        
        // Store globally for district filtering
        window.employeesData = employees;
        
        // Also load departments
        await loadDepartments();
        
        displayEmployees();
    } catch (error) {
        console.error('Error loading employees:', error);
        showEmptyState();
    }
}

// Load departments
async function loadDepartments() {
    try {
        const response = await fetch('/api/departments', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            console.error('Departments API error:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        departments = await response.json();
        console.log('Loaded departments:', departments.length, departments);
    } catch (error) {
        console.error('Error loading departments:', error);
        departments = []; // Ensure departments is at least an empty array
    }
}

// Get department name by ID
function getDepartmentName(deptId) {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : deptId || '-';
}

// Display employees
function displayEmployees(filteredEmployees = null) {
    const data = filteredEmployees || employees;
    const tbody = document.getElementById('employeesTableBody');
    
    if (!tbody) {
        console.error('employeesTableBody element not found!');
        return;
    }
    
    console.log('Displaying employees:', data.length);
    
    if (data.length === 0) {
        showEmptyState();
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageData.map((emp, index) => {
        // Get department name
        const deptName = getDepartmentName(emp.department);
        
        return `
            <tr>
                <td>${startIndex + index + 1}</td>
                <td>${emp.name}</td>
                <td>
                    ${emp.position || '-'}
                    ${emp.rank ? `<br><small style="color: #f59e0b;">${emp.rank}</small>` : ''}
                </td>
                <td>${deptName}</td>
                <td>${emp.district || '-'}</td>
                <td>
                    ${emp.phoneNumber}
                    ${emp.servicePhone ? `<br><small style="color: #666;">Xizmat: ${emp.servicePhone}</small>` : ''}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editEmployee('${emp.id}')" title="Tahrirlash">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteEmployee('${emp.id}')" title="O'chirish">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    displayPagination(data.length);
}

// Show empty state
function showEmptyState() {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) {
        console.error('employeesTableBody not found in showEmptyState');
        return;
    }
    console.log('Showing empty state');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 48px;">
                <span class="material-symbols-outlined" style="font-size: 64px; color: var(--md-sys-color-outline); display: block; margin-bottom: 16px;">group_off</span>
                <h3 style="margin: 0 0 8px 0; color: var(--md-sys-color-on-surface);">Xodimlar ro'yxati bo'sh</h3>
                <p style="margin: 0; color: var(--md-sys-color-on-surface-variant);">Yangi xodim qo'shish uchun yuqoridagi tugmani bosing</p>
            </td>
        </tr>
    `;
}

// Display pagination
function displayPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += '<span>...</span>';
        }
    }
    
    // Next button
    html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    pagination.innerHTML = html;
}

// Change page
function changePage(page) {
    currentPage = page;
    displayEmployees();
}

// Search employees
function searchEmployees(query) {
    if (query.length < 2) {
        displayEmployees();
        return;
    }
    
    const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(query.toLowerCase()) ||
        emp.phoneNumber.includes(query) ||
        (emp.servicePhone && emp.servicePhone.includes(query)) ||
        (emp.rank && emp.rank.toLowerCase().includes(query.toLowerCase())) ||
        (emp.district && emp.district.toLowerCase().includes(query.toLowerCase()))
    );
    
    currentPage = 1;
    displayEmployees(filtered);
}

// Filter by department
function filterByDepartment(department) {
    if (!department) {
        displayEmployees();
        return;
    }
    
    const filtered = employees.filter(emp => emp.department === department);
    currentPage = 1;
    displayEmployees(filtered);
}

// Filter by district
function filterByDistrict(district) {
    if (!district) {
        displayEmployees();
        return;
    }
    
    const filtered = employees.filter(emp => emp.district === district);
    currentPage = 1;
    displayEmployees(filtered);
}

// Show add modal
function showAddModal() {
    console.log('showAddModal called');
    const modal = document.getElementById('employeeModal');
    if (!modal) {
        console.error('employeeModal not found!');
        return;
    }
    document.getElementById('modalTitle').textContent = 'Yangi xodim qo\'shish';
    resetForm();
    
    // Auto-select district if user has only one allowed district
    if (window.userDistrictAccess && 
        !window.userDistrictAccess.canAccessAllDistricts && 
        window.userDistrictAccess.allowedDistricts && 
        window.userDistrictAccess.allowedDistricts.length === 1) {
        
        const allowedDistrictId = window.userDistrictAccess.allowedDistricts[0];
        const districtSelect = document.getElementById('employeeDistrict');
        
        if (districtSelect) {
            // Find the district name from the district ID
            const district = districts.find(d => d.id === allowedDistrictId);
            if (district) {
                districtSelect.value = district.name;
                // Disable the select to prevent changing
                districtSelect.disabled = true;
                console.log('Auto-selected district:', district.name);
            }
        }
    }
    
    console.log('Adding active class to modal (showAddModal)');
    document.getElementById('employeeModal').classList.add('active');
    console.log('Modal classes:', document.getElementById('employeeModal').className);
    
    // Fix phone input restrictions
    setTimeout(() => {
        const phoneInput = document.getElementById('employeePhone');
        if (phoneInput) {
            console.log('BEFORE FIX - maxLength:', phoneInput.maxLength);
            
            // Remove ALL possible restrictions
            phoneInput.removeAttribute('maxlength');
            phoneInput.removeAttribute('pattern');
            phoneInput.removeAttribute('size');
            phoneInput.type = 'text';
            
            console.log('AFTER FIX - maxLength:', phoneInput.maxLength);
            console.log('✅ Phone input fixed - enter any length now!');
        }
    }, 200);
}

// Edit employee
function editEmployee(id) {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    document.getElementById('modalTitle').textContent = 'Xodimni tahrirlash';
    document.getElementById('employeeId').value = employee.id;
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('employeePosition').value = employee.position || '';
    document.getElementById('employeeDepartment').value = employee.department || '';
    document.getElementById('employeePhone').value = employee.phoneNumber;
    document.getElementById('employeeServicePhone').value = employee.servicePhone || '';
    document.getElementById('employeeDistrict').value = employee.district || '';
    // Rank field removed from UI
    // document.getElementById('employeeRank').value = employee.rank || '';
    
    // Enable district select for editing
    const districtSelect = document.getElementById('employeeDistrict');
    if (districtSelect) {
        districtSelect.disabled = false;
    }
    
    // Remove any restrictions on phone input
    const phoneInput = document.getElementById('employeePhone');
    if (phoneInput) {
        phoneInput.removeAttribute('maxlength');
        phoneInput.removeAttribute('pattern');
        phoneInput.removeAttribute('size');
        phoneInput.type = 'text';
    }
    
    // Set groups checkboxes
    const groupCheckboxes = document.querySelectorAll('input[name="groups"]');
    groupCheckboxes.forEach(checkbox => {
        checkbox.checked = employee.groups && employee.groups.includes(checkbox.value);
    });
    
    console.log('Adding active class to modal (editEmployee)');
    document.getElementById('employeeModal').classList.add('active');
    console.log('Modal classes:', document.getElementById('employeeModal').className);
}

// Save employee
async function saveEmployee(event) {
    event.preventDefault();
    
    // DEBUG: Telefon inputni tekshirish
    const phoneInput = document.getElementById('employeePhone');
    console.log('Phone input value:', phoneInput.value);
    console.log('Phone input type:', phoneInput.type);
    console.log('Phone input attributes:', phoneInput.attributes);
    
    const id = document.getElementById('employeeId').value;
    const deptSelect = document.getElementById('employeeDepartment');
    // Custom department functionality removed
    let department = deptSelect.value;
    
    // Get phone number as-is (user requested any format)
    let phoneNumber = document.getElementById('employeePhone').value.trim();
    console.log('Phone number input value:', phoneNumber);
    console.log('Phone number length:', phoneNumber.length);
    
    // Just ensure it's not empty
    if (!phoneNumber) {
        alert('Telefon raqam kiriting!');
        return;
    }
    
    // Get selected groups
    const selectedGroups = [];
    const groupCheckboxes = document.querySelectorAll('input[name="groups"]:checked');
    groupCheckboxes.forEach(checkbox => {
        selectedGroups.push(checkbox.value);
    });
    
    const data = {
        name: document.getElementById('employeeName').value,
        position: document.getElementById('employeePosition').value,
        department: department,
        phoneNumber: phoneNumber,
        servicePhone: document.getElementById('employeeServicePhone').value.trim(),
        district: document.getElementById('employeeDistrict').value,
        rank: '', // Rank field removed from UI
        groups: selectedGroups
    };
    
    try {
        const url = id ? `/api/employees/${id}` : '/api/employees';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal();
            // Clear filters to show all employees including the new one
            document.getElementById('departmentFilter').value = '';
            document.getElementById('districtFilter').value = '';
            document.getElementById('searchInput').value = '';
            currentPage = 1;
            loadEmployees();
            alert(id ? 'Xodim muvaffaqiyatli yangilandi' : 'Xodim muvaffaqiyatli qo\'shildi');
        } else {
            const error = await response.json();
            alert('Xatolik: ' + error.message);
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        alert('Xodimni saqlashda xatolik');
    }
}

// Delete employee
function deleteEmployee(id) {
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    deleteEmployeeId = id;
    document.getElementById('deleteEmployeeName').textContent = employee.name;
    document.getElementById('deleteModal').classList.add('active');
}

// Confirm delete
async function confirmDelete() {
    if (!deleteEmployeeId) return;
    
    try {
        const response = await fetch(`/api/employees/${deleteEmployeeId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            closeDeleteModal();
            loadEmployees();
            alert('Xodim muvaffaqiyatli o\'chirildi');
        } else {
            const error = await response.json();
            alert('Xatolik: ' + error.message);
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Xodimni o\'chirishda xatolik');
    }
}

// Close modals
function closeModal() {
    document.getElementById('employeeModal').classList.remove('active');
    resetForm();
}

// Reset form
function resetForm() {
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeServicePhone').value = '';
    document.getElementById('employeeDistrict').value = '';
    // Rank field removed from UI
    // document.getElementById('employeeRank').value = '';
    
    // Enable district select (it might be disabled)
    const districtSelect = document.getElementById('employeeDistrict');
    if (districtSelect) {
        districtSelect.disabled = false;
    }
    
    // Custom department input removed from UI
    // const customDeptInput = document.getElementById('customDepartment');
    // if (customDeptInput) {
    //     customDeptInput.style.display = 'none';
    //     customDeptInput.required = false;
    //     customDeptInput.value = '';
    // }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteEmployeeId = null;
}

// Export employees
function exportEmployees() {
    const csv = [
        ['ID', 'F.I.O', 'Lavozimi', 'Unvon', 'Bo\'lim', 'Telefon', 'Xizmat telefoni', 'Tuman'],
        ...employees.map((emp, index) => [
            index + 1,
            emp.name,
            emp.position || '',
            emp.rank || '',
            emp.department || '',
            emp.phoneNumber,
            emp.servicePhone || '',
            emp.district || ''
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xodimlar.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Trigger import file dialog
function importEmployees() {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = handleImportFile;
    fileInput.click();
}

// Handle import file selection
async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const header = lines[0].split(',');
            
            // Skip header and process data
            for (let i = 1; i < lines.length; i++) {
                const data = lines[i].split(',');
                if (data.length >= 5) {
                    const employee = {
                        name: data[1].trim(),
                        position: data[2].trim(),
                        rank: data[3].trim(),
                        department: data[4].trim(),
                        phoneNumber: data[5].trim(),
                        servicePhone: data.length > 6 ? data[6].trim() : '',
                        district: data.length > 7 ? data[7].trim() : ''
                    };
                    
                    await fetch('/api/employees', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(employee)
                    });
                }
            }
            
            loadEmployees();
            alert('Xodimlar muvaffaqiyatli import qilindi');
        } catch (error) {
            console.error('Error importing employees:', error);
            alert('Import qilishda xatolik');
        }
    };
    
    reader.readAsText(file);
}

// Phone number input validation - allow any character
function allowPhoneInput(event) {
    // Allow all input
    return true;
}

// Format phone number - no formatting, keep as-is
function formatPhoneNumber(input) {
    // Do nothing - keep the input as user types it
    return;
}

// Make functions globally accessible for inline event handlers
// Move this to the end of file after all functions are defined

// Phone input debug already handled in main DOMContentLoaded above

// Log when functions are assigned
console.log('employees.js: Assigning functions to window...');

// Add new department
function addNewDepartment() {
    const customDeptInput = document.getElementById('customDepartment');
    const deptSelect = document.getElementById('employeeDepartment');
    const newDeptName = customDeptInput.value.trim();
    
    if (!newDeptName) {
        alert('Bo\'lim nomini kiriting!');
        customDeptInput.focus();
        return;
    }
    
    // Check if department already exists
    const existingOptions = Array.from(deptSelect.options);
    if (existingOptions.some(opt => opt.value === newDeptName)) {
        alert('Bu bo\'lim allaqachon mavjud!');
        return;
    }
    
    // Add new option before "custom" option
    const newOption = document.createElement('option');
    newOption.value = newDeptName;
    newOption.textContent = newDeptName;
    
    const customOption = deptSelect.querySelector('option[value="custom"]');
    deptSelect.insertBefore(newOption, customOption);
    
    // Select the new department
    deptSelect.value = newDeptName;
    customDeptInput.style.display = 'none';
    customDeptInput.value = '';
    customDeptInput.required = false;
    
    // Also update the filter dropdown
    const filterSelect = document.getElementById('departmentFilter');
    if (filterSelect) {
        const filterOption = document.createElement('option');
        filterOption.value = newDeptName;
        filterOption.textContent = newDeptName;
        filterSelect.appendChild(filterOption);
    }
}

// Make functions globally accessible for inline event handlers
window.showAddModal = showAddModal;
window.closeModal = closeModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.exportEmployees = exportEmployees;
window.addNewDepartment = addNewDepartment;
window.changePage = changePage;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.searchEmployees = searchEmployees;
window.filterByDepartment = filterByDepartment;
window.filterByDistrict = filterByDistrict;
window.saveEmployee = saveEmployee;
window.importEmployees = importEmployees;

// Final confirmation
console.log('employees.js: Script fully loaded! Functions available:', {
    showAddModal: typeof showAddModal !== 'undefined',
    editEmployee: typeof editEmployee !== 'undefined',
    deleteEmployee: typeof deleteEmployee !== 'undefined',
    saveEmployee: typeof saveEmployee !== 'undefined'
});