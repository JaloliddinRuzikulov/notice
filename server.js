const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const WebSocket = require('ws');
require('dotenv').config();

// Initialize database
const database = require('./lib/database');
database.initialize().then(() => {
    console.log('Database initialized successfully');
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 8444;
// Basic middleware setup

// CORS configuration - dynamic based on PORT
const corsOrigins = [
    `https://172.27.64.10:${PORT}`,
    `https://localhost:${PORT}`, 
    `https://10.105.1.45:${PORT}`,
    'https://172.27.64.10:8444',
    'https://localhost:8444'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);
        
        if (corsOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn('CORS blocked origin:', origin);
            callback(null, true); // For development, allow all origins
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static middleware - allow HTML files for testing
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, // No cache in development
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (process.env.NODE_ENV !== 'production') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('etag', false); // Disable ETag for views
app.set('view cache', false); // Disable view caching in development

// Trust proxy - commented out for now
// app.set('trust proxy', 1);

// Generate or use existing session secret
const SESSION_SECRET = process.env.SESSION_SECRET || (() => {
    const secretPath = path.join(__dirname, 'config/session-secret.txt');
    if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf8').trim();
    } else {
        const newSecret = require('crypto').randomBytes(32).toString('hex');
        if (!fs.existsSync(path.join(__dirname, 'config'))) {
            fs.mkdirSync(path.join(__dirname, 'config'), { recursive: true });
        }
        fs.writeFileSync(secretPath, newSecret);
        return newSecret;
    }
})();

// Cookie parser - MUST be before session
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
        checkPeriod: 3600000 // prune expired entries every 1 hour
    }),
    cookie: { 
        secure: false, // Allow HTTP for development
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax', // Better compatibility
        path: '/' // Ensure cookie is available for all paths
    },
    name: 'xabarnoma.sid', // Custom session name
    rolling: true // Reset expiry on activity
}));

// Localization middleware
const localization = require('./lib/localization');
app.use(localization.middleware);

// Create self-signed certificate if not exists
const certPath = path.join(__dirname, 'config/cert.pem');
const keyPath = path.join(__dirname, 'config/key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('Generating self-signed certificate...');
    const { execSync } = require('child_process');
    
    // Create config directory if not exists
    if (!fs.existsSync(path.join(__dirname, 'config'))) {
        fs.mkdirSync(path.join(__dirname, 'config'));
    }
    
    // Generate certificate
    const { execFileSync } = require('child_process');
    execFileSync('openssl', [
        'req', '-x509', '-newkey', 'rsa:4096',
        '-keyout', keyPath,
        '-out', certPath,
        '-days', '365', '-nodes',
        '-subj', '/C=UZ/ST=Qashqadaryo/L=Qarshi/O=IIB/CN=localhost'
    ]);
}

// HTTPS options
const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
};

// Create HTTPS server
const server = https.createServer(httpsOptions, app);

// Socket.IO for real-time events
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: ['https://172.27.64.10:8444', 'https://localhost:8444', 'https://10.105.1.45:8444'],
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Make io global for SIP backend
global.io = io;

// Initialize DTMF handler
const DTMFHandler = require('./lib/dtmf-handler');
global.dtmfHandler = new DTMFHandler();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New Socket.IO connection:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Socket.IO disconnected:', socket.id);
    });
});

// WebSocket disabled

// WebSocket proxy temporarily disabled to fix CPU issue
// const WSToUDPProxy = require('./lib/ws-to-udp-proxy');
// const wsToUdpProxy = new WSToUDPProxy({
//     asteriskHost: process.env.SIP_SERVER || '10.105.0.3',
//     asteriskPort: 5060
// });
// wsToUdpProxy.initialize(wss);

// Import middleware
const { auth, requirePermission } = require('./middleware/auth');
const { requestLogger, notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Request logger disabled for performance
// app.use(requestLogger);

// Routes
app.get('/', auth, (req, res) => {
    res.render('index', { user: req.session.user });
});

// Test routes for HTML files
app.get('/simple-test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/simple-test.html'));
});

app.get('/xodimlar-final.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/xodimlar-final.html'));
});

app.get('/test-buttons.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/test-buttons.html'));
});

app.get('/login', (req, res) => {
    // Login page already has localization middleware applied
    res.render('login');
});

