#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function syncEmployees() {
    try {
        // Read employees from data directory
        const employeesPath = path.join(__dirname, '../data/employees.json');
        const employeesData = await fs.readFile(employeesPath, 'utf8');
        const employees = JSON.parse(employeesData);
        
        // Filter out deleted employees
        const activeEmployees = employees.filter(emp => !emp.deleted);
        
        // Write to public directory for broadcast access
        const publicPath = path.join(__dirname, '../public/employees-broadcast.json');
        await fs.writeFile(publicPath, JSON.stringify(activeEmployees, null, 2));
        
        console.log(`Synced ${activeEmployees.length} active employees to public/employees-broadcast.json`);
    } catch (error) {
        console.error('Error syncing employees:', error);
    }
}

// Run sync
syncEmployees();