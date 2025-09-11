console.log('=====================================================');
console.log('[EMPLOYEES.JS] LOADING ROUTE FILE AT:', new Date().toISOString());
console.log('[EMPLOYEES.JS] __filename:', __filename);
console.log('[EMPLOYEES.JS] This log proves the new code is loaded');
console.log('=====================================================');

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { checkDistrictAccess, filterByDistrictAccess } = require('../middleware/auth');
const safeFileOps = require('../lib/safe-file-ops');
const PhoneFormatter = require('../lib/phone-formatter');

// File paths for persisting data
const DATA_FILE = path.join(__dirname, '..', 'data', 'employees.json');
const DEPARTMENTS_FILE = path.join(__dirname, '..', 'data', 'departments.json');

// In-memory storage for employees
const employees = new Map();

// Load employees from file on startup
async function loadEmployees() {
    try {
        // Ensure data directory exists
        const dataDir = path.join(__dirname, '..', 'data');
        await fs.mkdir(dataDir, { recursive: true });
        
        // Use safe file operations to read
        const employeeArray = await safeFileOps.readJSON(DATA_FILE, []);
        
        // Clear map first to avoid duplicates
        employees.clear();
        
        // Load into Map
        employeeArray.forEach(emp => employees.set(emp.id, emp));
        
        console.log(`Loaded ${employees.size} employees from file`);
    } catch (error) {
        console.error('Error loading employees:', error);
        // Initialize with empty array if load fails
        employees.clear();
    }
}

// Save employees to file
async function saveEmployees() {
    try {
        console.log(`[SAVE DEBUG] saveEmployees() called`);
        console.log(`[SAVE DEBUG] Current employees Map size: ${employees.size}`);
        
        // Convert Map to array
        const employeeArray = Array.from(employees.values());
        console.log(`[SAVE DEBUG] Converted to array: ${employeeArray.length} employees`);
        console.log(`[SAVE DEBUG] Target file: ${DATA_FILE}`);
        
        // Use safe file operations to write
        console.log(`[SAVE DEBUG] Calling safeFileOps.writeJSON...`);
        await safeFileOps.writeJSON(DATA_FILE, employeeArray);
        console.log(`[SAVE DEBUG] safeFileOps.writeJSON completed`);
        
        console.log(`Saved ${employeeArray.length} employees to file`);
        return true;
    } catch (error) {
        console.error('[SAVE DEBUG] Error saving employees:', error);
        console.error('[SAVE DEBUG] Error stack:', error.stack);
        throw error;
    }
}

// Sample data
const sampleEmployees = [
    { id: '1', name: 'Abdullayev Jasur', position: 'Boshliq', department: 'Rahbariyat', phoneNumber: '901234567' },
    { id: '2', name: 'Karimov Anvar', position: 'Inspektor', department: 'YPX', phoneNumber: '901234568' },
    { id: '3', name: 'Toshmatov Bobur', position: 'Katta inspektor', department: 'TTB', phoneNumber: '901234569' },
    { id: '4', name: 'Raximov Dilshod', position: 'Inspektor', department: 'IIB', phoneNumber: '901234570' },
    { id: '5', name: 'Saidov Javlon', position: 'Mutaxassis', department: 'IT', phoneNumber: '901234571' }
];

// Initialize data on startup
(async () => {
    await loadEmployees();
    
    // If no employees were loaded, initialize with sample data
    if (employees.size === 0) {
        console.log('Initializing with sample employee data');
        sampleEmployees.forEach(emp => employees.set(emp.id, emp));
        await saveEmployees();
    }
})();

