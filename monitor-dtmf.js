#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== DTMF Monitoring Script ===');
console.log('Monitoring for DTMF events...\n');

// Monitor server.log for DTMF events
const logFile = path.join(__dirname, 'server.log');

// Start monitoring in real-time
console.log('Monitoring server.log for DTMF events...');
console.log('Press Ctrl+C to stop\n');

// Use tail to monitor the log file
const tail = require('child_process').spawn('tail', ['-f', logFile]);

let buffer = '';

tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    lines.forEach(line => {
        // Filter for DTMF related lines
        if (line.includes('INFO') || 
            line.includes('DTMF') || 
            line.includes('dtmf') ||
            line.includes('Signal=') ||
            line.includes('broadcast-confirmed') ||
            line.includes('telephone-event') ||
            line.includes('application/dtmf')) {
            
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${line}`);
        }
        
        // Also check for SIP messages
        if (line.includes('Received SIP message')) {
            buffer = line + '\n';
        } else if (buffer && line.includes('First line:')) {
            buffer += line + '\n';
            if (line.includes('INFO ')) {
                console.log('\n🔔 INFO MESSAGE DETECTED!');
                console.log(buffer);
            }
            buffer = '';
        }
    });
});

tail.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
});

tail.on('close', (code) => {
    console.log('Monitoring stopped with code:', code);
});

// Also check current DTMF handler status
console.log('\n=== Checking DTMF Handler Status ===');
try {
    const sipBackendFile = path.join(__dirname, 'lib/sip-backend.js');
    const dtmfHandlerFile = path.join(__dirname, 'lib/dtmf-handler.js');
    
    // Check if DTMF handler is properly imported
    const sipBackendContent = fs.readFileSync(sipBackendFile, 'utf8');
    if (sipBackendContent.includes("require('./dtmf-handler')")) {
        console.log('✅ DTMF Handler is imported in sip-backend.js');
    } else {
        console.log('❌ DTMF Handler NOT imported in sip-backend.js!');
    }
    
    // Check if DTMF handler is initialized
    if (sipBackendContent.includes('this.dtmfHandler = new DTMFHandler()')) {
        console.log('✅ DTMF Handler is initialized');
    } else {
        console.log('❌ DTMF Handler NOT initialized!');
    }
    
    // Check if handleMessage processes INFO
    if (sipBackendContent.includes("if (firstLine.startsWith('INFO '))")) {
        console.log('✅ handleMessage checks for INFO requests');
    } else {
        console.log('❌ handleMessage does NOT check for INFO requests!');
    }
    
    // Check if handleDTMFInfo is called
    if (sipBackendContent.includes('handleDTMFInfo')) {
        console.log('✅ handleDTMFInfo method exists and is called');
    } else {
        console.log('❌ handleDTMFInfo method NOT found or not called!');
    }
    
} catch (error) {
    console.error('Error checking DTMF handler status:', error.message);
}

console.log('\n=== Live Monitoring Started ===\n');