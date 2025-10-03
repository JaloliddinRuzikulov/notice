const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { parseExcelFile } = require('../lib/excel-parser');
const { AppDataSource, initializeDatabase } = require('../lib/typeorm-config');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ];
        
        if (allowedTypes.includes(file.mimetype) || 
            file.originalname.match(/\.(xlsx?|csv)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Faqat Excel (.xlsx, .xls) yoki CSV fayllar qabul qilinadi'));
        }
    }
});

// Import employees from Excel file
router.post('/import-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Fayl yuklanmadi'
            });
        }
        
        const user = req.session.user;
        let employees = [];
        
        // Parse based on file type
        if (req.file.originalname.match(/\.xlsx?$/i)) {
            // Parse Excel file
            employees = await parseExcelFile(req.file.buffer);
        } else if (req.file.originalname.match(/\.csv$/i)) {
            // Parse CSV file
            const csvText = req.file.buffer.toString('utf-8');
            const lines = csvText.split('\n');
            
            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Handle CSV with quotes
                const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
                const values = [];
                let match;
                while ((match = regex.exec(line)) !== null) {
                    values.push(match[0].replace(/^"(.*)"$/, '$1').trim());
                }
                
                if (values.length >= 7) {
                    const name = values[0];
                    const phone = values[4];
                    
                    if (name && phone) {
                        employees.push({
                            name: name,
                            position: values[1] || '',
                            rank: values[2] || '',
                            department: values[3] || '',
                            phoneNumber: phone.replace(/\D/g, '').slice(-9),
                            servicePhone: values[5] || '',
                            district: values[6] || ''
                        });
                    }
                }
            }
        }
        
        if (employees.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Faylda ma\'lumot topilmadi'
            });
        }
        
        // Initialize database and get repositories
        await initializeDatabase();
        const employeeRepo = AppDataSource.getRepository('Employee');
        const districtRepo = AppDataSource.getRepository('District');
        const departmentRepo = AppDataSource.getRepository('Department');

        // Load districts
        const districtsData = await districtRepo.find();
        const existingDistrictNames = new Set(districtsData.map(d => d.name));
        
        // Process employees
        let imported = 0;
        let failed = 0;
        let errors = [];
        let newDistricts = new Set();
        let newDepartments = new Set();
        
        for (const emp of employees) {
            try {
                // Validate required fields
                if (!emp.name || !emp.phoneNumber) {
                    errors.push(`${emp.name || 'Nomsiz'} - ism va telefon majburiy`);
                    failed++;
                    continue;
                }
                
                // Check/create district
                let districtName = emp.district ? emp.district.trim() : '';
                if (districtName && !existingDistrictNames.has(districtName)) {
                    newDistricts.add(districtName);
                    existingDistrictNames.add(districtName);
                }
                
                // Check permissions
                if (districtName && user.role !== 'admin' && !user.allowedDistricts?.includes('all')) {
                    const districtObj = districtsData.find(d => d.name === districtName);
                    const districtId = districtObj ? districtObj.id : districtName;
                    
                    if (!user.allowedDistricts?.includes(districtId)) {
                        errors.push(`${emp.name} - ${districtName} tumaniga ruxsat yo'q`);
                        failed++;
                        continue;
                    }
                }
                
                // Track new departments
                if (emp.department && emp.department.trim()) {
                    newDepartments.add(emp.department.trim());
                }
                
                // Format phone
                const phoneFormatter = require('../lib/phone-formatter');
                const formattedPhone = phoneFormatter.format(emp.phoneNumber);
                if (!formattedPhone) {
                    errors.push(`${emp.name} - telefon raqam formati noto'g'ri`);
                    failed++;
                    continue;
                }

                // Create employee entity (TypeORM will auto-generate ID and timestamps)
                const newEmployee = employeeRepo.create({
                    name: emp.name,
                    phone_number: formattedPhone,
                    service_phone: emp.servicePhone || '',
                    position: emp.position || '',
                    rank: emp.rank || '',
                    department: emp.department || '',
                    district: districtName,
                    deleted: false,
                    created_by: user.username || user.name
                });

                // Save to database
                await employeeRepo.save(newEmployee);
                imported++;
                
            } catch (error) {
                errors.push(`${emp.name || 'Nomsiz'} - ${error.message}`);
                failed++;
            }
        }
        
        // Create new districts if any
        if (newDistricts.size > 0) {
            for (const districtName of newDistricts) {
                const newDistrict = districtRepo.create({
                    name: districtName
                });
                await districtRepo.save(newDistrict);
            }
        }

        // Create new departments if any
        if (newDepartments.size > 0) {
            const existingDepartments = await departmentRepo.find();
            const existingDeptNames = new Set(existingDepartments.map(d => d.name));

            for (const deptName of newDepartments) {
                if (!existingDeptNames.has(deptName)) {
                    const newDepartment = departmentRepo.create({
                        name: deptName,
                        description: ''
                    });
                    await departmentRepo.save(newDepartment);
                }
            }
        }
        
        let resultMessage = `Import yakunlandi: ${imported} ta qo'shildi, ${failed} ta xato`;
        if (newDistricts.size > 0) {
            resultMessage += `. ${newDistricts.size} ta yangi tuman qo'shildi`;
        }
        if (newDepartments.size > 0) {
            resultMessage += `. ${newDepartments.size} ta yangi bo'lim qo'shildi`;
        }
        
        res.json({
            success: true,
            message: resultMessage,
            imported,
            failed,
            newDistricts: Array.from(newDistricts),
            newDepartments: Array.from(newDepartments),
            errors: errors.slice(0, 10)
        });
        
    } catch (error) {
        console.error('Excel import error:', error);
        res.status(500).json({
            success: false,
            message: 'Import xatosi: ' + error.message
        });
    }
});

module.exports = router;