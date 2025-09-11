const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { checkDistrictAccess } = require('../middleware/auth');
const { filterGroupsByDistrict } = require('../lib/district-filter');
const safeFileOps = require('../lib/safe-file-ops');

const groupsFile = path.join(__dirname, '../data/groups.json');
const employeesFile = path.join(__dirname, '../data/employees.json');

// Get all groups
router.get('/', checkDistrictAccess(), async (req, res) => {
    try {
        const groups = await safeFileOps.readJSON(groupsFile, []);
        
        // Load employees to check districts
        const employees = await safeFileOps.readJSON(employeesFile, []);
        
        // Filter groups by district access
        const filteredGroups = filterGroupsByDistrict(
            groups,
            employees,
            req.userAllowedDistricts,
            req.userCanAccessAllDistricts
        );
        
        res.json(filteredGroups);
    } catch (error) {
        console.error('Error reading groups:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Get single group
router.get('/:id', async (req, res) => {
    try {
        const groups = await safeFileOps.readJSON(groupsFile, []);
        const group = groups.find(g => g.id === req.params.id);
        
        if (!group) {
            return res.status(404).json({ error: 'Guruh topilmadi' });
        }
        
        res.json(group);
    } catch (error) {
        console.error('Error reading group:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Create new group
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Guruh nomi majburiy' });
        }
        
        const groups = await safeFileOps.readJSON(groupsFile, []);
        
        const newGroup = {
            id: uuidv4(),
            name,
            description: description || '',
            members: [],
            createdAt: new Date().toISOString()
        };
        
        groups.push(newGroup);
        await safeFileOps.writeJSON(groupsFile, groups);
        
        res.status(201).json(newGroup);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Update group
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const groups = await safeFileOps.readJSON(groupsFile, []);
        
        const index = groups.findIndex(g => g.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Guruh topilmadi' });
        }
        
        groups[index] = {
            ...groups[index],
            name: name || groups[index].name,
            description: description !== undefined ? description : groups[index].description,
            updatedAt: new Date().toISOString()
        };
        
        await safeFileOps.writeJSON(groupsFile, groups);
        res.json(groups[index]);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Delete group
router.delete('/:id', async (req, res) => {
    try {
        const groups = await safeFileOps.readJSON(groupsFile, []);
        
        const filteredGroups = groups.filter(g => g.id !== req.params.id);
        
        if (filteredGroups.length === groups.length) {
            return res.status(404).json({ error: 'Guruh topilmadi' });
        }
        
        // Remove group from all employees
        const employees = await safeFileOps.readJSON(employeesFile, []);
        
        employees.forEach(emp => {
            if (emp.groups) {
                emp.groups = emp.groups.filter(gId => gId !== req.params.id);
            }
        });
        
        await safeFileOps.writeJSON(employeesFile, employees);
        await safeFileOps.writeJSON(groupsFile, filteredGroups);
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Update group members
router.put('/:id/members', async (req, res) => {
    try {
        const { memberIds } = req.body;
        const groupId = req.params.id;
        
        console.log('Updating group members:', { groupId, memberIds });
        
        // Read employees
        const employees = await safeFileOps.readJSON(employeesFile, []);
        
        // Update each employee's groups
        employees.forEach(emp => {
            if (!emp.groups) emp.groups = [];
            
            if (memberIds.includes(emp.id)) {
                // Add to group if not already
                if (!emp.groups.includes(groupId)) {
                    emp.groups.push(groupId);
                }
            } else {
                // Remove from group
                emp.groups = emp.groups.filter(gId => gId !== groupId);
            }
        });
        
        await safeFileOps.writeJSON(employeesFile, employees);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating members:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Remove member from group
router.delete('/:groupId/members/:employeeId', async (req, res) => {
    try {
        const { groupId, employeeId } = req.params;
        
        const employees = await safeFileOps.readJSON(employeesFile, []);
        
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) {
            return res.status(404).json({ error: 'Xodim topilmadi' });
        }
        
        if (employee.groups) {
            employee.groups = employee.groups.filter(gId => gId !== groupId);
        }
        
        await safeFileOps.writeJSON(employeesFile, employees);
        res.status(204).send();
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

module.exports = router;