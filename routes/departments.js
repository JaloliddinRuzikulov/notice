const express = require('express');
const router = express.Router();
const { AppDataSource, initializeDatabase } = require('../lib/typeorm-config');

// Get all departments
router.get('/', async (req, res) => {
    try {
        await initializeDatabase();
        const departmentRepo = AppDataSource.getRepository('Department');
        const employeeRepo = AppDataSource.getRepository('Employee');

        const departments = await departmentRepo.find({
            order: { name: 'ASC' }
        });

        // Get employee counts for each department
        const employees = await employeeRepo.find({
            where: { deleted: false }
        });

        const departmentsWithCounts = departments.map(dept => {
            const employeeCount = employees.filter(emp => emp.department === dept.name).length;
            return {
                id: dept.id,
                name: dept.name,
                description: dept.description,
                employeeCount
            };
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
        await initializeDatabase();
        const employeeRepo = AppDataSource.getRepository('Employee');
        const { departmentName } = req.params;

        const departmentEmployees = await employeeRepo.find({
            where: {
                department: departmentName,
                deleted: false
            },
            order: { name: 'ASC' }
        });

        // Map to camelCase format
        const mappedEmployees = departmentEmployees.map(emp => ({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            rank: emp.rank,
            department: emp.department,
            phoneNumber: emp.phone_number,
            servicePhone: emp.service_phone,
            district: emp.district,
            createdAt: emp.created_at,
            updatedAt: emp.updated_at
        }));

        res.json(mappedEmployees);
    } catch (error) {
        console.error('Error reading employees:', error);
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Create new department
router.post('/', async (req, res) => {
    try {
        await initializeDatabase();
        const departmentRepo = AppDataSource.getRepository('Department');
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Bo\'lim nomi kiritilishi shart!' });
        }

        // Check if department exists (using TypeORM)
        const existingDept = await departmentRepo.findOne({
            where: { name: name }
        });

        if (existingDept) {
            return res.status(400).json({ success: false, message: 'Bu bo\'lim allaqachon mavjud!' });
        }

        // Create new department using TypeORM
        const newDepartment = departmentRepo.create({
            name,
            description: description || ''
        });

        await departmentRepo.save(newDepartment);

        res.json({
            success: true,
            department: {
                id: newDepartment.id,
                name: newDepartment.name,
                description: newDepartment.description
            }
        });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

// Update department
router.put('/:id', async (req, res) => {
    try {
        await initializeDatabase();
        const departmentRepo = AppDataSource.getRepository('Department');
        const { id } = req.params;
        const { name, description } = req.body;

        // Find department by ID (using TypeORM)
        const department = await departmentRepo.findOne({
            where: { id: parseInt(id) }
        });

        if (!department) {
            return res.status(404).json({ success: false, message: 'Bo\'lim topilmadi!' });
        }

        // Check duplicate name
        if (name && name !== department.name) {
            const existingDept = await departmentRepo.findOne({
                where: { name: name }
            });

            if (existingDept) {
                return res.status(400).json({ success: false, message: 'Bu bo\'lim allaqachon mavjud!' });
            }
        }

        // Update department using TypeORM
        if (name) department.name = name;
        if (description !== undefined) department.description = description;

        await departmentRepo.save(department);

        res.json({
            success: true,
            department: {
                id: department.id,
                name: department.name,
                description: department.description
            }
        });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

// Delete department
router.delete('/:id', async (req, res) => {
    try {
        await initializeDatabase();
        const departmentRepo = AppDataSource.getRepository('Department');
        const employeeRepo = AppDataSource.getRepository('Employee');
        const { id } = req.params;

        // Find department (using TypeORM)
        const department = await departmentRepo.findOne({
            where: { id: parseInt(id) }
        });

        if (!department) {
            return res.status(404).json({ success: false, message: 'Bo\'lim topilmadi!' });
        }

        // Check if department has employees (using TypeORM)
        const deptEmployees = await employeeRepo.find({
            where: {
                department: department.name,
                deleted: false
            }
        });

        if (deptEmployees.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Bu bo'limda ${deptEmployees.length} ta xodim mavjud. Avval xodimlarni boshqa bo'limga o'tkazing!`
            });
        }

        // Delete department using TypeORM
        await departmentRepo.remove(department);

        res.json({ success: true, message: 'Bo\'lim muvaffaqiyatli o\'chirildi' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ success: false, message: 'Server xatosi' });
    }
});

module.exports = router;