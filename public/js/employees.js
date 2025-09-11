// Employees management - FIXED VERSION
console.log('employees.js: Loading...');

// Global variables
let employees = [];
let departments = [];
let districts = [];
let groups = [];
let currentPage = 1;
const itemsPerPage = 10;
let deleteEmployeeId = null;

// Helper function to get district name by ID
function getDistrictName(districtId) {
    if (!districtId) return '-';
    const district = districts.find(d => d.id === districtId);
    return district ? district.name : districtId;
}

// Helper function to get department name by ID
function getDepartmentName(departmentId) {
    if (!departmentId) return '-';
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : departmentId;
}

// Define all functions globally FIRST
window.exportEmployees = function() {
    console.log('Exporting employees...');
    fetch('/api/employees/export')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Convert to CSV
                const csv = convertToCSV(data.employees);
                downloadCSV(csv, 'xodimlar_' + new Date().toISOString().split('T')[0] + '.csv');
            } else {
                alert('Export xatosi: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Export error:', error);
            alert('Export xatosi!');
        });
};

window.importEmployees = function() {
    // New simplified import - directly open file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv,.html';  // Excel, CSV va HTML fayllarni qabul qilish
    input.onchange = handleImportFile;
    input.click();
};

window.closeImportModal = function() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.remove();
    }
};

window.loadImportFile = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('importData').value = e.target.result;
        };
        reader.readAsText(file);
    }
};

window.processImport = function() {
    const importData = document.getElementById('importData').value;
    if (!importData) {
        alert('Ma\'lumot kiriting!');
        return;
    }
    
    try {
        const data = JSON.parse(importData);
        if (!data.employees || !Array.isArray(data.employees)) {
            alert('Noto\'g\'ri format! {"employees": [...]} formatida bo\'lishi kerak');
            return;
        }
        
        // Send to server
        fetch('/api/employees/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert(result.message);
                closeImportModal();
                loadEmployees(); // Reload the list
            } else {
                alert('Import xatosi: ' + result.message);
                if (result.errors && result.errors.length > 0) {
                    console.error('Import errors:', result.errors);
                    alert('Xatolar:\n' + result.errors.join('\n'));
                }
            }
        })
        .catch(error => {
            console.error('Import error:', error);
            alert('Import xatosi: ' + error.message);
        });
        
    } catch (error) {
        alert('JSON formati noto\'g\'ri: ' + error.message);
    }
};

function convertToCSV(employees) {
    const headers = ['F.I.O', 'Lavozimi', 'Unvoni', 'Bo\'limi', 'Telefon', 'Xizmat Telefoni', 'Tumani'];
    const rows = employees.map(emp => [
        emp.name || '',
        emp.position || '',
        emp.rank || '',
        emp.department || '',
        emp.phoneNumber || '',
        emp.servicePhone || '',
        emp.district || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return '\uFEFF' + csvContent; // UTF-8 BOM
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.showAddModal = function() {
    console.log('showAddModal called');
    document.getElementById('modalTitle').textContent = 'Yangi xodim qo\'shish';
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeForm').reset();
    // Make sure departments are populated
    populateDepartments();
    document.getElementById('employeeModal').classList.add('active');
};

window.closeModal = function() {
    document.getElementById('employeeModal').classList.remove('active');
    document.getElementById('employeeForm').reset();
};

window.editEmployee = function(id) {
    console.log('editEmployee called:', id);
    console.log('Available employees:', employees.length);
    console.log('First few employee IDs:', employees.slice(0, 3).map(emp => `${emp.id} (${typeof emp.id})`));
    console.log('Looking for ID:', id, '(type:', typeof id, ')');
    
    const employee = employees.find(emp => emp.id === id || emp.id === String(id) || String(emp.id) === String(id));
    if (!employee) {
        console.error('Employee not found:', id);
        console.log('All employee IDs:', employees.map(emp => emp.id));
        return;
    }
    
    console.log('Found employee:', employee);
    
    // Check if modal exists
    const modal = document.getElementById('employeeModal');
    if (!modal) {
        console.error('employeeModal not found in DOM');
        return;
    }
    
    // Fill form fields with debug
    const fillField = (fieldId, value) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value || '';
            console.log(`Filled ${fieldId}:`, value);
        } else {
            console.error(`Field not found: ${fieldId}`);
        }
    };
    
    // Set modal title
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Xodimni tahrirlash';
    } else {
        console.error('modalTitle not found');
    }
    
    fillField('employeeId', employee.id);
    fillField('employeeName', employee.name);
    fillField('employeePosition', employee.position);
    fillField('employeeRank', employee.rank);
    fillField('employeeDepartment', employee.department);
    fillField('employeePhone', employee.phoneNumber);
    fillField('employeeServicePhone', employee.servicePhone);
    fillField('employeeDistrict', employee.district);
    
    // Make sure departments are populated
    populateDepartments();
    
    // Set groups if any
    if (employee.groups && groups.length > 0) {
        const checkboxes = document.querySelectorAll('input[name="groups"]');
        checkboxes.forEach(cb => {
            cb.checked = employee.groups.includes(cb.value);
        });
    }
    
    // Show modal with debug
    console.log('Adding active class to modal');
    modal.classList.add('active');
    
    // Verify modal state after adding class
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(modal);
        console.log('Modal state after active:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            hasActiveClass: modal.classList.contains('active')
        });
    }, 100);
};

