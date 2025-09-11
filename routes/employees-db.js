const express = require('express');
const router = express.Router();
const db = require('../lib/database');
const safeFileOps = require('../lib/safe-file-ops');

// Get all employees with district filtering
router.get('/', async (req, res) => {
    try {
        // TEMP FIX: Read from JSON file instead of database
        const fs = require('fs').promises;
        const path = require('path');
        const jsonPath = path.join(__dirname, '../data/employees.json');
        const deptPath = path.join(__dirname, '../data/departments.json');
        
        const districtsPath = path.join(__dirname, '../data/districts.json');
        
        const [empData, deptData, distData] = await Promise.all([
            fs.readFile(jsonPath, 'utf8'),
            fs.readFile(deptPath, 'utf8'),
            fs.readFile(districtsPath, 'utf8')
        ]);
        
        let employees = JSON.parse(empData);
        const departments = JSON.parse(deptData);
        const districts = JSON.parse(distData);
        
        // Check user's district permissions
        const user = req.session.user;
        if (user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            // Create mapping of district IDs to names
            const districtIdToName = {};
            districts.forEach(d => {
                districtIdToName[d.id] = d.name;
            });
            
            // Get allowed district names
            const allowedDistrictNames = user.allowedDistricts.map(id => 
                districtIdToName[id] || id
            );
            
            console.log('[EMPLOYEES API] User:', user.username, 'allowed districts:', user.allowedDistricts, 'Names:', allowedDistrictNames);
            
            employees = employees.filter(emp => {
                // Check if employee district matches any allowed district
                return allowedDistrictNames.includes(emp.district);
            });
            
            console.log('[EMPLOYEES API] Filtered employees count:', employees.length);
        }
        
        // Filter out deleted employees
        employees = employees.filter(emp => !emp.deleted);
        
        res.json({
            success: true,
            employees: employees,
            departments: departments
        });
    } catch (error) {
        console.error('Error loading employees:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xodimlarni yuklashda xatolik' 
        });
    }
});

// Get employee count
router.get('/count', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const jsonPath = path.join(__dirname, '../data/employees.json');
        const districtsPath = path.join(__dirname, '../data/districts.json');
        
        const [empData, distData] = await Promise.all([
            fs.readFile(jsonPath, 'utf8'),
            fs.readFile(districtsPath, 'utf8')
        ]);
        
        let employees = JSON.parse(empData);
        const districts = JSON.parse(distData);
        
        // Check user's district permissions
        const user = req.session.user;
        if (user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            // Create mapping of district IDs to names
            const districtIdToName = {};
            districts.forEach(d => {
                districtIdToName[d.id] = d.name;
            });
            
            // Get allowed district names
            const allowedDistrictNames = user.allowedDistricts.map(id => 
                districtIdToName[id] || id
            );
            
            employees = employees.filter(emp => {
                return allowedDistrictNames.includes(emp.district);
            });
        }
        
        // Filter out deleted employees
        employees = employees.filter(emp => !emp.deleted);
        
        res.json({
            success: true,
            count: employees.length
        });
    } catch (error) {
        console.error('Error counting employees:', error);
        res.json({ success: false, count: 0 });
    }
});