// Get all employees
router.get('/', checkDistrictAccess(), async (req, res) => {
    console.log('\n=== GET /api/employees ===');
    console.log('User:', req.session?.user?.username);
    console.log('Role:', req.session?.user?.role);
    console.log('userCanAccessAllDistricts:', req.userCanAccessAllDistricts);
    console.log('userAllowedDistricts:', req.userAllowedDistricts);
    
    try {
        // Always read fresh data from file
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const employeeList = JSON.parse(data);
        
        // Load departments data
        const departmentsData = await fs.readFile(DEPARTMENTS_FILE, 'utf8');
        const departments = JSON.parse(departmentsData);
        
        // Load districts data to map IDs to names
        const districtsData = await fs.readFile(path.join(__dirname, '../data/districts.json'), 'utf8');
        const districts = JSON.parse(districtsData);
        
        // Filter by district access if needed
        let filteredEmployees = employeeList;
        if (!req.userCanAccessAllDistricts && req.userAllowedDistricts) {
            // Convert allowed district IDs to names
            const allowedDistrictNames = req.userAllowedDistricts.map(districtId => {
                const district = districts.find(d => d.id === districtId);
                return district ? district.name : districtId;
            });
            
            console.log('District filtering - User allowed districts (IDs):', req.userAllowedDistricts);
            console.log('District filtering - Mapped to names:', allowedDistrictNames);
            
            // Include both IDs and names in the filter
            const combinedAllowedDistricts = [...req.userAllowedDistricts, ...allowedDistrictNames];
            console.log('District filtering - Combined list:', combinedAllowedDistricts);
            
            filteredEmployees = employeeList.filter(emp => {
                if (!emp.district || emp.district === '') return false; // No district = not accessible to restricted users
                const isAllowed = combinedAllowedDistricts.includes(emp.district);
                console.log(`Employee ${emp.name} - District: ${emp.district} - Allowed: ${isAllowed}`);
                return isAllowed;
            });
            
            console.log(`District filtering - Original count: ${employeeList.length}, Filtered count: ${filteredEmployees.length}`);
        }
        
        // Return both employees and departments
        console.log(`Returning ${filteredEmployees.length} employees to user`);
        res.json({
            success: true,
            employees: filteredEmployees,
            departments: departments
        });
    } catch (error) {
        console.error('Error reading employees:', error);
        // Fallback to in-memory data
        let employeeList = Array.from(employees.values());
        // Filter by district access if needed
        if (!req.userCanAccessAllDistricts && req.userAllowedDistricts) {
            employeeList = employeeList.filter(emp => 
                !emp.district || req.userAllowedDistricts.includes(emp.district)
            );
        }
        
        // Try to load departments separately
        let departments = [];
        try {
            const departmentsData = await fs.readFile(DEPARTMENTS_FILE, 'utf8');
            departments = JSON.parse(departmentsData);
        } catch (deptError) {
            console.error('Error loading departments:', deptError);
        }
        
        res.json({
            success: true,
            employees: employeeList,
            departments: departments
        });
    }
});

// Get employee count
router.get('/count', checkDistrictAccess(), async (req, res) => {
    try {
        // Always read fresh data from file
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const employeeList = JSON.parse(data);
        
        // Load districts data to map IDs to names
        const districtsData = await fs.readFile(path.join(__dirname, '../data/districts.json'), 'utf8');
        const districts = JSON.parse(districtsData);
        
        // Filter by district access if needed
        let filteredEmployees = employeeList;
        if (!req.userCanAccessAllDistricts && req.userAllowedDistricts) {
            // Convert allowed district IDs to names
            const allowedDistrictNames = req.userAllowedDistricts.map(districtId => {
                const district = districts.find(d => d.id === districtId);
                return district ? district.name : districtId;
            });
            
            // Include both IDs and names in the filter
            const combinedAllowedDistricts = [...req.userAllowedDistricts, ...allowedDistrictNames];
            
            filteredEmployees = employeeList.filter(emp => {
                if (!emp.district || emp.district === '') return false; // No district = not accessible to restricted users
                return combinedAllowedDistricts.includes(emp.district);
            });
        }
        res.json({ count: filteredEmployees.length });
    } catch (error) {
        console.error('Error counting employees:', error);
        res.json({ count: 0 });
    }
});

// Get employee by ID
router.get('/:id', (req, res) => {
    const employee = employees.get(req.params.id);
    
    if (!employee) {
        return res.status(404).json({
            success: false,
            message: 'Xodim topilmadi'
        });
    }
    
    res.json(employee);
});

