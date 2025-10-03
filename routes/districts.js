const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../lib/typeorm-config');
const District = require('../lib/entities/District');

// Get all districts
router.get('/', async (req, res) => {
    try {
        const districtRepository = AppDataSource.getRepository(District);
        // Get all districts using TypeORM (NO SQL INJECTION!)
        const districts = await districtRepository.find({
            order: { name: 'ASC' }
        });
        res.json(districts);
    } catch (error) {
        console.error('Error reading districts:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Get single district
router.get('/:id', async (req, res) => {
    try {
        const districtRepository = AppDataSource.getRepository(District);
        // Find district by ID using TypeORM (NO SQL INJECTION!)
        const district = await districtRepository.findOne({
            where: { id: parseInt(req.params.id) }
        });

        if (!district) {
            return res.status(404).json({ error: 'Shahar/tuman topilmadi' });
        }

        res.json(district);
    } catch (error) {
        console.error('Error reading district:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Create new district
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Tuman nomi kiritilishi kerak' });
        }

        const districtRepository = AppDataSource.getRepository(District);

        // Check if district already exists using TypeORM (NO SQL INJECTION!)
        const existing = await districtRepository.findOne({
            where: { name: name.trim() }
        });

        if (existing) {
            return res.status(400).json({ error: 'Bu shahar/tuman allaqachon mavjud' });
        }

        // Create new district using TypeORM (NO SQL INJECTION!)
        const newDistrict = districtRepository.create({
            name: name.trim()
        });

        await districtRepository.save(newDistrict);

        res.json({ success: true, district: newDistrict });
    } catch (error) {
        console.error('Error creating district:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Update district
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const districtRepository = AppDataSource.getRepository(District);

        // Find district using TypeORM (NO SQL INJECTION!)
        const district = await districtRepository.findOne({
            where: { id: parseInt(req.params.id) }
        });

        if (!district) {
            return res.status(404).json({ error: 'Shahar/tuman topilmadi' });
        }

        // Check if new name already exists using TypeORM (NO SQL INJECTION!)
        if (name) {
            const existing = await districtRepository.findOne({
                where: { name: name.trim() }
            });
            if (existing && existing.id !== district.id) {
                return res.status(400).json({ error: 'Bu nom allaqachon mavjud' });
            }
        }

        if (name && name.trim()) {
            district.name = name.trim();
        }

        await districtRepository.save(district);

        res.json({ success: true, district });
    } catch (error) {
        console.error('Error updating district:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Delete district
router.delete('/:id', async (req, res) => {
    try {
        const districtRepository = AppDataSource.getRepository(District);
        const Employee = require('../lib/entities/Employee');
        const employeeRepository = AppDataSource.getRepository(Employee);

        // Find district using TypeORM (NO SQL INJECTION!)
        const district = await districtRepository.findOne({
            where: { id: parseInt(req.params.id) }
        });

        if (!district) {
            return res.status(404).json({ error: 'Shahar/tuman topilmadi' });
        }

        // Check if any employees are using this district using TypeORM (NO SQL INJECTION!)
        const employeesCount = await employeeRepository.count({
            where: { district: district.name, deleted: false }
        });

        if (employeesCount > 0) {
            return res.status(400).json({
                error: `Bu shahar/tumanda ${employeesCount} ta xodim mavjud. Avval ularni boshqa tumanga o'tkazing.`
            });
        }

        await districtRepository.remove(district);

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting district:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

module.exports = router;