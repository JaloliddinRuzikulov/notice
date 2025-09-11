const fs = require('fs');

// Read and parse employees data
const employees = JSON.parse(fs.readFileSync('/home/user/data/employees.json', 'utf8'));

console.log('=== PHONE NUMBER STATISTICS ===\n');
console.log(`Total employees: ${employees.length}`);

// Count employees with/without phones
let withPersonalPhone = 0;
let withServicePhone = 0;
let withBothPhones = 0;
let withoutAnyPhone = 0;
let emptyPhones = [];

employees.forEach(emp => {
    const hasPersonal = emp.phoneNumber && emp.phoneNumber.trim();
    const hasService = emp.servicePhone && emp.servicePhone.trim();
    
    if (hasPersonal && hasService) {
        withBothPhones++;
        withPersonalPhone++;
        withServicePhone++;
    } else if (hasPersonal) {
        withPersonalPhone++;
    } else if (hasService) {
        withServicePhone++;
    } else {
        withoutAnyPhone++;
        emptyPhones.push({
            name: emp.name,
            district: emp.district,
            department: emp.department,
            position: emp.position
        });
    }
});

console.log(`\nEmployees with personal phone: ${withPersonalPhone}`);
console.log(`Employees with service phone: ${withServicePhone}`);
console.log(`Employees with both phones: ${withBothPhones}`);
console.log(`Employees without any phone: ${withoutAnyPhone}`);

// Show employees without phones
if (emptyPhones.length > 0) {
    console.log('\n=== EMPLOYEES WITHOUT PHONE NUMBERS ===\n');
    emptyPhones.slice(0, 10).forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name}`);
        console.log(`   District: ${emp.district || 'N/A'}`);
        console.log(`   Position: ${emp.position || 'N/A'}`);
        console.log();
    });
    
    if (emptyPhones.length > 10) {
        console.log(`... and ${emptyPhones.length - 10} more employees without phones`);
    }
}

// Check for specific phone number patterns
console.log('\n=== PHONE NUMBER PATTERNS ===\n');

const phonePatterns = new Map();
employees.forEach(emp => {
    const phones = [];
    if (emp.phoneNumber && emp.phoneNumber.trim()) phones.push(emp.phoneNumber.trim());
    if (emp.servicePhone && emp.servicePhone.trim()) phones.push(emp.servicePhone.trim());
    
    phones.forEach(phone => {
        // Check length
        const length = phone.length;
        phonePatterns.set(`Length ${length}`, (phonePatterns.get(`Length ${length}`) || 0) + 1);
        
        // Check starting digits
        if (phone.length >= 3) {
            const prefix = phone.substring(0, 3);
            phonePatterns.set(`Prefix ${prefix}`, (phonePatterns.get(`Prefix ${prefix}`) || 0) + 1);
        }
    });
});

// Show patterns
console.log('Phone number lengths:');
Array.from(phonePatterns.entries())
    .filter(([key]) => key.startsWith('Length'))
    .sort((a, b) => b[1] - a[1])
    .forEach(([pattern, count]) => {
        console.log(`  ${pattern}: ${count} numbers`);
    });

console.log('\nMost common prefixes (first 3 digits):');
Array.from(phonePatterns.entries())
    .filter(([key]) => key.startsWith('Prefix'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([pattern, count]) => {
        console.log(`  ${pattern}: ${count} numbers`);
    });

// Check for the specific number 912204020
console.log('\n=== SPECIFIC NUMBER: 912204020 ===\n');
const specificNumber = '912204020';
const employeesWithSpecificNumber = employees.filter(emp => 
    emp.phoneNumber === specificNumber || emp.servicePhone === specificNumber
);

console.log(`Found ${employeesWithSpecificNumber.length} employees with number ${specificNumber}:`);
employeesWithSpecificNumber.forEach((emp, index) => {
    console.log(`\n${index + 1}. ${emp.name}`);
    console.log(`   ID: ${emp.id}`);
    console.log(`   District: ${emp.district || 'N/A'}`);
    console.log(`   Department: ${emp.department || 'N/A'}`);
    console.log(`   Position: ${emp.position || 'N/A'}`);
    console.log(`   Rank: ${emp.rank || 'N/A'}`);
    console.log(`   Phone Type: ${emp.phoneNumber === specificNumber ? 'Personal' : 'Service'}`);
    console.log(`   Created: ${emp.createdAt || 'N/A'}`);
    console.log(`   Updated: ${emp.updatedAt || 'N/A'}`);
});