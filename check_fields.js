const fs = require('fs');
const { DataSource } = require('typeorm');
const path = require('path');

const Employee = require('./lib/entities/Employee');
const Department = require('./lib/entities/Department');
const District = require('./lib/entities/District');
const Group = require('./lib/entities/Group');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(__dirname, 'data/xabarnoma.db'),
    synchronize: false,
    entities: [Employee, Department, District, Group]
});

async function checkFields() {
    await AppDataSource.initialize();
    
    console.log('FIELD SOLISHTIRISH HISOBOTI\n');
    console.log('='.repeat(70));
    
    // Load backup data
    const backupEmployees = JSON.parse(fs.readFileSync('data/backups/employees.json.2025-10-02T21-15-08-045Z.backup', 'utf8'));
    const backupDepartments = JSON.parse(fs.readFileSync('data/departments.json', 'utf8'));
    const backupDistricts = JSON.parse(fs.readFileSync('data/districts.json', 'utf8'));
    const backupGroups = JSON.parse(fs.readFileSync('data/groups.json', 'utf8'));
    
    // Get from DB
    const employeeRepo = AppDataSource.getRepository(Employee);
    const departmentRepo = AppDataSource.getRepository(Department);
    const districtRepo = AppDataSource.getRepository(District);
    const groupRepo = AppDataSource.getRepository(Group);
    
    const dbEmployees = await employeeRepo.find({ where: { deleted: false } });
    const dbDepartments = await departmentRepo.find();
    const dbDistricts = await districtRepo.find();
    const dbGroups = await groupRepo.find();
    
    // Check Employee Fields
    console.log('\n1. EMPLOYEES FIELD TEKSHIRUVI');
    console.log('-'.repeat(70));
    
    const sampleEmployees = dbEmployees.slice(0, 5);
    
    for (const dbEmp of sampleEmployees) {
        const backupEmp = backupEmployees.find(e => 
            e.name === dbEmp.name && 
            (e.phoneNumber === dbEmp.phone_number || e.phone_number === dbEmp.phone_number)
        );
        
        if (backupEmp) {
            console.log('\nEmployee:', dbEmp.name);
            console.log('  ID:', dbEmp.id === backupEmp.id ? 'OK' : 'FARQ');
            console.log('  Name:', dbEmp.name === backupEmp.name ? 'OK' : 'FARQ');
            
            const backupPhone = backupEmp.phoneNumber || backupEmp.phone_number;
            console.log('  Phone:', dbEmp.phone_number === backupPhone ? 'OK' : 'FARQ', 
                        '(' + dbEmp.phone_number + ' vs ' + backupPhone + ')');
            
            const backupServicePhone = backupEmp.servicePhone || backupEmp.service_phone || '';
            console.log('  Service Phone:', dbEmp.service_phone === backupServicePhone ? 'OK' : 'FARQ');
            
            console.log('  Position:', dbEmp.position === (backupEmp.position || '') ? 'OK' : 'FARQ');
            console.log('  Rank:', dbEmp.rank === (backupEmp.rank || '') ? 'OK' : 'FARQ');
            console.log('  Department:', dbEmp.department === (backupEmp.department || '') ? 'OK' : 'FARQ');
            console.log('  District:', dbEmp.district === (backupEmp.district || '') ? 'OK' : 'FARQ');
        }
    }
    
    // Check Department Fields
    console.log('\n\n2. DEPARTMENTS FIELD TEKSHIRUVI');
    console.log('-'.repeat(70));
    
    const sampleDepts = dbDepartments.slice(0, 3);
    
    for (const dbDept of sampleDepts) {
        const backupDept = backupDepartments.find(d => d.id === dbDept.id);
        
        if (backupDept) {
            console.log('\nDepartment:', dbDept.name);
            console.log('  ID:', dbDept.id === backupDept.id ? 'OK' : 'FARQ');
            console.log('  Name:', dbDept.name === backupDept.name ? 'OK' : 'FARQ');
            console.log('  Description:', dbDept.description === (backupDept.description || '') ? 'OK' : 'FARQ');
        }
    }
    
    // Check District Fields
    console.log('\n\n3. DISTRICTS FIELD TEKSHIRUVI');
    console.log('-'.repeat(70));
    
    const sampleDistricts = dbDistricts.slice(0, 3);
    
    for (const dbDist of sampleDistricts) {
        const backupDist = backupDistricts.find(d => d.id === dbDist.id);
        
        if (backupDist) {
            console.log('\nDistrict:', dbDist.name);
            console.log('  ID:', dbDist.id === backupDist.id ? 'OK' : 'FARQ');
            console.log('  Name:', dbDist.name === backupDist.name ? 'OK' : 'FARQ');
        }
    }
    
    // Check Group Fields
    console.log('\n\n4. GROUPS FIELD TEKSHIRUVI');
    console.log('-'.repeat(70));
    
    for (const dbGroup of dbGroups) {
        const backupGroup = backupGroups.find(g => g.id === dbGroup.id);
        
        if (backupGroup) {
            console.log('\nGroup:', dbGroup.name);
            console.log('  ID:', dbGroup.id === backupGroup.id ? 'OK' : 'FARQ');
            console.log('  Name:', dbGroup.name === backupGroup.name ? 'OK' : 'FARQ');
            console.log('  Description:', dbGroup.description === (backupGroup.description || '') ? 'OK' : 'FARQ');
            console.log('  District:', dbGroup.district === (backupGroup.district || '') ? 'OK' : 'FARQ');
            
            const dbMembers = JSON.stringify(dbGroup.members || []);
            const backupMembers = JSON.stringify(backupGroup.members || []);
            console.log('  Members:', dbMembers === backupMembers ? 'OK' : 'FARQ');
        }
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('XULOSA:\n');
    
    let employeeFieldIssues = 0;
    let deptFieldIssues = 0;
    let districtFieldIssues = 0;
    let groupFieldIssues = 0;
    
    // Check all employees
    for (const dbEmp of dbEmployees) {
        const backupEmp = backupEmployees.find(e => 
            e.name === dbEmp.name && 
            (e.phoneNumber === dbEmp.phone_number || e.phone_number === dbEmp.phone_number)
        );
        
        if (backupEmp) {
            const backupPhone = backupEmp.phoneNumber || backupEmp.phone_number;
            if (dbEmp.phone_number !== backupPhone) employeeFieldIssues++;
            if (dbEmp.department !== (backupEmp.department || '')) employeeFieldIssues++;
            if (dbEmp.district !== (backupEmp.district || '')) employeeFieldIssues++;
        }
    }
    
    console.log('Employees field issues:', employeeFieldIssues);
    console.log('Departments field issues:', deptFieldIssues);
    console.log('Districts field issues:', districtFieldIssues);
    console.log('Groups field issues:', groupFieldIssues);
    
    if (employeeFieldIssues === 0 && deptFieldIssues === 0 && districtFieldIssues === 0 && groupFieldIssues === 0) {
        console.log('\nOK - Barcha fieldlar to\'liq mos!');
    } else {
        console.log('\nOGOHLANTIRISH - Ba\'zi fieldlar mos emas!');
    }
    
    await AppDataSource.destroy();
}

checkFields().catch(console.error);
