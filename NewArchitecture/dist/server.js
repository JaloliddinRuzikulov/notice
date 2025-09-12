"use strict";
/**
 * Server Bootstrap
 * Main entry point for the application
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrap = bootstrap;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const app_1 = require("./app");
// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile) });
// Also load base .env file as fallback
dotenv_1.default.config();
/**
 * Bootstrap function to start the application
 */
async function bootstrap() {
    try {
        // Display startup banner
        displayStartupBanner();
        // Validate environment variables
        validateEnvironment();
        // Create and start the application
        const app = new app_1.App();
        await app.start();
    }
    catch (error) {
        console.error('❌ Application failed to start:', error);
        process.exit(1);
    }
}
/**
 * Display startup banner
 */
function displayStartupBanner() {
    console.clear();
    console.log('');
    console.log('██╗██╗██╗   ██╗    ███╗   ██╗ ██████╗ ████████╗██╗ ██████╗███████╗');
    console.log('██║██║██║   ██║    ████╗  ██║██╔═══██╗╚══██╔══╝██║██╔════╝██╔════╝');
    console.log('██║██║██║   ██║    ██╔██╗ ██║██║   ██║   ██║   ██║██║     █████╗  ');
    console.log('██║██║╚██╗ ██╔╝    ██║╚██╗██║██║   ██║   ██║   ██║██║     ██╔══╝  ');
    console.log('██║██║ ╚████╔╝     ██║ ╚████║╚██████╔╝   ██║   ██║╚██████╗███████╗');
    console.log('╚═╝╚═╝  ╚═══╝      ╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚═╝ ╚═════╝╚══════╝');
    console.log('');
    console.log('🏢 Mass Notification System - Clean Architecture with TypeScript');
    console.log('📧 Developed for Internal Affairs Ministry of Uzbekistan');
    console.log('🏗️  Clean Architecture • TypeScript • Domain-Driven Design');
    console.log('');
}
/**
 * Validate required environment variables
 */
function validateEnvironment() {
    const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'DATABASE_URL',
        'SESSION_SECRET'
    ];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingEnvVars.forEach(envVar => {
            console.error(`   - ${envVar}`);
        });
        console.error('\n💡 Create .env.development file with required variables');
        process.exit(1);
    }
    // Display environment info
    console.log('🔧 Environment Configuration:');
    console.log(`   📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`   🌐 Port: ${process.env.PORT}`);
    console.log(`   🗄️  Database: ${process.env.DATABASE_URL ? '✓ Configured' : '❌ Not configured'}`);
    console.log(`   🔐 Session Secret: ${process.env.SESSION_SECRET ? '✓ Configured' : '❌ Not configured'}`);
    console.log(`   📁 Upload Dir: ${process.env.AUDIO_UPLOAD_DIR || './uploads/audio'}`);
    console.log('');
    // Warn about development defaults
    if (process.env.NODE_ENV !== 'production') {
        if (process.env.SESSION_SECRET === 'your-super-secret-key-change-in-production') {
            console.warn('⚠️  WARNING: Using default session secret in development');
        }
    }
}
/**
 * Handle application lifecycle
 */
function setupApplicationLifecycle() {
    // Log application start
    console.log(`🚀 Starting IIV Notice System API...`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`🔧 Node.js version: ${process.version}`);
    console.log(`💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log('');
}
/**
 * Create .env.development template if it doesn't exist
 */
function createEnvTemplate() {
    const fs = require('fs');
    const envPath = '.env.development';
    if (!fs.existsSync(envPath)) {
        const envTemplate = `# IIV Notice System - Development Environment
# Copy this file and update values for your environment

# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=sqlite:./data/notice_system.db

# Security
SESSION_SECRET=your-super-secret-key-change-in-production

# File Upload
AUDIO_UPLOAD_DIR=./uploads/audio

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info

# Rate Limiting (requests per minute)
RATE_LIMIT_MAX=100

# SIP/Asterisk Configuration (optional)
ASTERISK_HOST=localhost
ASTERISK_PORT=5038
ASTERISK_USERNAME=admin
ASTERISK_PASSWORD=secret

# External Services (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=password
`;
        try {
            fs.writeFileSync(envPath, envTemplate);
            console.log(`✅ Created ${envPath} template file`);
            console.log('💡 Please update the values in this file before starting the server');
        }
        catch (error) {
            console.warn(`⚠️  Could not create ${envPath} template:`, error instanceof Error ? error.message : error);
        }
    }
}
// Setup application lifecycle
setupApplicationLifecycle();
// Create environment template if needed
if (process.env.NODE_ENV !== 'production') {
    createEnvTemplate();
}
// Start the application
bootstrap().catch((error) => {
    console.error('💥 Fatal error during application startup:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map