// Helper function to get or create department
async function getOrCreateDepartment(departmentName) {
    try {
        // Load departments using safe file operations
        const departments = await safeFileOps.readJSON(DEPARTMENTS_FILE, []);
        
        // Check if department exists by name
        let dept = departments.find(d => d.name === departmentName);
        if (dept) {
            return dept.id;
        }
        
        // Check if it's already an ID
        dept = departments.find(d => d.id === departmentName);
        if (dept) {
            return dept.id;
        }
        
        // Create new department if it doesn't exist
        const newDeptId = Date.now().toString();
        const newDept = {
            id: newDeptId,
            name: departmentName,
            description: departmentName,
            head: null
        };
        
        departments.push(newDept);
        
        // Save updated departments using safe file operations
        await safeFileOps.writeJSON(DEPARTMENTS_FILE, departments);
        console.log(`Created new department: ${departmentName} with ID: ${newDeptId}`);
        
        return newDeptId;
    } catch (error) {
        console.error('Error handling department:', error);
        // Return the original value if there's an error
        return departmentName;
    }
}

// Create new employee
router.post('/', async (req, res) => {
    const { name, position, department, phoneNumber, servicePhone, district, rank } = req.body;
    
    if (!name || !phoneNumber) {
        return res.status(400).json({
            success: false,
            message: 'Ism va telefon raqami majburiy'
        });
    }
    
    // Load districts to get ID/name mapping (ALWAYS, not just for permission check)
    const districtsData = await safeFileOps.readJSON(path.join(__dirname, '../data/districts.json'), []);
    
    // District can be either ID or name - find the district object
    let districtName = '';
    if (district) {
        const districtObj = districtsData.find(d => d.id === district || d.name === district);
        const districtId = districtObj ? districtObj.id : district;
        districtName = districtObj ? districtObj.name : district;
    
        // Check if user has permission to add employee to the specified district
        if (req.session.user.allowedDistricts && 
            req.session.user.allowedDistricts.length > 0 && 
            !req.session.user.allowedDistricts.includes('all')) {
        
        // Debug log
        console.log('=== DISTRICT PERMISSION CHECK ===');
        console.log('User:', req.session.user.username);
        console.log('User allowed districts:', req.session.user.allowedDistricts);
        console.log('Submitted district:', district);
        console.log('Found district ID:', districtId);
        console.log('Found district name:', districtName);
        console.log('District object:', districtObj);
        
        // User has district restrictions - check if they can add to this district (by ID)
        if (!req.session.user.allowedDistricts.includes(districtId)) {
            
            // Get allowed district names for error message
            const allowedDistrictNames = req.session.user.allowedDistricts
                .map(id => {
                    const dist = districtsData.find(d => d.id === id);
                    return dist ? dist.name : id;
                })
                .filter(name => name !== 'all');
                
            return res.status(403).json({
                success: false,
                message: `Siz faqat quyidagi tumanlarga xodim qo'shishingiz mumkin: ${allowedDistrictNames.join(', ')}`
            });
        }
        }
    }
    
    // Format and validate phone number (store without 0 prefix)
    const formattedPhone = PhoneFormatter.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
        return res.status(400).json({
            success: false,
            message: 'Telefon raqam formati noto\'g\'ri. Namuna: 991234567 yoki 0991234567'
        });
    }
    
    // Get or create department ID
    const departmentId = await getOrCreateDepartment(department);
    
    const id = Date.now().toString();
    const employee = {
        id,
        name,
        position,
        department: departmentId, // Use department ID instead of name
        phoneNumber: formattedPhone,
        servicePhone: servicePhone || '',
        district: districtName || '',
        rank: rank || '',
        groups: [],
        createdAt: new Date()
    };
    
    employees.set(id, employee);
    
    // Save to file
    try {
        await saveEmployees();
    } catch (error) {
        console.error('Failed to save employee data:', error);
    }
    
    res.json({
        success: true,
        employee
    });
});

