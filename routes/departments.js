const express = require('express');
const router = express.Router();
const path = require('path');
const safeFileOps = require('../lib/safe-file-ops');

const departmentsFile = path.join(__dirname, '../data/departments.json');
const employeesFile = path.join(__dirname, '../data/employees.json');

// Get all departments
router.get('/', async (req, res) => {
    try {
        const departments = await safeFileOps.readJSON(departmentsFile, []);
        
        // Get employee counts for each department
        const employees = await safeFileOps.readJSON(employeesFile, []);
        
        const departmentsWithCounts = departments.map(dept => {
            const employeeCount = employees.filter(emp => emp.department === dept.name).length;
            return { ...dept, employeeCount };
        });
        
        res.json(departmentsWithCounts);
    } catch (error) {
        console.error('Error reading departments:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Get employees by department
router.get('/:departmentName/employees', async (req, res) => {
    try {
        const { departmentName } = req.params;
        const employees = await safeFileOps.readJSON(employeesFile, []);
        
        const departmentEmployees = employees.filter(emp => emp.department === departmentName);
        res.json(departmentEmployees);
    } catch (error) {
        console.error('Error reading employees:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Create new department
router.post('/', async (req, res) => {
    try {
        const { name, description, head, district } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, message: 'Bo\'lim nomi kiritilishi shart!' });
        }
        
        const departments = await safeFileOps.readJSON(departmentsFile, []);
        
        // Check if department exists
        if (departments.some(d => d.name === name && d.district === district)) {
            return res.status(400).json({ success: false, message: 'Bu bo\'lim allaqachon mavjud!' });
        }
        
        const newDepartment = {
            id: Date.now().toString(),
            name,
            description: description || '',
            head: head || '',
            district: district || 'all',
            createdAt: new Date().toISOString()
        };
        
        departments.push(newDepartment);
        await safeFileOps.writeJSON(departmentsFile, departments);
        
        res.json({ success: true, department: newDepartment });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

// Update department
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, head, district } = req.body;
        
        const departments = await safeFileOps.readJSON(departmentsFile, []);
        
        const index = departments.findIndex(d => d.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Bo\'lim topilmadi!' });
        }
        
        // Check duplicate name in same district
        if (departments.some(d => d.id !== id && d.name === name && d.district === (district || departments[index].district))) {
            return res.status(400).json({ success: false, message: 'Bu bo\'lim allaqachon mavjud!' });
        }
        
        departments[index] = {
            ...departments[index],
            name: name || departments[index].name,
            description: description !== undefined ? description : departments[index].description,
            head: head !== undefined ? head : departments[index].head,
            district: district !== undefined ? district : departments[index].district,
            updatedAt: new Date().toISOString()
        };
        
        await safeFileOps.writeJSON(departmentsFile, departments);
        
        res.json({ success: true, department: departments[index] });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

// Delete department
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const departments = await safeFileOps.readJSON(departmentsFile, []);
        
        const index = departments.findIndex(d => d.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Bo\'lim topilmadi!' });
        }
        
        // Check if department has employees
        const employees = await safeFileOps.readJSON(employeesFile, []);
        const deptEmployees = employees.filter(emp => emp.department === departments[index].id || emp.department === departments[index].name);
        
        if (deptEmployees.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Bu bo'limda ${deptEmployees.length} ta xodim mavjud. Avval xodimlarni boshqa bo'limga o'tkazing!` 
            });
        }
        
        departments.splice(index, 1);
        await safeFileOps.writeJSON(departmentsFile, departments);
        
        res.json({ success: true, message: 'Bo\'lim muvaffaqiyatli o\'chirildi' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

module.exports = router;