window.deleteEmployee = function(id) {
    console.log('deleteEmployee called:', id);
    console.log('Available employees for delete:', employees.length);
    console.log('Looking for delete ID:', id, '(type:', typeof id, ')');
    
    const employee = employees.find(emp => emp.id === id || emp.id === String(id) || String(emp.id) === String(id));
    if (!employee) {
        console.error('Employee not found for delete:', id);
        console.log('All employee IDs for delete:', employees.map(emp => emp.id));
        return;
    }
    
    console.log('Found employee for delete:', employee);
    
    // Check if delete modal exists
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) {
        console.error('deleteModal not found in DOM');
        return;
    }
    
    deleteEmployeeId = id;
    
    // Set employee name in delete modal
    const deleteEmployeeName = document.getElementById('deleteEmployeeName');
    if (deleteEmployeeName) {
        deleteEmployeeName.textContent = employee.name;
        console.log('Set delete employee name:', employee.name);
    } else {
        console.error('deleteEmployeeName element not found');
    }
    
    // Show delete modal with debug
    console.log('Adding active class to delete modal');
    deleteModal.classList.add('active');
    
    // Verify delete modal state
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(deleteModal);
        console.log('Delete modal state after active:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            hasActiveClass: deleteModal.classList.contains('active')
        });
    }, 100);
};

window.closeDeleteModal = function() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteEmployeeId = null;
};

