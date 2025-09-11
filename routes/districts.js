const express = require('express');
const router = express.Router();
const path = require('path');
const safeFileOps = require('../lib/safe-file-ops');

const districtsFile = path.join(__dirname, '../data/districts.json');
const publicDistrictsFile = path.join(__dirname, '../public/districts.json');

// Get all districts
router.get('/', async (req, res) => {
    try {
        const districts = await safeFileOps.readJSON(districtsFile, []);
        res.json(districts);
    } catch (error) {
        console.error('Error reading districts:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Get single district
router.get('/:id', async (req, res) => {
    try {
        const districts = await safeFileOps.readJSON(districtsFile, []);
        const district = districts.find(d => d.id === req.params.id);
        
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
        
        const districts = await safeFileOps.readJSON(districtsFile, []);
        
        // Check if district already exists
        if (districts.some(d => d.name.toLowerCase() === name.toLowerCase())) {
            return res.status(400).json({ error: 'Bu shahar/tuman allaqachon mavjud' });
        }
        
        const newDistrict = {
            id: Date.now().toString(),
            name: name.trim()
        };
        
        districts.push(newDistrict);
        
        // Sort districts by name
        districts.sort((a, b) => {
            return a.name.localeCompare(b.name, 'uz');
        });
        
        // Save to both files
        try {
            await safeFileOps.writeJSON(districtsFile, districts);
        } catch (error) {
            console.error('Failed to write to data/districts.json:', error.message);
            // Continue anyway - at least save to public file
        }
        
        try {
            await safeFileOps.writeJSON(publicDistrictsFile, districts);
        } catch (error) {
            console.error('Failed to write to public/districts.json:', error.message);
            throw error; // This one must work
        }
        
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
        const districts = await safeFileOps.readJSON(districtsFile, []);
        const index = districts.findIndex(d => d.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Shahar/tuman topilmadi' });
        }
        
        // Check if new name already exists
        if (name && districts.some(d => d.name.toLowerCase() === name.toLowerCase() && d.id !== req.params.id)) {
            return res.status(400).json({ error: 'Bu nom allaqachon mavjud' });
        }
        
        if (name && name.trim()) districts[index].name = name.trim();
        
        // Re-sort after update
        districts.sort((a, b) => {
            return a.name.localeCompare(b.name, 'uz');
        });
        
        try {
            await safeFileOps.writeJSON(districtsFile, districts);
        } catch (error) {
            console.error('Failed to write to data/districts.json:', error.message);
        }
        
        try {
            await safeFileOps.writeJSON(publicDistrictsFile, districts);
        } catch (error) {
            console.error('Failed to write to public/districts.json:', error.message);
            throw error;
        }
        
        res.json({ success: true, district: districts[index] });
    } catch (error) {
        console.error('Error updating district:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Delete district
router.delete('/:id', async (req, res) => {
    try {
        const districts = await safeFileOps.readJSON(districtsFile, []);
        
        const filteredDistricts = districts.filter(d => d.id !== req.params.id);
        
        if (filteredDistricts.length === districts.length) {
            return res.status(404).json({ error: 'Shahar/tuman topilmadi' });
        }
        
        // Check if any employees are using this district
        const employees = await safeFileOps.readJSON(path.join(__dirname, '../data/employees.json'), []);
        const employeesInDistrict = employees.filter(emp => emp.district === req.params.id);
        
        if (employeesInDistrict.length > 0) {
            return res.status(400).json({ 
                error: `Bu shahar/tumanda ${employeesInDistrict.length} ta xodim mavjud. Avval ularni boshqa tumanga o'tkazing.` 
            });
        }
        
        try {
            await safeFileOps.writeJSON(districtsFile, filteredDistricts);
        } catch (error) {
            console.error('Failed to write to data/districts.json:', error.message);
        }
        
        try {
            await safeFileOps.writeJSON(publicDistrictsFile, filteredDistricts);
        } catch (error) {
            console.error('Failed to write to public/districts.json:', error.message);
            throw error;
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting district:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

module.exports = router;