// Add new employee
router.post('/', async (req, res) => {
    try {
        const user = req.session.user;
        const data = req.body;
        
        // Validate required fields
        if (!data.name || !data.phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Ism va telefon raqam majburiy'
            });
        }
        
        // Load districts to convert ID to name
        const path = require('path');
        const districtsPath = path.join(__dirname, '../data/districts.json');
        const districts = await safeFileOps.readJSON(districtsPath, []);
        
        // Convert district ID to name if needed
        let districtName = data.district;
        if (data.district) {
            const districtObj = districts.find(d => d.id === data.district || d.name === data.district);
            if (districtObj) {
                districtName = districtObj.name;
                // Check district permission using ID
                if (!user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(districtObj.id)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bu tumanga ruxsatingiz yo\'q'
                    });
                }
            }
        }
        
        // TEMP FIX: Use JSON file
        const jsonPath = path.join(__dirname, '../data/employees.json');
        
        let employees = await safeFileOps.readJSON(jsonPath, []);
        
        // Create new employee object with district name
        const newEmployee = {
            id: Date.now().toString(),
            ...data,
            district: districtName, // Use district name instead of ID
            deleted: false,
            createdAt: new Date().toISOString(),
            createdBy: user.id || user.username
        };
        
        // Add to array
        employees.push(newEmployee);
        
        // Save back to file
        await safeFileOps.writeJSON(jsonPath, employees);
        
        res.json({
            success: true,
            message: 'Xodim muvaffaqiyatli qo\'shildi',
            id: newEmployee.id
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xodimni qo\'shishda xatolik' 
        });
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const user = req.session.user;
        const { id } = req.params;
        const data = req.body;
        
        // TEMP FIX: Use JSON file
        const path = require('path');
        const jsonPath = path.join(__dirname, '../data/employees.json');
        
        let employees = await safeFileOps.readJSON(jsonPath, []);
        
        // Find employee
        const employeeIndex = employees.findIndex(emp => emp.id === id && !emp.deleted);
        
        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        const employee = employees[employeeIndex];
        
        // Load districts to convert ID to name
        const districtsPath = path.join(__dirname, '../data/districts.json');
        const districts = await safeFileOps.readJSON(districtsPath, []);
        
        // Convert district ID to name if district is being updated
        if (data.district) {
            const districtObj = districts.find(d => d.id === data.district || d.name === data.district);
            if (districtObj) {
                data.district = districtObj.name; // Always use district name
                // Check district permission using ID
                if (!user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(districtObj.id)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bu tumanga ruxsatingiz yo\'q'
                    });
                }
            }
        }
        
        // Check district permission
        if (!user.allowedDistricts || (!user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(employee.district))) {
            return res.status(403).json({
                success: false,
                message: 'Bu xodimni tahrirlash uchun ruxsatingiz yo\'q'
            });
        }
        
        // Update employee data
        employees[employeeIndex] = {
            ...employee,
            ...data,
            id: employee.id, // Preserve ID
            updatedAt: new Date().toISOString(),
            updatedBy: user.id || user.username
        };
        
        // Save back to file
        await safeFileOps.writeJSON(jsonPath, employees);
        
        res.json({
            success: true,
            message: 'Xodim muvaffaqiyatli yangilandi'
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xodimni yangilashda xatolik' 
        });
    }
});

// Delete employee (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const user = req.session.user;
        const { id } = req.params;
        
        // TEMP FIX: Use JSON file
        const fs = require('fs').promises;
        const path = require('path');
        const jsonPath = path.join(__dirname, '../data/employees.json');
        
        const data = await fs.readFile(jsonPath, 'utf8');
        let employees = JSON.parse(data);
        
        // Find employee
        const employeeIndex = employees.findIndex(emp => emp.id === id && !emp.deleted);
        
        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }
        
        const employee = employees[employeeIndex];
        
        // Check district permission
        if (!user.allowedDistricts || (!user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(employee.district))) {
            return res.status(403).json({
                success: false,
                message: 'Bu xodimni o\'chirish uchun ruxsatingiz yo\'q'
            });
        }
        
        // Soft delete
        employees[employeeIndex].deleted = true;
        employees[employeeIndex].deletedAt = new Date().toISOString();
        employees[employeeIndex].deletedBy = user.id || user.username;
        
        // Save back to file
        await safeFileOps.writeJSON(jsonPath, employees);
        
        res.json({
            success: true,
            message: 'Xodim muvaffaqiyatli o\'chirildi'
        });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xodimni o\'chirishda xatolik' 
        });
    }
});

// Bulk import from Excel/CSV
router.post('/import', async (req, res) => {
    try {
        const user = req.session.user;
        const employees = req.body.employees;
        
        if (!Array.isArray(employees)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri ma\'lumot formati'
            });
        }
        
        let imported = 0;
        let failed = 0;
        
        // Use transaction for bulk import
        await db.transaction(async () => {
            for (const emp of employees) {
                try {
                    // Check district permission for each employee
                    if (emp.district && !user.allowedDistricts.includes('all')) {
                        if (!user.allowedDistricts.includes(emp.district)) {
                            failed++;
                            continue;
                        }
                    }
                    
                    await db.createEmployee(emp, user.id || user.username);
                    imported++;
                } catch (error) {
                    console.error('Failed to import employee:', error);
                    failed++;
                }
            }
        });
        
        res.json({
            success: true,
            message: `Import yakunlandi: ${imported} ta muvaffaqiyatli, ${failed} ta xato`,
            imported,
            failed
        });
    } catch (error) {
        console.error('Error importing employees:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Import qilishda xatolik' 
        });
    }
});

module.exports = router;