window.confirmDelete = async function() {
    if (!deleteEmployeeId) return;
    
    try {
        const response = await fetch(`/api/employees/${deleteEmployeeId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        if (response.ok) {
            closeDeleteModal();
            await loadEmployees();
            alert('Xodim muvaffaqiyatli o\'chirildi');
        } else {
            const error = await response.json();
            alert('Xatolik: ' + error.message);
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Xodimni o\'chirishda xatolik');
    }
};

window.saveEmployee = async function(event) {
    event.preventDefault();
    console.log('saveEmployee called');
    
    const id = document.getElementById('employeeId').value;
    
    const data = {
        name: document.getElementById('employeeName').value,
        position: document.getElementById('employeePosition').value,
        rank: document.getElementById('employeeRank').value,
        department: document.getElementById('employeeDepartment').value,
        phoneNumber: document.getElementById('employeePhone').value,
        servicePhone: document.getElementById('employeeServicePhone').value,
        district: document.getElementById('employeeDistrict').value
    };
    
    // Debug log
    console.log('=== SAVING EMPLOYEE ===');
    console.log('District value:', data.district);
    console.log('Current user:', window.currentUser);
    console.log('All form data:', data);
    
    try {
        const url = id ? `/api/employees/${id}` : '/api/employees';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal();
            await loadEmployees();
            alert(id ? 'Xodim muvaffaqiyatli yangilandi' : 'Xodim muvaffaqiyatli qo\'shildi');
        } else {
            const error = await response.json();
            alert('Xatolik: ' + error.message);
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        alert('Xodimni saqlashda xatolik');
    }
};

window.searchEmployees = function(value) {
    console.log('Searching:', value);
    currentPage = 1;
    displayEmployees();
};

window.filterByDepartment = function(value) {
    console.log('Filter by department:', value);
    currentPage = 1;
    displayEmployees();
};

window.filterByDistrict = function(value) {
    console.log('Filter by district:', value);
    currentPage = 1;
    displayEmployees();
};

window.changePage = function(page) {
    currentPage = page;
    displayEmployees();
};

window.exportEmployees = function() {
    const csv = [
        ['ID', 'F.I.O', 'Lavozimi', 'Bo\'lim', 'Telefon', 'Xizmat telefoni', 'Tuman'],
        ...employees.map((emp, index) => [
            index + 1,
            emp.name,
            emp.position || '',
            emp.department || '',
            emp.phoneNumber,
            emp.servicePhone || '',
            getDistrictName(emp.district)
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xodimlar.csv';
    a.click();
};

// importEmployees is defined above

async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Processing file:', file.name, 'Type:', file.type);
    
    // Check if it's an XLSX file
    if (file.name.toLowerCase().endsWith('.xlsx')) {
        try {
            // Use XLSX handler
            if (typeof handleXLSXImport !== 'undefined') {
                const employees = await handleXLSXImport(file);
                if (employees && employees.length > 0) {
                    await sendImportData(employees);
                } else {
                    alert('XLSX faylida xodim ma\'lumotlari topilmadi');
                }
            } else {
                alert('XLSX import kutubxonasi yuklanmagan. Sahifani yangilang.');
            }
        } catch (error) {
            console.error('XLSX import error:', error);
            alert('XLSX faylni o\'qishda xatolik: ' + error.message);
        }
        return;
    }
    
    // For other files (XLS/HTML/CSV), read as text
    const reader = new FileReader();
    reader.onload = async (e) => {
        await processImportData(e.target.result, file.name);
    };
    reader.readAsText(file, 'UTF-8');
}

// Separate function to process import data
async function processImportData(text, fileName) {
    try {
        console.log('Processing import data from:', fileName);
        const employees = [];
        
        // Check if it's an Excel HTML file (.xls)
        if (text.includes('<table') && text.includes('</table>')) {
            console.log('Processing as HTML Excel file');
                // Parse HTML Excel file
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const rows = doc.querySelectorAll('table tr');
                
                let headerRow = -1;
                // Find header row with class="header" or containing F.I.O
                for (let i = 0; i < rows.length; i++) {
                    const cells = rows[i].querySelectorAll('td, th');
                    const hasHeaderClass = Array.from(cells).some(c => c.className === 'header');
                    const cellText = Array.from(cells).map(c => c.textContent.trim()).join(' ');
                    
                    if (hasHeaderClass || (cellText.includes('F.I.O') && cellText.includes('Telefon'))) {
                        headerRow = i;
                        break;
                    }
                }
                
                if (headerRow === -1) {
                    alert('Excel faylida sarlavha topilmadi. F.I.O va Telefon ustunlari kerak.');
                    return;
                }
                
                // Process data rows (skip instruction and district rows)
                for (let i = headerRow + 1; i < rows.length; i++) {
                    const cells = rows[i].querySelectorAll('td');
                    if (cells.length >= 8) {
                        // Skip rows with instruction or districts class
                        const firstCell = cells[0];
                        if (firstCell.className === 'instruction' || firstCell.className === 'districts') {
                            continue;
                        }
                        
                        // Skip sample row (class="sample")
                        if (firstCell.className === 'sample' || cells[1].className === 'sample') {
                            continue;
                        }
                        
                        const name = cells[1].textContent.trim();
                        const phone = cells[5].textContent.trim();
                        
                        // Only process rows with actual data (class="data" or no special class)
                        if (name && phone) {
                            // Clean phone number - remove all non-digits and take last 9
                            const cleanPhone = phone.replace(/\D/g, '');
                            const formattedPhone = cleanPhone.length >= 9 ? cleanPhone.slice(-9) : cleanPhone;
                            
                            employees.push({
                                name: name,
                                position: cells[2].textContent.trim(),
                                rank: cells[3].textContent.trim(),
                                department: cells[4].textContent.trim(),
                                phoneNumber: formattedPhone,
                                servicePhone: cells[6].textContent.trim(),
                                district: cells[7].textContent.trim()
                            });
                        }
                    }
                }
            } else {
                // Parse CSV file
                const lines = text.split('\n');
                
                // Skip header
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    // Handle CSV with quotes
                    const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
                    const values = [];
                    let match;
                    while ((match = regex.exec(line)) !== null) {
                        values.push(match[0].replace(/^"(.*)"$/, '$1').trim());
                    }
                    
                    if (values.length >= 7) {
                        const name = values[1] || values[0]; // Handle both with and without ID column
                        const phone = values[5] || values[4];
                        
                        if (name && phone) {
                            employees.push({
                                name: name,
                                position: values[2] || values[1],
                                rank: values[3] || values[2],
                                department: values[4] || values[3],
                                phoneNumber: phone.replace(/\D/g, '').slice(-9),
                                servicePhone: values[6] || values[5],
                                district: values[7] || values[6]
                            });
                        }
                    }
                }
            }
            
            if (employees.length === 0) {
                alert('Import faylida ma\'lumot topilmadi');
                return;
            }
            
            // Use common send function
            await sendImportData(employees);
    } catch (error) {
        console.error('Import error:', error);
        alert('Import qilishda xatolik: ' + error.message);
    }
}

// Common function to send import data to server
async function sendImportData(employees) {
    if (!employees || employees.length === 0) {
        alert('Import qilish uchun xodim ma\'lumotlari topilmadi');
        return;
    }
    
    // Show confirmation with details
    const confirmMsg = `${employees.length} ta xodim topildi.\n\nBirinchi xodim:\n${employees[0].name}\nTelefon: ${employees[0].phoneNumber}\nTuman: ${employees[0].district || 'ko\'rsatilmagan'}\n\nImport qilishni tasdiqlaysizmi?`;
    if (!confirm(confirmMsg)) {
        return;
    }
    
    console.log('Sending', employees.length, 'employees to server');
    console.log('First 3 employees:', employees.slice(0, 3));
    
    try {
        const response = await fetch('/api/employees/import', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                employees,
                createDepartments: true  // Yangi bo'lim va tumanlarni avtomatik yaratish
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Import result:', result);
            
            let message = result.message;
            if (result.errors && result.errors.length > 0) {
                console.error('Import errors:', result.errors);
                message += '\n\nXatolar:\n' + result.errors.slice(0, 5).join('\n');
                if (result.errors.length > 5) {
                    message += `\n... va yana ${result.errors.length - 5} ta xato`;
                }
            }
            
            // Show detailed result
            if (result.imported !== undefined && result.failed !== undefined) {
                message = `Import natijasi:\n${result.imported} ta muvaffaqiyatli qo'shildi\n${result.failed} ta xato`;
                if (result.errors && result.errors.length > 0) {
                    message += '\n\nXatolar:\n' + result.errors.slice(0, 5).join('\n');
                }
            }
            
            alert(message);
            await loadEmployees();
        } else {
            const error = await response.json();
            console.error('Import failed:', error);
            alert('Import xatoligi: ' + error.message);
        }
    } catch (error) {
        console.error('Server error:', error);
        alert('Serverga yuborishda xatolik: ' + error.message);
    }
}

