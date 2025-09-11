// Debug script to check route registration
const express = require('express');
const app = express();

// Simulate the auth middleware
const auth = (req, res, next) => {
    console.log(`[AUTH] ${req.method} ${req.path}`);
    next();
};

// Simulate requirePermission middleware
const requirePermission = (perm) => (req, res, next) => {
    console.log(`[PERMISSION] ${perm} for ${req.path}`);
    next();
};

// Register routes in the same order as server.js
app.use('/api/employees', auth, requirePermission('employees'), (req, res) => {
    res.json({ from: 'employees router' });
});

// Special routes AFTER the main route
app.get('/api/employees-departments', auth, requirePermission('departments'), (req, res) => {
    res.json({ from: 'employees-departments special route' });
});

// Test both routes
const http = require('http');
const server = http.createServer(app);

server.listen(9999, () => {
    console.log('Test server running on port 9999');
    
    // Test requests
    const testRoute = (path) => {
        http.get(`http://localhost:9999${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`\n${path}: ${res.statusCode}`);
                console.log('Response:', data);
            });
        });
    };
    
    setTimeout(() => {
        testRoute('/api/employees');
        testRoute('/api/employees-departments');
        
        // Exit after tests
        setTimeout(() => process.exit(0), 1000);
    }, 100);
});