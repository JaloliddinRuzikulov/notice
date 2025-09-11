const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { parseExcelFile } = require('../lib/excel-parser');
const safeFileOps = require('../lib/safe-file-ops');

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
        
        // Load existing data
        const fs = require('fs').promises;
        const DATA_FILE = path.join(__dirname, '../data/employees.json');
        
        let employeesList = [];
        try {
            const data = await fs.readFile(DATA_FILE, 'utf8');
            employeesList = JSON.parse(data);
        } catch (error) {
            console.log('No existing employees file, starting fresh');
            employeesList = [];
        }
        
        // Convert to Map for easy management
        const employeesMap = new Map();
        employeesList.forEach(emp => {
            if (emp.id) {
                employeesMap.set(emp.id, emp);
            }
        });
        
        // Load districts
        const districtsData = await safeFileOps.readJSON(path.join(__dirname, '../data/districts.json'), []);
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
                
                // Create employee
                const employeeData = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: emp.name,
                    phoneNumber: formattedPhone,
                    servicePhone: emp.servicePhone || '',
                    position: emp.position || '',
                    rank: emp.rank || '',
                    department: emp.department || '',
                    district: districtName,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Add to map
                employeesMap.set(employeeData.id, employeeData);
                imported++;
                
            } catch (error) {
                errors.push(`${emp.name || 'Nomsiz'} - ${error.message}`);
                failed++;
            }
        }
        
        // Create new districts if any
        if (newDistricts.size > 0) {
            for (const districtName of newDistricts) {
                const newDistrict = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: districtName,
                    type: districtName.toLowerCase().includes('shahar') ? 'shahar' : 'tuman'
                };
                districtsData.push(newDistrict);
            }
            await safeFileOps.writeJSON(path.join(__dirname, '../data/districts.json'), districtsData);
        }
        
        // Create new departments if any
        if (newDepartments.size > 0) {
            const departmentsFile = path.join(__dirname, '../data/departments.json');
            let departmentsData = [];
            try {
                departmentsData = await safeFileOps.readJSON(departmentsFile, []);
            } catch (e) {
                // File might not exist
            }
            
            for (const deptName of newDepartments) {
                if (!departmentsData.find(d => d.name === deptName)) {
                    departmentsData.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        name: deptName,
                        createdAt: new Date().toISOString()
                    });
                }
            }
            await safeFileOps.writeJSON(departmentsFile, departmentsData);
        }
        
        // Save employees to file
        const updatedEmployeesList = Array.from(employeesMap.values());
        await fs.writeFile(DATA_FILE, JSON.stringify(updatedEmployeesList, null, 2));
        
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