// Load functions
async function loadEmployees() {
    try {
        console.log('Loading employees from API...');
        const response = await fetch('/api/employees', { credentials: 'same-origin' });
        
        if (!response.ok) {
            console.error('API response not ok:', response.status, response.statusText);
            return;
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        // Check if it's an array (direct response) or object with success
        if (Array.isArray(data)) {
            employees = data;
        } else if (data.success) {
            employees = data.employees || [];
            departments = data.departments || [];
        } else {
            employees = [];
        }
        
        console.log('Loaded employees:', employees.length);
        console.log('Current user:', window.currentUser);
        
        // Populate department dropdown
        populateDepartments();
        
        displayEmployees();
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function populateDepartments() {
    const select = document.getElementById('employeeDepartment');
    if (select && departments.length > 0) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Bo\'limni tanlang</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            select.appendChild(option);
        });
        select.value = currentValue;
    }
}

async function loadDistricts() {
    try {
        const response = await fetch('/api/districts-list', { credentials: 'same-origin' });
        districts = await response.json();
        
        // Filter districts based on user permissions
        let allowedDistricts = districts;
        if (window.currentUser && window.currentUser.allowedDistricts && 
            window.currentUser.allowedDistricts.length > 0 && 
            !window.currentUser.allowedDistricts.includes('all')) {
            // User has district restrictions - check by both ID and name
            allowedDistricts = districts.filter(district => 
                window.currentUser.allowedDistricts.includes(district.id) ||
                window.currentUser.allowedDistricts.includes(district.name)
            );
        }
        
        // Populate district selects
        const selects = ['employeeDistrict', 'districtFilter'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentValue = select.value;
                
                if (id === 'employeeDistrict') {
                    // For employee creation/edit - only show allowed districts
                    select.innerHTML = '';
                    
                    // If user has only one allowed district, auto-select it
                    if (allowedDistricts.length === 1) {
                        const option = document.createElement('option');
                        option.value = allowedDistricts[0].id;
                        option.textContent = allowedDistricts[0].name;
                        option.selected = true;
                        select.appendChild(option);
                        // Make it readonly visually
                        select.style.pointerEvents = 'none';
                        select.style.backgroundColor = '#f5f5f5';
                    } else {
                        // Multiple districts allowed
                        select.innerHTML = '<option value="">Tanlang</option>';
                        select.style.pointerEvents = 'auto';
                        select.style.backgroundColor = '';
                        allowedDistricts.forEach(district => {
                            const option = document.createElement('option');
                            option.value = district.id;
                            option.textContent = district.name;
                            select.appendChild(option);
                        });
                    }
                } else {
                    // For filter - show all districts but user can only see employees from allowed districts
                    select.innerHTML = '<option value="">Barcha tumanlar</option>';
                    districts.forEach(district => {
                        const option = document.createElement('option');
                        option.value = district.id;
                        option.textContent = district.name;
                        select.appendChild(option);
                    });
                }
                
                // Restore value if it was set
                if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                    select.value = currentValue;
                }
            }
        });
    } catch (error) {
        console.error('Error loading districts:', error);
    }
}


function displayEmployees() {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    // Apply filters
    let filtered = [...employees];
    
    const searchValue = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchValue) {
        filtered = filtered.filter(emp => 
            emp.name.toLowerCase().includes(searchValue) ||
            emp.phoneNumber.includes(searchValue)
        );
    }
    
    const deptFilter = document.getElementById('departmentFilter')?.value;
    if (deptFilter) {
        filtered = filtered.filter(emp => emp.department === deptFilter);
    }
    
    const districtFilter = document.getElementById('districtFilter')?.value;
    if (districtFilter) {
        filtered = filtered.filter(emp => emp.district === districtFilter);
    }
    
    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paged = filtered.slice(start, end);
    
    if (paged.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 48px;">
                    <span class="material-symbols-outlined" style="font-size: 64px; opacity: 0.3;">group_off</span>
                    <h3>Xodimlar topilmadi</h3>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = paged.map((emp, index) => `
        <tr>
            <td>${start + index + 1}</td>
            <td>${emp.name}</td>
            <td>${emp.position || '-'}</td>
            <td>${emp.rank || '-'}</td>
            <td>${getDepartmentName(emp.department)}</td>
            <td>${getDistrictName(emp.district)}</td>
            <td>${emp.phoneNumber}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="editEmployee('${emp.id}')" title="Tahrirlash">
                    <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteEmployee('${emp.id}')" title="O'chirish">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Display pagination
    displayPagination(filtered.length);
}

function displayPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span style="padding: 8px 12px; font-weight: bold;">${i}</span>`;
        } else {
            html += `<a href="#" onclick="changePage(${i}); return false;" style="padding: 8px 12px;">${i}</a>`;
        }
    }
    
    pagination.innerHTML = html;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    loadEmployees();
    loadDistricts();
});

console.log('employees.js: Loaded successfully!');