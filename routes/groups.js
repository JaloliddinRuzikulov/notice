const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { checkDistrictAccess } = require('../middleware/auth');
const { filterGroupsByDistrict } = require('../lib/district-filter');
const { AppDataSource } = require('../lib/typeorm-config');
const Group = require('../lib/entities/Group');
const Employee = require('../lib/entities/Employee');

// Get all groups
router.get('/', checkDistrictAccess(), async (req, res) => {
    try {
        const groupRepository = AppDataSource.getRepository(Group);
        const employeeRepository = AppDataSource.getRepository(Employee);

        // Load groups and employees using TypeORM (NO SQL INJECTION!)
        const [groups, employees] = await Promise.all([
            groupRepository.find(),
            employeeRepository.find({ where: { deleted: false } })
        ]);

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
        const groupRepository = AppDataSource.getRepository(Group);

        // Find group using TypeORM (NO SQL INJECTION!)
        const group = await groupRepository.findOne({
            where: { id: req.params.id }
        });

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

        const groupRepository = AppDataSource.getRepository(Group);

        // Create new group using TypeORM (NO SQL INJECTION!)
        const newGroup = groupRepository.create({
            id: uuidv4(),
            name,
            description: description || '',
            members: []
        });

        await groupRepository.save(newGroup);

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
        const groupRepository = AppDataSource.getRepository(Group);

        // Find group using TypeORM (NO SQL INJECTION!)
        const group = await groupRepository.findOne({
            where: { id: req.params.id }
        });

        if (!group) {
            return res.status(404).json({ error: 'Guruh topilmadi' });
        }

        // Update fields
        if (name) group.name = name;
        if (description !== undefined) group.description = description;

        // Save using TypeORM (NO SQL INJECTION!)
        await groupRepository.save(group);

        res.json(group);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Delete group
router.delete('/:id', async (req, res) => {
    try {
        const groupRepository = AppDataSource.getRepository(Group);
        const employeeRepository = AppDataSource.getRepository(Employee);

        // Find group using TypeORM (NO SQL INJECTION!)
        const group = await groupRepository.findOne({
            where: { id: req.params.id }
        });

        if (!group) {
            return res.status(404).json({ error: 'Guruh topilmadi' });
        }

        // Note: Employee groups are stored in groups table members field, not employee table
        // So we just delete the group
        await groupRepository.remove(group);

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

        const groupRepository = AppDataSource.getRepository(Group);

        // Find group using TypeORM (NO SQL INJECTION!)
        const group = await groupRepository.findOne({
            where: { id: groupId }
        });

        if (!group) {
            return res.status(404).json({ error: 'Guruh topilmadi' });
        }

        // Update members array
        group.members = memberIds || [];

        // Save using TypeORM (NO SQL INJECTION!)
        await groupRepository.save(group);

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

        const groupRepository = AppDataSource.getRepository(Group);

        // Find group using TypeORM (NO SQL INJECTION!)
        const group = await groupRepository.findOne({
            where: { id: groupId }
        });

        if (!group) {
            return res.status(404).json({ error: 'Guruh topilmadi' });
        }

        // Remove employee from members array
        group.members = (group.members || []).filter(id => id !== employeeId);

        // Save using TypeORM (NO SQL INJECTION!)
        await groupRepository.save(group);

        res.status(204).send();
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

module.exports = router;