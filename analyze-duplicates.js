const fs = require('fs');

// Read and parse employees data
const employees = JSON.parse(fs.readFileSync('/home/user/data/employees.json', 'utf8'));

// Create a map to store phone number occurrences
const phoneMap = new Map();

// Process each employee
employees.forEach(employee => {
    // Check both phoneNumber and servicePhone fields
    const phones = [];
    if (employee.phoneNumber && employee.phoneNumber.trim()) {
        phones.push(employee.phoneNumber.trim());
    }
    if (employee.servicePhone && employee.servicePhone.trim()) {
        phones.push(employee.servicePhone.trim());
    }
    
    phones.forEach(phone => {
        if (!phoneMap.has(phone)) {
            phoneMap.set(phone, []);
        }
        phoneMap.get(phone).push({
            name: employee.name,
            district: employee.district,
            department: employee.department,
            position: employee.position,
            rank: employee.rank,
            phoneType: phone === employee.phoneNumber ? 'personal' : 'service'
        });
    });
});

// Find duplicates (phone numbers with more than one employee)
const duplicates = [];
for (const [phone, employees] of phoneMap) {
    if (employees.length > 1) {
        duplicates.push({
            phone: phone,
            count: employees.length,
            employees: employees
        });
    }
}

// Sort by count (descending) and then by phone number
duplicates.sort((a, b) => {
    if (b.count !== a.count) {
        return b.count - a.count;
    }
    return a.phone.localeCompare(b.phone);
});

// Display results
console.log('=== DUPLICATE PHONE NUMBERS ANALYSIS ===\n');
console.log(`Total unique phone numbers: ${phoneMap.size}`);
console.log(`Phone numbers with duplicates: ${duplicates.length}`);
console.log(`Total duplicate entries: ${duplicates.reduce((sum, d) => sum + d.count - 1, 0)}\n`);

// Show top duplicates
console.log('=== MOST COMMON DUPLICATE PHONE NUMBERS ===\n');

// Focus on specific numbers mentioned by user
const targetNumbers = ['912204020'];
targetNumbers.forEach(targetPhone => {
    const duplicate = duplicates.find(d => d.phone === targetPhone);
    if (duplicate) {
        console.log(`\n📱 Phone: ${duplicate.phone} (appears ${duplicate.count} times)`);
        console.log('─'.repeat(60));
        duplicate.employees.forEach((emp, index) => {
            console.log(`${index + 1}. ${emp.name} (${emp.phoneType} phone)`);
            console.log(`   District: ${emp.district || 'N/A'}`);
            console.log(`   Department: ${emp.department || 'N/A'}`);
            console.log(`   Position: ${emp.position || 'N/A'}`);
            console.log(`   Rank: ${emp.rank || 'N/A'}`);
            console.log();
        });
    }
});

// Show top 20 most common duplicates
console.log('\n=== TOP 20 MOST DUPLICATED PHONE NUMBERS ===\n');
duplicates.slice(0, 20).forEach((duplicate, index) => {
    console.log(`\n${index + 1}. Phone: ${duplicate.phone} (${duplicate.count} occurrences)`);
    console.log('─'.repeat(60));
    duplicate.employees.forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} - ${emp.district || 'N/A'} - ${emp.department || 'N/A'}`);
    });
});

// Summary statistics
console.log('\n=== DUPLICATE FREQUENCY DISTRIBUTION ===\n');
const frequencyMap = new Map();
duplicates.forEach(d => {
    const count = d.count;
    frequencyMap.set(count, (frequencyMap.get(count) || 0) + 1);
});

// Sort by occurrence count
const frequencies = Array.from(frequencyMap.entries()).sort((a, b) => a[0] - b[0]);
frequencies.forEach(([count, phoneNumbers]) => {
    console.log(`${phoneNumbers} phone number(s) appear ${count} times`);
});

// Export detailed results to a file
const detailedResults = {
    summary: {
        totalUniquePhones: phoneMap.size,
        phonesWithDuplicates: duplicates.length,
        totalDuplicateEntries: duplicates.reduce((sum, d) => sum + d.count - 1, 0)
    },
    duplicates: duplicates
};

fs.writeFileSync('/home/user/duplicate-phones-analysis.json', JSON.stringify(detailedResults, null, 2));
console.log('\n✅ Detailed results saved to: /home/user/duplicate-phones-analysis.json');