const { validationRules, validate, sanitizeInput } = require('./middleware/validation');

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const bcrypt = require('bcrypt');
    const fs = require('fs').promises;
    
    try {
        // Check users.json only
        const usersData = await fs.readFile(path.join(__dirname, 'data/users.json'), 'utf8');
        const users = JSON.parse(usersData);
        const user = users.find(u => u.username === username && u.active);
        
        if (user && await bcrypt.compare(password, user.password)) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            await fs.writeFile(path.join(__dirname, 'data/users.json'), JSON.stringify(users, null, 2));
            
            req.session.user = {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                permissions: user.permissions,
                allowedDistricts: user.allowedDistricts || ['all']
            };
            // Force session save before redirect
            req.session.save((err) => {
                if (err) {
                    console.error('[LOGIN] Session save error:', err);
                    return res.render('login', { error: 'Session xatosi!' });
                }
                res.redirect('/');
            });
        } else {
            res.render('login', { error: 'Login yoki parol xato!' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'Login xatosi!' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// API Routes
// SIP routes
app.use('/api/sip', auth, requirePermission('sipPhone'), require('./routes/sip'));

// Special route for active SIP accounts (accessible to broadcast users)
app.get('/api/sip-accounts/active', auth, requirePermission('broadcast'), async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        const safeFileOps = require('./lib/safe-file-ops');
        const sipAccountsFile = path.join(__dirname, 'data/sip-accounts.json');
        
        // Load SIP accounts
        let accounts;
        try {
            accounts = await safeFileOps.readJSON(sipAccountsFile, null);
        } catch (error) {
            // Default SIP accounts if file doesn't exist
            accounts = [
                {
                    id: '1',
                    extension: '5530',
                    password: '5530',
                    name: 'Asosiy linja 1',
                    server: '10.105.0.3',
                    active: true,
                    channels: 15,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    extension: '5531',
                    password: '5531',
                    name: 'Asosiy linja 2',
                    server: '10.105.0.3',
                    active: true,
                    channels: 15,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    extension: '5532',
                    password: '5532',
                    name: 'Asosiy linja 3',
                    server: '10.105.0.3',
                    active: true,
                    channels: 15,
                    createdAt: new Date().toISOString()
                }
            ];
        }
        
        if (!accounts) {
            accounts = [];
        }
        
        const activeAccounts = accounts.filter(acc => acc.active);
        res.json(activeAccounts);
    } catch (error) {
        console.error('Error loading active SIP accounts:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.use('/api/sip-accounts', auth, require('./routes/sip-accounts'));
// Broadcast route
app.use('/api/broadcast', auth, requirePermission('broadcast'), require('./routes/broadcast-simple'));
// Use database version for production, JSON version as fallback
// TEMP: Force JSON usage due to database field mapping issues
const useDatabase = false; // process.env.USE_DATABASE !== 'false';
console.log('[SERVER] Using employees route:', useDatabase ? 'employees-db' : 'employees');
app.use('/api/employees', auth, requirePermission('employees'), 
    require(useDatabase ? './routes/employees-db' : './routes/employees'));
app.use('/api/groups', auth, requirePermission('groups'), require('./routes/groups'));
app.use('/api/departments', auth, requirePermission('departments'), require('./routes/departments'));
app.use('/api/districts', auth, requirePermission('districts'), require('./routes/districts'));
// Special route for users page to get districts list without districts permission
app.get('/api/districts-list', auth, async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/districts.json'), 'utf8');
        const districts = JSON.parse(data);
        res.setHeader('Content-Type', 'application/json');
        res.json(districts);
    } catch (error) {
        console.error('Error reading districts:', error);
        res.setHeader('Content-Type', 'application/json');
        res.json([]);
    }
});

// Special route for departments page to get employees list
app.get('/api/employees-departments', auth, requirePermission('departments'), async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/departments.json'), 'utf8');
        const departments = JSON.parse(data);
        res.json(departments);
    } catch (error) {
        console.error('Error reading departments:', error);
        res.json([]);
    }
});

// Special route for districts page
app.get('/api/employees-districts', auth, requirePermission('districts'), async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/districts.json'), 'utf8');
        const districts = JSON.parse(data);
        res.json(districts);
    } catch (error) {
        console.error('Error reading districts:', error);
        res.json([]);
    }
});

// Special route for dashboard (home page)
app.get('/api/employees-dashboard', auth, async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/employees.json'), 'utf8');
        const employees = JSON.parse(data);
        const activeEmployees = employees.filter(emp => !emp.deleted);
        res.json(activeEmployees);
    } catch (error) {
        console.error('Error reading employees for dashboard:', error);
        res.json([]);
    }
});

// Special route for groups page
app.get('/api/employees-groups', auth, requirePermission('groups'), async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/groups.json'), 'utf8');
        const groups = JSON.parse(data);
        res.json(groups);
    } catch (error) {
        console.error('Error reading groups:', error);
        res.json([]);
    }
});

