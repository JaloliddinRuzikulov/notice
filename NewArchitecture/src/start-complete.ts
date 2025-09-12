/**
 * Startup Script for Complete Server
 * Launches the full telecom system with all services
 */

import dotenv from 'dotenv';
import path from 'path';
import { CompleteServer } from './server-complete';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config(); // Fallback to .env

/**
 * Display startup banner
 */
function displayBanner(): void {
  console.clear();
  console.log('\n' + '█'.repeat(70));
  console.log('██   IIV MASS NOTIFICATION SYSTEM - COMPLETE LAUNCH   ██');
  console.log('██              TELECOM FUNCTIONALITY READY             ██');
  console.log('█'.repeat(70));
  console.log('🏢 Internal Affairs Ministry of Uzbekistan');
  console.log('🏗️  Clean Architecture + TypeScript + Real-time WebSocket');
  console.log('📞 SIP Calling + Mass Broadcast + Audio Management');
  console.log('📊 Dashboard + Call History + Employee Management\n');
}

/**
 * Create environment file if missing
 */
function ensureEnvironment(): void {
  const fs = require('fs');
  const envPath = '.env.development';

  if (!fs.existsSync(envPath)) {
    const template = `# IIV Mass Notification System - Development
NODE_ENV=development
PORT=3000
DATABASE_URL=sqlite:./data/notice_system.db
SESSION_SECRET=dev-secret-change-in-production
AUDIO_UPLOAD_DIR=./uploads/audio
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=debug
`;
    fs.writeFileSync(envPath, template);
    console.log(`✅ Created ${envPath} with default settings`);
  }
}

/**
 * Validate required dependencies
 */
function validateDependencies(): void {
  const required = [
    'express', 'socket.io', 'tsyringe', 'typeorm',
    'jssip', 'cors', 'helmet', 'compression',
    'express-session', 'express-rate-limit', 'ejs'
  ];

  console.log('🔍 Validating dependencies...');
  
  try {
    const packageJson = require('../package.json');
    const missing = required.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missing.length > 0) {
      console.warn('⚠️  Missing dependencies:', missing.join(', '));
      console.log('💡 Run: npm install to install missing packages');
    } else {
      console.log('✅ All dependencies available');
    }
  } catch (error) {
    console.warn('⚠️  Could not validate dependencies');
  }
}

/**
 * Ensure required directories exist
 */
function ensureDirectories(): void {
  const fs = require('fs');
  const dirs = [
    './data',
    './uploads',
    './uploads/audio',
    './logs'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Main startup function
 */
async function startCompleteServer(): Promise<void> {
  try {
    displayBanner();
    
    console.log('🚀 Starting Complete IIV Notice System...\n');
    
    // Pre-flight checks
    ensureEnvironment();
    validateDependencies();
    ensureDirectories();
    
    console.log('\n🔧 System Configuration:');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port: ${process.env.PORT || '3000'}`);
    console.log(`   Database: ${process.env.DATABASE_URL || 'sqlite:./data/notice_system.db'}`);
    console.log(`   Node.js: ${process.version}`);
    console.log(`   Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    
    console.log('\n🏗️  Initializing server components...\n');
    
    // Create and start the complete server
    const server = new CompleteServer();
    await server.start();
    
  } catch (error) {
    console.error('\n❌ STARTUP FAILED:');
    console.error('================');
    console.error(error);
    console.error('================\n');
    
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check if all dependencies are installed: npm install');
    console.log('   2. Verify environment variables in .env.development');
    console.log('   3. Ensure database file/folder permissions are correct');
    console.log('   4. Check if port is already in use');
    console.log('   5. Review error message above for specific issues\n');
    
    process.exit(1);
  }
}

// Handle startup process
console.log('⏳ Preparing to start IIV Mass Notification System...\n');

// Set process title
process.title = 'iiv-notice-complete';

// Add some startup delay for better UX
setTimeout(() => {
  startCompleteServer().catch(error => {
    console.error('💥 Fatal startup error:', error);
    process.exit(1);
  });
}, 1000);