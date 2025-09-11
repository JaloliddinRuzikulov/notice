const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Get phonebook data (combines employees, departments, and districts)
router.get('/data', async (req, res) => {
    try {
        // Read all necessary data files
        const [employeesData, departmentsData, districtsData] = await Promise.all([
            fs.readFile(path.join(__dirname, '../data/employees.json'), 'utf8'),
            fs.readFile(path.join(__dirname, '../data/departments.json'), 'utf8'),
            fs.readFile(path.join(__dirname, '../data/districts.json'), 'utf8')
        ]);

        const employees = JSON.parse(employeesData);
        const departments = JSON.parse(departmentsData);
        const districts = JSON.parse(districtsData);

        // Filter only active employees
        const activeEmployees = employees.filter(emp => !emp.deleted);

        // Return combined data
        res.json({
            employees: activeEmployees,
            departments: departments,
            districts: districts
        });
    } catch (error) {
        console.error('Error reading phonebook data:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ma\'lumotlarni o\'qishda xatolik' 
        });
    }
});

module.exports = router;