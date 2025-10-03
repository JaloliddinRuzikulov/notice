const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../lib/typeorm-config');
const Employee = require('../lib/entities/Employee');
const Department = require('../lib/entities/Department');
const District = require('../lib/entities/District');

// Get all employees with district filtering
router.get('/', async (req, res) => {
    try {
        const employeeRepository = AppDataSource.getRepository(Employee);
        const departmentRepository = AppDataSource.getRepository(Department);
        const districtRepository = AppDataSource.getRepository(District);

        // Load departments and districts using TypeORM (NO SQL INJECTION!)
        const [departments, districts] = await Promise.all([
            departmentRepository.find(),
            districtRepository.find()
        ]);

        // Build query for TypeORM
        const user = req.session.user;
        let where = { deleted: false };

        // Check user's district permissions using TypeORM (NO SQL INJECTION!)
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

            // Fetch all non-deleted employees using TypeORM
            const allEmployees = await employeeRepository.find({ where: { deleted: false } });

            // Filter by allowed districts
            const filteredEmployees = allEmployees.filter(emp =>
                allowedDistrictNames.includes(emp.district)
            );

            console.log('[EMPLOYEES API] Filtered employees count:', filteredEmployees.length);

            // Map database fields to frontend format
            const mappedEmployees = filteredEmployees.map(emp => ({
                id: emp.id,
                name: emp.name,
                position: emp.position,
                rank: emp.rank,
                department: emp.department,
                phoneNumber: emp.phone_number,
                servicePhone: emp.service_phone,
                district: emp.district,
                deleted: emp.deleted,
                createdAt: emp.created_at,
                updatedAt: emp.updated_at,
                createdBy: emp.created_by
            }));

            return res.json({
                success: true,
                employees: mappedEmployees,
                departments: departments
            });
        }

        // Get all employees using TypeORM (NO SQL INJECTION!)
        const employees = await employeeRepository.find({ where });

        // Map database fields to frontend format
        const mappedEmployees = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            rank: emp.rank,
            department: emp.department,
            phoneNumber: emp.phone_number,
            servicePhone: emp.service_phone,
            district: emp.district,
            deleted: emp.deleted,
            createdAt: emp.created_at,
            updatedAt: emp.updated_at,
            createdBy: emp.created_by
        }));

        res.json({
            success: true,
            employees: mappedEmployees,
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
        const employeeRepository = AppDataSource.getRepository(Employee);
        const districtRepository = AppDataSource.getRepository(District);

        // Load districts using TypeORM (NO SQL INJECTION!)
        const districts = await districtRepository.find();

        // Check user's district permissions using TypeORM (NO SQL INJECTION!)
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

            // Fetch all non-deleted employees using TypeORM
            const allEmployees = await employeeRepository.find({ where: { deleted: false } });

            // Filter by allowed districts
            const employees = allEmployees.filter(emp =>
                allowedDistrictNames.includes(emp.district)
            );

            return res.json({
                success: true,
                count: employees.length
            });
        }

        // Get count using TypeORM (NO SQL INJECTION!)
        const count = await employeeRepository.count({ where: { deleted: false } });

        res.json({
            success: true,
            count: count
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

        const employeeRepository = AppDataSource.getRepository(Employee);
        const districtRepository = AppDataSource.getRepository(District);

        // Load districts using TypeORM (NO SQL INJECTION!)
        const districts = await districtRepository.find();

        // Convert district ID to name if needed
        let districtName = data.district;
        if (data.district) {
            const districtObj = districts.find(d => d.id === parseInt(data.district) || d.name === data.district);
            if (districtObj) {
                districtName = districtObj.name;
                // Check district permission using ID
                if (!user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(districtObj.id.toString())) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bu tumanga ruxsatingiz yo\'q'
                    });
                }
            }
        }

        // Create new employee using TypeORM (NO SQL INJECTION!)
        const newEmployee = employeeRepository.create({
            name: data.name,
            position: data.position || '',
            rank: data.rank || '',
            department: data.department || '',
            phone_number: data.phoneNumber,
            service_phone: data.servicePhone || '',
            district: districtName,
            deleted: false,
            created_by: user.id || user.username
        });

        await employeeRepository.save(newEmployee);

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

        const employeeRepository = AppDataSource.getRepository(Employee);
        const districtRepository = AppDataSource.getRepository(District);

        // Find employee using TypeORM (NO SQL INJECTION!)
        const employee = await employeeRepository.findOne({
            where: { id: parseInt(id), deleted: false }
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }

        // Load districts using TypeORM (NO SQL INJECTION!)
        const districts = await districtRepository.find();

        // Convert district ID to name if district is being updated
        if (data.district) {
            const districtObj = districts.find(d => d.id === parseInt(data.district) || d.name === data.district);
            if (districtObj) {
                data.district = districtObj.name; // Always use district name
                // Check district permission using ID
                if (!user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(districtObj.id.toString())) {
                    return res.status(403).json({
                        success: false,
                        message: 'Bu tumanga ruxsatingiz yo\'q'
                    });
                }
            }
        }

        // Check district permission (find district by name to get ID)
        const currentDistrict = districts.find(d => d.name === employee.district);
        if (currentDistrict && !user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(currentDistrict.id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Bu xodimni tahrirlash uchun ruxsatingiz yo\'q'
            });
        }

        // Update employee data
        if (data.name) employee.name = data.name;
        if (data.position !== undefined) employee.position = data.position;
        if (data.rank !== undefined) employee.rank = data.rank;
        if (data.department !== undefined) employee.department = data.department;
        if (data.phoneNumber) employee.phone_number = data.phoneNumber;
        if (data.servicePhone !== undefined) employee.service_phone = data.servicePhone;
        if (data.district) employee.district = data.district;
        employee.updated_at = new Date();
        employee.created_by = user.id || user.username; // Note: should be updated_by but schema doesn't have it

        // Save using TypeORM (NO SQL INJECTION!)
        await employeeRepository.save(employee);

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

        const employeeRepository = AppDataSource.getRepository(Employee);
        const districtRepository = AppDataSource.getRepository(District);

        // Find employee using TypeORM (NO SQL INJECTION!)
        const employee = await employeeRepository.findOne({
            where: { id: parseInt(id), deleted: false }
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Xodim topilmadi'
            });
        }

        // Load districts to check permission
        const districts = await districtRepository.find();
        const currentDistrict = districts.find(d => d.name === employee.district);

        // Check district permission
        if (currentDistrict && !user.allowedDistricts.includes('all') && !user.allowedDistricts.includes(currentDistrict.id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'Bu xodimni o\'chirish uchun ruxsatingiz yo\'q'
            });
        }

        // Soft delete
        employee.deleted = true;
        employee.created_by = user.id || user.username; // Note: should be deleted_by but schema doesn't have it

        // Save using TypeORM (NO SQL INJECTION!)
        await employeeRepository.save(employee);

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

        const employeeRepository = AppDataSource.getRepository(Employee);

        // Use TypeORM transaction for bulk import
        await AppDataSource.transaction(async (transactionalEntityManager) => {
            for (const emp of employees) {
                try {
                    // Check district permission for each employee
                    if (emp.district && !user.allowedDistricts.includes('all')) {
                        if (!user.allowedDistricts.includes(emp.district)) {
                            failed++;
                            continue;
                        }
                    }

                    // Create employee using TypeORM (NO SQL INJECTION!)
                    const newEmployee = transactionalEntityManager.create(Employee, {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: emp.name,
                        position: emp.position || '',
                        rank: emp.rank || '',
                        department: emp.department || '',
                        phone_number: emp.phoneNumber || emp.phone_number,
                        service_phone: emp.servicePhone || emp.service_phone || '',
                        district: emp.district || '',
                        created_by: user.id || user.username,
                        deleted: false
                    });

                    await transactionalEntityManager.save(newEmployee);
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