// Update employee
router.put('/:id', async (req, res) => {
    const employee = employees.get(req.params.id);
    
    if (!employee) {
        return res.status(404).json({
            success: false,
            message: 'Xodim topilmadi'
        });
    }
    
    const { name, position, department, phoneNumber, servicePhone, district, rank } = req.body;
    
    // Load districts to get ID/name mapping (ALWAYS)
    const districtsData = await safeFileOps.readJSON(path.join(__dirname, '../data/districts.json'), []);
    
    // District can be either ID or name - find the district object
    let districtName = district;
    if (district) {
        const districtObj = districtsData.find(d => d.id === district || d.name === district);
        const districtId = districtObj ? districtObj.id : district;
        districtName = districtObj ? districtObj.name : district;
    
        // Check if user has permission to update employee to the specified district
        if (req.session.user.allowedDistricts && 
            req.session.user.allowedDistricts.length > 0 && 
            !req.session.user.allowedDistricts.includes('all')) {
        
            // User has district restrictions - check if they can update to this district (by ID)
            if (!req.session.user.allowedDistricts.includes(districtId)) {
                
                // Get allowed district names for error message
                const allowedDistrictNames = req.session.user.allowedDistricts
                    .map(id => {
                        const dist = districtsData.find(d => d.id === id);
                        return dist ? dist.name : id;
                    })
                    .filter(name => name !== 'all');
                    
                return res.status(403).json({
                    success: false,
                    message: `Siz faqat quyidagi tumanlarga xodim o'zgartirishingiz mumkin: ${allowedDistrictNames.join(', ')}`
                });
            }
        }
    }
    
    if (name) employee.name = name;
    if (position) employee.position = position;
    if (department) {
        // Get or create department ID
        employee.department = await getOrCreateDepartment(department);
    }
    if (phoneNumber) {
        // Format and validate phone number (store without 0 prefix)
        const formattedPhone = PhoneFormatter.formatPhoneNumber(phoneNumber);
        if (!formattedPhone) {
            return res.status(400).json({
                success: false,
                message: 'Telefon raqam formati noto\'g\'ri. Namuna: 991234567 yoki 0991234567'
            });
        }
        employee.phoneNumber = formattedPhone;
    }
    if (servicePhone !== undefined) employee.servicePhone = servicePhone;
    if (district !== undefined) employee.district = districtName || district;
    if (rank !== undefined) employee.rank = rank;
    
    employees.set(req.params.id, employee);
    
    // Save to file
    try {
        await saveEmployees();
    } catch (error) {
        console.error('Failed to save employee data:', error);
    }
    
    res.json({
        success: true,
        employee
    });
});

// Delete employee
router.delete('/:id', async (req, res) => {
    if (!employees.has(req.params.id)) {
        return res.status(404).json({
            success: false,
            message: 'Xodim topilmadi'
        });
    }
    
    employees.delete(req.params.id);
    
    // Save to file
    try {
        await saveEmployees();
    } catch (error) {
        console.error('Failed to save employee data:', error);
    }
    
    res.json({
        success: true,
        message: 'Xodim o\'chirildi'
    });
});

// Search employees
router.get('/search/:query', (req, res) => {
    const query = req.params.query.toLowerCase();
    const results = Array.from(employees.values()).filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        (emp.department && emp.department.toLowerCase().includes(query)) ||
        emp.phoneNumber.includes(query) ||
        (emp.rank && emp.rank.toLowerCase().includes(query))
    );
    
    res.json(results);
});

// Get employees by department
router.get('/department/:department', (req, res) => {
    const results = Array.from(employees.values()).filter(emp => 
        emp.department === req.params.department
    );
    
    res.json(results);
});

