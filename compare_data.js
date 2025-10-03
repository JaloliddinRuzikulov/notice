const fs = require('fs');
const { DataSource } = require('typeorm');
const path = require('path');

const Employee = require('./lib/entities/Employee');
const Department = require('./lib/entities/Department');
const District = require('./lib/entities/District');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(__dirname, 'data/xabarnoma.db'),
    synchronize: false,
    entities: [Employee, Department, District]
});

async function compare() {
    await AppDataSource.initialize();
    
    console.log('BACKUP VA DATABASE SOLISHTIRISH\n');
    console.log('='.repeat(60));
    
    // Load backups
    const employeesBackup = JSON.parse(fs.readFileSync('data/backups/employees.json.2025-10-02T21-15-08-045Z.backup', 'utf8'));
    const departmentsBackup = JSON.parse(fs.readFileSync('data/departments.json', 'utf8'));
    const districtsBackup = JSON.parse(fs.readFileSync('data/districts.json', 'utf8'));
    
    // Get from database
    const employeeRepo = AppDataSource.getRepository(Employee);
    const departmentRepo = AppDataSource.getRepository(Department);
    const districtRepo = AppDataSource.getRepository(District);
    
    const employeesDB = await employeeRepo.find({ where: { deleted: false } });
    const departmentsDB = await departmentRepo.find();
    const districtsDB = await districtRepo.find();
    
    // Compare counts
    console.log('\nSONLAR:');
    console.log('Employees:   Backup:', employeesBackup.length, ' DB:', employeesDB.length);
    console.log('Departments: Backup:', departmentsBackup.length, ' DB:', departmentsDB.length);
    console.log('Districts:   Backup:', districtsBackup.length, ' DB:', districtsDB.length);
    
    // Compare districts
    console.log('\nTUMANLAR:');
    const backupDistricts = new Set(districtsBackup.map(d => d.name).sort());
    const dbDistricts = new Set(districtsDB.map(d => d.name).sort());
    
    const missingInDB = [...backupDistricts].filter(d => !dbDistricts.has(d));
    const extraInDB = [...dbDistricts].filter(d => !backupDistricts.has(d));
    
    if (missingInDB.length === 0 && extraInDB.length === 0) {
        console.log('OK - Tumanlar bir xil');
    } else {
        if (missingInDB.length > 0) console.log('Missing:', missingInDB);
        if (extraInDB.length > 0) console.log('Extra:', extraInDB);
    }
    
    // Employee distribution by district
    console.log('\nXODIMLAR (TUMANLAR BOYICHA):');
    
    const backupByDistrict = {};
    employeesBackup.forEach(emp => {
        const d = emp.district || 'No district';
        backupByDistrict[d] = (backupByDistrict[d] || 0) + 1;
    });
    
    const dbByDistrict = {};
    employeesDB.forEach(emp => {
        const d = emp.district || 'No district';
        dbByDistrict[d] = (dbByDistrict[d] || 0) + 1;
    });
    
    const allDistricts = new Set([...Object.keys(backupByDistrict), ...Object.keys(dbByDistrict)]);
    
    for (const district of Array.from(allDistricts).sort().slice(0, 10)) {
        const b = backupByDistrict[district] || 0;
        const d = dbByDistrict[district] || 0;
        const m = b === d ? 'OK' : 'ERR';
        console.log(m, district, '- Backup:', b, 'DB:', d);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('XULOSA:');
    if (employeesDB.length === employeesBackup.length) {
        console.log('OK - Malumotlar bir xil');
    } else {
        console.log('FARQ:', Math.abs(employeesDB.length - employeesBackup.length), 'ta employee');
    }
    
    await AppDataSource.destroy();
}

compare().catch(console.error);