// Special route for broadcast page to get employees list for users with broadcast permission
app.get('/api/employees-broadcast', auth, requirePermission('broadcast'), async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    try {
        console.log('[EMPLOYEES-BROADCAST] Request from user:', req.session?.user?.username, 'Role:', req.session?.user?.role);
        
        const dataPath = path.join(__dirname, 'data/employees.json');
        console.log('[EMPLOYEES-BROADCAST] Reading from:', dataPath);
        
        const data = await fs.readFile(dataPath, 'utf8');
        const employees = JSON.parse(data);
        console.log('[EMPLOYEES-BROADCAST] Total employees:', employees.length);
        
        // Filter employees based on user's allowed districts
        const user = req.session.user;
        let filteredEmployees = employees;
        
        if (user.role !== 'admin' && user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            // Load districts to map IDs to names
            const districtsPath = path.join(__dirname, 'data/districts.json');
            const districtsData = await fs.readFile(districtsPath, 'utf8');
            const districts = JSON.parse(districtsData);
            
            // Create mapping of district IDs to names
            const districtIdToName = {};
            districts.forEach(d => {
                districtIdToName[d.id] = d.name;
            });
            
            // Get allowed district names
            const allowedDistrictNames = user.allowedDistricts.map(id => 
                districtIdToName[id] || id
            );
            
            console.log('[EMPLOYEES-BROADCAST] User allowed districts:', user.allowedDistricts);
            console.log('[EMPLOYEES-BROADCAST] Mapped to names:', allowedDistrictNames);
            
            filteredEmployees = employees.filter(emp => 
                allowedDistrictNames.includes(emp.district)
            );
            console.log('[EMPLOYEES-BROADCAST] Filtered to:', filteredEmployees.length, 'employees');
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.json(filteredEmployees);
    } catch (error) {
        console.error('[EMPLOYEES-BROADCAST] Error:', error);
        res.setHeader('Content-Type', 'application/json');
        res.json([]);
    }
});

// Special route for broadcast page to get groups list for users with broadcast permission
app.get('/api/groups-broadcast', auth, requirePermission('broadcast'), async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/groups.json'), 'utf8');
        const groups = JSON.parse(data);
        res.setHeader('Content-Type', 'application/json');
        res.json(groups);
    } catch (error) {
        console.error('Error reading groups for broadcast:', error);
        res.setHeader('Content-Type', 'application/json');
        res.json([]);
    }
});
app.use('/api/users', auth, requirePermission('users'), require('./routes/users'));
app.use('/api/test', auth, require('./routes/test'));
app.use('/api/excel-template', auth, require('./routes/excel-template'));
app.use('/api/phonebook', auth, requirePermission('phonebook'), require('./routes/phonebook'));
app.use('/api/system', auth, requirePermission('reports'), require('./routes/system-stats'));
app.use('/api/test-auth', require('./routes/test-auth')); // No auth middleware for testing
app.use('/api/file-manager', auth, require('./routes/file-manager')); // Web file manager

// Localization API endpoint with direct file loading as fallback
app.get('/api/translations', (req, res) => {
    // Get locale from request
    const locale = req.query.locale || req.session?.locale || req.cookies?.locale || 'uz-latin';
    
    // Try to load translations directly if module cache is empty
    if (!localization.locales || Object.keys(localization.locales).length === 0) {
        console.log('[API] Localization module empty, loading directly...');
        try {
            const fs = require('fs');
            const localeFile = path.join(__dirname, 'locales', `${locale}.json`);
            const fallbackFile = path.join(__dirname, 'locales', 'uz-latin.json');
            
            let translations = null;
            if (fs.existsSync(localeFile)) {
                translations = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
            } else if (fs.existsSync(fallbackFile)) {
                translations = JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
            }
            
            if (translations) {
                res.json({
                    locale: locale,
                    translations: translations
                });
                return;
            }
        } catch (err) {
            console.error('[API] Error loading translations directly:', err);
        }
    }
    
    // Use normal endpoint
    localization.translationsEndpoint(req, res);
});

// User info endpoint - no permission check needed, just auth
app.get('/api/user-info', auth, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.session.user.id,
            username: req.session.user.username,
            name: req.session.user.name,
            role: req.session.user.role,
            permissions: req.session.user.permissions,
            allowedDistricts: req.session.user.allowedDistricts || ['all']
        }
    });
});

// Dashboard statistics endpoint - no permission check needed, just auth
app.get('/api/dashboard-stats', auth, async (req, res) => {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
        const [empData, distData] = await Promise.all([
            fs.readFile(path.join(__dirname, 'data/employees.json'), 'utf8'),
            fs.readFile(path.join(__dirname, 'data/districts.json'), 'utf8')
        ]);
        
        let employees = JSON.parse(empData);
        const districts = JSON.parse(distData);
        
        // Check user's district permissions
        const user = req.session.user;
        if (user.allowedDistricts && !user.allowedDistricts.includes('all')) {
            // Create mapping of district IDs to names
            const districtIdToName = {};
            districts.forEach(d => {
                districtIdToName[d.id] = d.name;
            });
            
            // Get allowed district names
            const allowedDistrictNames = user.allowedDistricts.map(id => 
                districtIdToName[id] || id
            );
            
            employees = employees.filter(emp => {
                return allowedDistrictNames.includes(emp.district);
            });
        }
        
        // Filter out deleted employees
        employees = employees.filter(emp => !emp.deleted);
        
        res.json({
            success: true,
            employees: employees,
            districts: districts
        });
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Dashboard statistikasini yuklashda xatolik' 
        });
    }
});

// Audio bridge doesn't exist yet, commenting out
// app.use('/api/audio', auth, require('./routes/audio-bridge'));

// SIP Phone page
app.get('/sip-phone', auth, requirePermission('sipPhone'), (req, res) => {
    res.render('sip-phone', { user: req.session.user });
});

// Broadcast page
app.get('/broadcast', auth, requirePermission('broadcast'), (req, res) => {
    res.render('broadcast', { user: req.session.user });
});

// Employees page - using modern Material Design version
app.get('/employees', auth, requirePermission('employees'), (req, res) => {
    res.render('employees', { user: req.session.user });
});



// Reports page
app.get('/reports', auth, requirePermission('reports'), (req, res) => {
    res.render('reports', { user: req.session.user });
});






// SIP Accounts page
app.get('/sip-accounts', auth, requirePermission('sipAccounts'), (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.render('sip-accounts', { 
        user: req.session.user,
        timestamp: Date.now() 
    });
});

// Professional Phone page
app.get('/professional-phone', auth, (req, res) => {
    res.render('professional-phone', { user: req.session.user });
});

// File Manager page
app.get('/file-manager', auth, (req, res) => {
    res.render('file-manager', { user: req.session.user });
});

// Phonebook page
app.get('/phonebook', auth, requirePermission('phonebook'), (req, res) => {
    res.render('phonebook', { user: req.session.user });
});

// Departments page
app.get('/departments', auth, requirePermission('departments'), (req, res) => {
    res.render('departments', { user: req.session.user });
});

// Groups page
app.get('/groups', auth, requirePermission('groups'), (req, res) => {
    res.render('groups', { user: req.session.user });
});

// Districts page
app.get('/districts', auth, requirePermission('districts'), (req, res) => {
    res.render('districts', { user: req.session.user });
});

// Users page
app.get('/users', auth, requirePermission('users'), (req, res) => {
    res.render('users', { user: req.session.user });
});

// Handle legacy /recent endpoint
app.get('/recent', auth, (req, res) => {
    res.redirect('/api/broadcast/recent');
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last
app.use(errorHandler);

// Global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

// WebSocket SIP Proxy is already handled by WSToUDPProxy above
// Removed duplicate WebSocketSIPProxy to fix handleUpgrade error

// Memory monitoring
setInterval(() => {
    const usage = process.memoryUsage();
    console.log('[MEMORY]', new Date().toISOString(), {
        rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
    });
}, 300000); // Every 5 minutes

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    console.log('\n[SHUTDOWN] Graceful shutdown initiated...');
    
    // Stop accepting new connections
    server.close(() => {
        console.log('[SHUTDOWN] HTTP server closed');
    });
    
    // Clean up resources
    if (global.wsToUdpProxy) {
        global.wsToUdpProxy.closeAll();
        console.log('[SHUTDOWN] WebSocket proxy cleaned up');
    }
    
    if (global.sipBackend) {
        global.sipBackend.destroy();
        console.log('[SHUTDOWN] SIP backend destroyed');
    }
    
    // Close Socket.IO
    if (global.io) {
        global.io.close();
        console.log('[SHUTDOWN] Socket.IO closed');
    }
    
    // Wait a bit for cleanup
    setTimeout(() => {
        console.log('[SHUTDOWN] Process exiting...');
        process.exit(0);
    }, 2000);
}


// Start server
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`
========================================
Qashqadaryo IIB Xabarnoma Tizimi
========================================
HTTPS Server: https://0.0.0.0:${PORT}
Local access: https://localhost:${PORT}
Network access: https://172.27.64.10:${PORT}

Login ma'lumotlari .env faylida

WebSocket: wss://172.27.64.10:${PORT}/ws
========================================
    `);
    
    // Initialize SIP backend
    const { getSIPBackend } = require('./lib/sip-backend');
    const sipConfig = {
        username: process.env.SIP_USERNAME || '5530',
        password: process.env.SIP_PASSWORD || '554466asd',
        domain: process.env.SIP_DOMAIN || '10.105.0.3',
        instanceId: 'default'
    };
    global.sipBackend = await getSIPBackend(sipConfig);
    console.log('✅ Server started successfully with SIP enabled');
});