// Import employees from JSON/Excel
router.post('/import', async (req, res) => {
    try {
        const employeesList = req.body.employees;
        const createDepartments = req.body.createDepartments || false;
        
        if (!Array.isArray(employeesList)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri ma\'lumot formati. employees array bo\'lishi kerak.'
            });
        }
        
        const user = req.session.user;
        let imported = 0;
        let failed = 0;
        let errors = [];
        let newDepartments = new Set();
        let newDistricts = new Set();
        
        // Load existing districts
        const districtsData = await safeFileOps.readJSON(path.join(__dirname, '../data/districts.json'), []);
        const existingDistrictNames = new Set(districtsData.map(d => d.name));
        
        // Load existing departments (if you have a departments file)
        const departmentsFile = path.join(__dirname, '../data/departments.json');
        let departmentsData = [];
        try {
            departmentsData = await safeFileOps.readJSON(departmentsFile, []);
        } catch (e) {
            // Departments file might not exist yet
        }
        const existingDepartments = new Set(departmentsData.map(d => d.name));
        
        // Load employees once before processing
        console.log(`[IMPORT DEBUG] Employees Map size BEFORE load: ${employees.size}`);
        await loadEmployees();
        console.log(`[IMPORT DEBUG] Employees Map size AFTER load: ${employees.size}`);
        console.log(`[IMPORT DEBUG] Processing ${employeesList.length} employees from request`);
        
        // Create map of existing phone numbers for duplicate check
        const existingPhones = new Map();
        for (const [id, employee] of employees) {
            if (employee.phoneNumber && !employee.deleted) {
                existingPhones.set(employee.phoneNumber, employee);
            }
        }
        console.log(`[IMPORT DEBUG] Found ${existingPhones.size} existing phone numbers`);
        
        for (const emp of employeesList) {
            try {
                // Validate required fields
                if (!emp.name || !emp.phoneNumber) {
                    errors.push(`Xodim: ${emp.name || 'Nomsiz'} - ism va telefon majburiy`);
                    failed++;
                    continue;
                }
                
                // Clean and validate district name
                let districtName = emp.district ? emp.district.trim() : '';
                
                // Check if district exists, if not and createDepartments is true, add to new districts
                if (districtName && !existingDistrictNames.has(districtName)) {
                    if (createDepartments) {
                        newDistricts.add(districtName);
                    } else {
                        // Try to find similar district name
                        const similarDistrict = Array.from(existingDistrictNames).find(d => 
                            d.toLowerCase().includes(districtName.toLowerCase()) ||
                            districtName.toLowerCase().includes(d.toLowerCase())
                        );
                        if (similarDistrict) {
                            districtName = similarDistrict;
                        }
                    }
                }
                
                // Check district permission
                if (districtName && user.role !== 'admin' && !user.allowedDistricts?.includes('all')) {
                    const districtObj = districtsData.find(d => d.name === districtName);
                    const districtId = districtObj ? districtObj.id : districtName;
                    
                    if (!user.allowedDistricts?.includes(districtId)) {
                        errors.push(`${emp.name} - ${districtName} tumaniga ruxsat yo'q`);
                        failed++;
                        continue;
                    }
                }
                
                // Check and collect new departments
                if (emp.department && !existingDepartments.has(emp.department) && createDepartments) {
                    newDepartments.add(emp.department);
                }
                
                // Format phone number
                const phoneFormatter = require('../lib/phone-formatter');
                const formattedPhone = phoneFormatter.format(emp.phoneNumber);
                if (!formattedPhone) {
                    errors.push(`${emp.name} - telefon raqam formati noto'g'ri`);
                    failed++;
                    continue;
                }
                
                // Check for duplicate by phone number
                if (existingPhones.has(formattedPhone)) {
                    const existing = existingPhones.get(formattedPhone);
                    console.log(`[IMPORT DEBUG] Skipping duplicate: ${emp.name} - phone ${formattedPhone} already exists for ${existing.name}`);
                    errors.push(`${emp.name} - telefon raqam ${formattedPhone} allaqachon ${existing.name} uchun mavjud`);
                    failed++;
                    continue;
                }
                
                // Create employee object
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
                
                // Add to Map (don't reload, just add)
                employees.set(employeeData.id, employeeData);
                imported++;
                
            } catch (error) {
                errors.push(`${emp.name || 'Nomsiz'} - ${error.message}`);
                failed++;
            }
        }
        
        console.log(`[IMPORT DEBUG] After processing: Map size: ${employees.size}, imported: ${imported}, failed: ${failed}`);
        
        // Create new districts if needed
        if (createDepartments && newDistricts.size > 0) {
            for (const districtName of newDistricts) {
                const newDistrict = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: districtName,
                    type: districtName.toLowerCase().includes('shahar') ? 'shahar' : 'tuman'
                };
                districtsData.push(newDistrict);
                existingDistrictNames.add(districtName);
            }
            // Save updated districts
            await safeFileOps.writeJSON(path.join(__dirname, '../data/districts.json'), districtsData);
        }
        
        // Create new departments if needed
        if (createDepartments && newDepartments.size > 0) {
            for (const deptName of newDepartments) {
                departmentsData.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: deptName,
                    createdAt: new Date().toISOString()
                });
            }
            // Save updated departments
            await safeFileOps.writeJSON(departmentsFile, departmentsData);
        }
        
        // Save employees to file
        console.log(`[IMPORT DEBUG] About to save employees. Map size: ${employees.size}`);
        console.log(`[IMPORT DEBUG] Employees data file: ${DATA_FILE}`);
        
        try {
            await saveEmployees();
            console.log(`[IMPORT DEBUG] saveEmployees() completed successfully`);
            
            // Verify the file was actually written
            const fs = require('fs');
            const stats = fs.statSync(DATA_FILE);
            console.log(`[IMPORT DEBUG] File stats after save:`, {
                size: stats.size,
                mtime: stats.mtime,
                path: DATA_FILE
            });
            
            // Double-check by reading the file
            const savedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            console.log(`[IMPORT DEBUG] Verified saved data: ${savedData.length} employees in file`);
        } catch (saveError) {
            console.error(`[IMPORT DEBUG] Error during save:`, saveError);
            throw saveError;
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
            errors: errors.slice(0, 10) // Show first 10 errors only
        });
        
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({
            success: false,
            message: 'Import xatosi: ' + error.message
        });
    }
});

