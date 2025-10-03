const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../lib/typeorm-config');
const Employee = require('../lib/entities/Employee');
const Department = require('../lib/entities/Department');
const District = require('../lib/entities/District');

// Get phonebook data (combines employees, departments, and districts)
router.get('/data', async (req, res) => {
    try {
        const employeeRepository = AppDataSource.getRepository(Employee);
        const departmentRepository = AppDataSource.getRepository(Department);
        const districtRepository = AppDataSource.getRepository(District);

        // Get all data using TypeORM (NO SQL INJECTION!)
        const [employees, departments, districts] = await Promise.all([
            employeeRepository.find({ where: { deleted: false } }),
            departmentRepository.find(),
            districtRepository.find()
        ]);

        // Return combined data
        res.json({
            employees: employees,
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