const fs = require('fs');
const { DataSource } = require('typeorm');
const path = require('path');
const Employee = require('./lib/entities/Employee');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(__dirname, 'data/xabarnoma.db'),
    synchronize: false,
    entities: [Employee]
});

async function findMissing() {
    await AppDataSource.initialize();
    
    const employeesBackup = JSON.parse(fs.readFileSync('data/backups/employees.json.2025-10-02T21-15-08-045Z.backup', 'utf8'));
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employeesDB = await employeeRepo.find({ where: { deleted: false } });
    
    console.log('BACKUP DA BOR, LEKIN DB DA YOQ:\n');
    
    let missing = [];
    for (const backupEmp of employeesBackup) {
        const found = employeesDB.find(dbEmp => 
            dbEmp.name === backupEmp.name && 
            (dbEmp.phone_number === backupEmp.phoneNumber || dbEmp.phone_number === backupEmp.phone_number)
        );
        
        if (!found) {
            missing.push(backupEmp);
        }
    }
    
    console.log('Jami:', missing.length, 'ta employee\n');
    
    if (missing.length > 0) {
        console.log('Ro\'yxat:');
        missing.forEach((emp, i) => {
            console.log(`${i+1}. ${emp.name} - ${emp.phoneNumber || emp.phone_number} - ${emp.district}`);
        });
    }
    
    await AppDataSource.destroy();
}

findMissing().catch(console.error);