// Export employees as Excel/JSON
router.get('/export', async (req, res) => {
    try {
        await loadEmployees();
        const employeesList = Array.from(employees.values());
        
        // Check user permissions for district filtering
        const user = req.session.user;
        let filteredEmployees = employeesList;
        
        if (user.role !== 'admin' && user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            const districtsData = await safeFileOps.readJSON(path.join(__dirname, '../data/districts.json'), []);
            const districtIdToName = {};
            districtsData.forEach(d => {
                districtIdToName[d.id] = d.name;
            });
            
            const allowedDistrictNames = user.allowedDistricts.map(id => 
                districtIdToName[id] || id
            );
            
            filteredEmployees = employeesList.filter(emp => 
                allowedDistrictNames.includes(emp.district)
            );
        }
        
        // Format for export (remove system fields)
        const exportData = filteredEmployees.map(emp => ({
            name: emp.name,
            position: emp.position,
            rank: emp.rank,
            department: emp.department,
            phoneNumber: emp.phoneNumber,
            servicePhone: emp.servicePhone,
            district: emp.district
        }));
        
        res.json({
            success: true,
            employees: exportData,
            total: exportData.length
        });
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Export xatosi: ' + error.message
        });
    }
});

// Debug endpoint to check raw data
router.get('/debug/all', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const employeeList = JSON.parse(data);
        res.json({
            total: employeeList.length,
            qarshiEmployees: employeeList.filter(e => e.district === 'Qarshi shahri'),
            user: req.session?.user?.username,
            allowedDistricts: req.session?.user?.allowedDistricts
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});


// Import Excel file endpoint
const multer = require('multer');
const { parseExcelFile } = require('../lib/excel-parser');

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

// Import from Excel file
router.post('/import-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Fayl yuklanmadi'
            });
        }
        
        const user = req.session.user;
        let employeesList = [];
        
        // Parse based on file type
        if (req.file.originalname.match(/\.xlsx?$/i)) {
            // Parse Excel file
            employeesList = await parseExcelFile(req.file.buffer);
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
                        employeesList.push({
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
        
        if (employeesList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Faylda ma\'lumot topilmadi'
            });
        }
        
        // Load districts
        const districtsData = await safeFileOps.readJSON(path.join(__dirname, '../data/districts.json'), []);
        const existingDistrictNames = new Set(districtsData.map(d => d.name));
        
        // Process employees
        let imported = 0;
        let failed = 0;
        let errors = [];
        let newDistricts = new Set();
        let newDepartments = new Set();
        
        // Load employees once before processing
        await loadEmployees();
        
        // Create map of existing phone numbers for duplicate check
        const existingPhones = new Map();
        for (const [id, employee] of employees) {
            if (employee.phoneNumber && !employee.deleted) {
                existingPhones.set(employee.phoneNumber, employee);
            }
        }
        
        for (const emp of employeesList) {
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
                
                // Check for duplicate by phone number
                if (existingPhones.has(formattedPhone)) {
                    const existing = existingPhones.get(formattedPhone);
                    errors.push(`${emp.name} - telefon raqam ${formattedPhone} allaqachon ${existing.name} uchun mavjud`);
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
                
                // Add to map (don't reload, just add)
                employees.set(employeeData.id, employeeData);
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
        
        // Save employees
        await saveEmployees();
        
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

// Export both router and employees Map
module.exports = router;
module.exports.employees = employees; // Export employees Map directly
router.employees = employees; // Also attach to router for backward compatibility
module.exports.loadEmployees = loadEmployees;
module.exports.saveEmployees = saveEmployees;