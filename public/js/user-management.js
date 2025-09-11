// User Management functionality
let districts = [];
let currentUser = null;

// Load districts on page load
async function loadDistricts() {
    try {
        const response = await fetch('/api/districts-list');
        if (response.ok) {
            districts = await response.json();
            populateDistrictCheckboxes();
        } else {
            console.error('Failed to load districts:', response.status);
        }
    } catch (error) {
        console.error('Error loading districts:', error);
    }
}

// Populate district checkboxes in the modal
function populateDistrictCheckboxes() {
    const container = document.getElementById('districtCheckboxes');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Sort districts by type and name
    const sortedDistricts = [...districts].sort((a, b) => {
        // First sort by type (shahar first, then tuman)
        if (a.type === 'shahar' && b.type !== 'shahar') return -1;
        if (a.type !== 'shahar' && b.type === 'shahar') return 1;
        // Then sort by name
        return a.name.localeCompare(b.name);
    });
    
    // Add individual district options in a grid layout
    sortedDistricts.forEach(district => {
        const colDiv = document.createElement('div');
        colDiv.className = 'col-md-4 col-sm-6';
        
        const checkDiv = document.createElement('div');
        checkDiv.className = 'form-check';
        
        const icon = district.type === 'shahar' ? 'fa-city' : 'fa-map-marker-alt';
        const color = district.type === 'shahar' ? '#3b82f6' : '#8b5cf6';
        
        checkDiv.innerHTML = `
            <input class="form-check-input district-checkbox" type="checkbox" value="${district.id}" id="district-${district.id}">
            <label class="form-check-label" for="district-${district.id}">
                <i class="fas ${icon}" style="color: ${color};"></i>
                <span>${district.name}</span>
            </label>
        `;
        
        colDiv.appendChild(checkDiv);
        container.appendChild(colDiv);
    });
}

// Handle "All districts" checkbox change
function handleAllDistrictsChange(checkbox) {
    const districtCheckboxes = document.querySelectorAll('.district-checkbox');
    districtCheckboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = checkbox.checked;
    });
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Foydalanuvchilarni yuklashda xatolik');
    }
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.name}</td>
            <td>${getRoleName(user.role)}</td>
            <td>${getDistrictNames(user.allowedDistricts)}</td>
            <td>${user.active ? '<span class="badge badge-success">Faol</span>' : '<span class="badge badge-secondary">Nofaol</span>'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Get role display name
function getRoleName(role) {
    const roleNames = {
        'admin': 'Administrator',
        'user': 'Foydalanuvchi',
        'viewer': 'Ko\'ruvchi'
    };
    return roleNames[role] || role;
}

// Get district names for display
function getDistrictNames(allowedDistricts) {
    if (!allowedDistricts || allowedDistricts.length === 0) {
        return '<span class="text-muted">Hech qanday</span>';
    }
    
    if (allowedDistricts.includes('all')) {
        return '<span class="text-success">Barcha tumanlar</span>';
    }
    
    const names = allowedDistricts.map(districtId => {
        const district = districts.find(d => d.id === districtId);
        return district ? district.name : districtId;
    });
    
    return names.join(', ');
}

// Show create user modal
function showCreateUserModal() {
    currentUser = null;
    document.getElementById('userModalTitle').textContent = 'Yangi foydalanuvchi';
    document.getElementById('userForm').reset();
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('password').required = true;
    
    // Reset all checkboxes first
    document.querySelectorAll('#userModal input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
    });
    
    // Check "all districts" by default for new users
    const allCheckbox = document.getElementById('district-all');
    if (allCheckbox) {
        allCheckbox.checked = true;
        handleAllDistrictsChange(allCheckbox);
    }
    
    $('#userModal').modal('show');
}

// Edit user
async function editUser(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            
            // Fill form
            document.getElementById('userModalTitle').textContent = 'Foydalanuvchini tahrirlash';
            document.getElementById('username').value = user.username;
            document.getElementById('name').value = user.name;
            document.getElementById('role').value = user.role;
            document.getElementById('active').checked = user.active;
            
            // Password is optional when editing
            document.getElementById('passwordGroup').style.display = 'block';
            document.getElementById('password').required = false;
            document.getElementById('password').placeholder = 'Yangi parol (ixtiyoriy)';
            
            // Set district checkboxes
            document.querySelectorAll('#districtCheckboxes input').forEach(cb => {
                cb.checked = false;
                cb.disabled = false;
            });
            
            if (user.allowedDistricts) {
                if (user.allowedDistricts.includes('all')) {
                    document.getElementById('district-all').checked = true;
                    handleAllDistrictsChange(document.getElementById('district-all'));
                } else {
                    user.allowedDistricts.forEach(districtId => {
                        const checkbox = document.getElementById(`district-${districtId}`);
                        if (checkbox) checkbox.checked = true;
                    });
                }
            }
            
            // Set permissions
            if (user.permissions) {
                Object.keys(user.permissions).forEach(module => {
                    const checkbox = document.getElementById(`perm-${module}`);
                    if (checkbox) checkbox.checked = user.permissions[module];
                });
            }
            
            $('#userModal').modal('show');
        }
    } catch (error) {
        console.error('Error loading user:', error);
        showError('Foydalanuvchini yuklashda xatolik');
    }
}

// Save user
async function saveUser() {
    const form = document.getElementById('userForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get selected districts
    const allowedDistricts = [];
    if (document.getElementById('district-all').checked) {
        allowedDistricts.push('all');
    } else {
        document.querySelectorAll('.district-checkbox:checked').forEach(cb => {
            allowedDistricts.push(cb.value);
        });
    }
    
    // Get permissions
    const permissions = {};
    document.querySelectorAll('[id^="perm-"]:checked').forEach(cb => {
        const module = cb.id.replace('perm-', '');
        permissions[module] = true;
    });
    
    const userData = {
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        role: document.getElementById('role').value,
        active: document.getElementById('active').checked,
        allowedDistricts,
        permissions
    };
    
    // Add password only if provided
    const password = document.getElementById('password').value;
    if (password) {
        userData.password = password;
    }
    
    try {
        const url = currentUser ? `/api/users/${currentUser.id}` : '/api/users';
        const method = currentUser ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            $('#userModal').modal('hide');
            loadUsers();
            showSuccess(currentUser ? 'Foydalanuvchi yangilandi' : 'Foydalanuvchi yaratildi');
        } else {
            const error = await response.json();
            showError(error.error || 'Xatolik yuz berdi');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showError('Saqlashda xatolik');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Foydalanuvchini o\'chirmoqchimisiz?')) return;
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadUsers();
            showSuccess('Foydalanuvchi o\'chirildi');
        } else {
            const error = await response.json();
            showError(error.error || 'Xatolik yuz berdi');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('O\'chirishda xatolik');
    }
}

// Show success message
function showSuccess(message) {
    // Implementation depends on your notification system
    alert(message);
}

// Show error message
function showError(message) {
    // Implementation depends on your notification system
    alert('Xatolik: ' + message);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDistricts();
    loadUsers();
});