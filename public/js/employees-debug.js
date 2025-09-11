// Debug script for employees page
console.log('=== EMPLOYEES DEBUG START ===');

// Check if employees.js loaded
console.log('employees.js loaded:', typeof window.showAddModal !== 'undefined');

// List all window functions related to employees
const employeeFunctions = Object.keys(window).filter(key => 
    key.toLowerCase().includes('employee') || 
    key.toLowerCase().includes('modal') ||
    key.toLowerCase().includes('edit') ||
    key.toLowerCase().includes('delete')
);
console.log('Employee-related functions:', employeeFunctions);

// Test modal elements
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM LOADED ===');
    
    // Check modal elements
    const employeeModal = document.getElementById('employeeModal');
    const deleteModal = document.getElementById('deleteModal');
    
    console.log('Employee modal found:', !!employeeModal);
    console.log('Delete modal found:', !!deleteModal);
    
    if (employeeModal) {
        const computed = window.getComputedStyle(employeeModal);
        console.log('Employee modal initial state:');
        console.log('- Display:', computed.display);
        console.log('- Visibility:', computed.visibility);
        console.log('- Opacity:', computed.opacity);
    }
    
    // Test button functionality
    console.log('=== TESTING BUTTON FUNCTIONS ===');
    
    // Override functions to add logging
    const originalShowAddModal = window.showAddModal;
    window.showAddModal = function() {
        console.log('showAddModal called!');
        if (originalShowAddModal) {
            originalShowAddModal.apply(this, arguments);
            
            // Check modal state after function call
            setTimeout(() => {
                const modal = document.getElementById('employeeModal');
                if (modal) {
                    console.log('Modal classes after showAddModal:', modal.className);
                    const computed = window.getComputedStyle(modal);
                    console.log('Modal computed styles after showAddModal:');
                    console.log('- Display:', computed.display);
                    console.log('- Visibility:', computed.visibility);
                    console.log('- Opacity:', computed.opacity);
                }
            }, 100);
        }
    };
    
    const originalEditEmployee = window.editEmployee;
    window.editEmployee = function(id) {
        console.log('editEmployee called with ID:', id);
        if (originalEditEmployee) {
            originalEditEmployee.apply(this, arguments);
        }
    };
    
    const originalDeleteEmployee = window.deleteEmployee;
    window.deleteEmployee = function(id) {
        console.log('deleteEmployee called with ID:', id);
        if (originalDeleteEmployee) {
            originalDeleteEmployee.apply(this, arguments);
        }
    };
    
    // Check for any error handlers
    window.addEventListener('error', (e) => {
        console.error('Window error:', e.message, e.filename, e.lineno, e.colno);
    });
    
    console.log('=== DEBUG SETUP COMPLETE ===');
});

// Add click event listener to catch all button clicks
document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (target) {
        console.log('Button clicked:', {
            text: target.textContent.trim(),
            classes: target.className,
            onclick: target.getAttribute('onclick'),
            id: target.id
        });
    }
}, true);

console.log('=== EMPLOYEES DEBUG SCRIPT LOADED ===');