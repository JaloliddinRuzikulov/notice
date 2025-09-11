const fs = require('fs').promises;
const path = require('path');
const db = require('../lib/database');

async function migrateData() {
    console.log('Starting data migration to SQLite database...');
    
    try {
        // Initialize database
        await db.initialize();
        console.log('Database initialized');
        
        // Migrate districts
        console.log('\nMigrating districts...');
        const districtsData = await fs.readFile(path.join(__dirname, '../data/districts.json'), 'utf8');
        const districts = JSON.parse(districtsData);
        
        for (const district of districts) {
            try {
                await db.run('INSERT OR IGNORE INTO districts (name) VALUES (?)', [district.name]);
                console.log(`✓ District: ${district.name}`);
            } catch (err) {
                console.error(`✗ Failed to migrate district ${district.name}:`, err.message);
            }
        }
        
        // Migrate departments
        console.log('\nMigrating departments...');
        const departmentsData = await fs.readFile(path.join(__dirname, '../data/departments.json'), 'utf8');
        const departments = JSON.parse(departmentsData);
        
        for (const dept of departments) {
            try {
                await db.run(
                    'INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)',
                    [dept.name, dept.description || '']
                );
                console.log(`✓ Department: ${dept.name}`);
            } catch (err) {
                console.error(`✗ Failed to migrate department ${dept.name}:`, err.message);
            }
        }
        
        // Migrate employees
        console.log('\nMigrating employees...');
        const employeesData = await fs.readFile(path.join(__dirname, '../data/employees.json'), 'utf8');
        const employees = JSON.parse(employeesData);
        
        let migratedCount = 0;
        for (const emp of employees) {
            try {
                await db.run(
                    `INSERT INTO employees (name, position, rank, department, phone_number, service_phone, district, deleted)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        emp.name,
                        emp.position || '',
                        emp.rank || '',
                        emp.department || '',
                        emp.phoneNumber,
                        emp.servicePhone || '',
                        emp.district || '',
                        emp.deleted ? 1 : 0
                    ]
                );
                migratedCount++;
                console.log(`✓ Employee: ${emp.name}`);
            } catch (err) {
                console.error(`✗ Failed to migrate employee ${emp.name}:`, err.message);
            }
        }
        
        // Migrate users
        console.log('\nMigrating users...');
        const usersData = await fs.readFile(path.join(__dirname, '../data/users.json'), 'utf8');
        const users = JSON.parse(usersData);
        
        for (const user of users) {
            try {
                await db.run(
                    `INSERT OR IGNORE INTO users (username, password, name, role, permissions, active, allowed_districts)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user.username,
                        user.password,
                        user.name,
                        user.role,
                        JSON.stringify(user.permissions || {}),
                        user.active ? 1 : 0,
                        JSON.stringify(user.allowedDistricts || [])
                    ]
                );
                console.log(`✓ User: ${user.username}`);
            } catch (err) {
                console.error(`✗ Failed to migrate user ${user.username}:`, err.message);
            }
        }
        
        // Migrate groups
        console.log('\nMigrating groups...');
        const groupsData = await fs.readFile(path.join(__dirname, '../data/groups.json'), 'utf8');
        const groups = JSON.parse(groupsData);
        
        for (const group of groups) {
            try {
                await db.run(
                    `INSERT OR IGNORE INTO groups (id, name, description, members, district)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        group.id,
                        group.name,
                        group.description || '',
                        JSON.stringify(group.members || []),
                        group.district || ''
                    ]
                );
                console.log(`✓ Group: ${group.name}`);
            } catch (err) {
                console.error(`✗ Failed to migrate group ${group.name}:`, err.message);
            }
        }
        
        console.log('\n✅ Migration completed!');
        console.log(`Total employees migrated: ${migratedCount}`);
        
        // Test the data
        const employeeCount = await db.get('SELECT COUNT(*) as count FROM employees WHERE deleted = 0');
        console.log(`\nEmployees in database: ${employeeCount.count}`);
        
        await db.close();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateData();