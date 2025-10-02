const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Get or generate session secret
 * @returns {string} Session secret
 */
function getSessionSecret() {
    if (process.env.SESSION_SECRET) {
        return process.env.SESSION_SECRET;
    }

    const secretPath = path.join(__dirname, '../../config/session-secret.txt');

    if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf8').trim();
    }

    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    const configDir = path.join(__dirname, '../../config');

    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(secretPath, newSecret);
    return newSecret;
}

/**
 * Configure session middleware
 * @param {express.Application} app - Express app instance
 */
function configureSession(app) {
    const SESSION_SECRET = getSessionSecret();

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
            sameSite: 'lax',
            path: '/'
        },
        name: 'xabarnoma.sid',
        rolling: true // Reset expiry on activity
    }));
}

module.exports = { configureSession };
