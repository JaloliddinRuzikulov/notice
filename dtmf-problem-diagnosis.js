#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== DTMF PROBLEM DIAGNOSIS ===\n');

// 1. Check if INFO messages are reaching the server
console.log('1. CHECKING FOR INFO MESSAGES IN SERVER LOG');
console.log('-------------------------------------------');
try {
    const serverLog = fs.readFileSync('/home/user/server.log', 'utf8');
    const lines = serverLog.split('\n');
    
    // Look for INFO messages
    let infoCount = 0;
    let dtmfCount = 0;
    let lastInfoIndex = -1;
    
    lines.forEach((line, index) => {
        if (line.includes('INFO sip:')) {
            infoCount++;
            lastInfoIndex = index;
        }
        if (line.toLowerCase().includes('dtmf') || line.includes('Signal=')) {
            dtmfCount++;
        }
    });
    
    console.log(`Total INFO messages found: ${infoCount}`);
    console.log(`Total DTMF-related entries: ${dtmfCount}`);
    
    if (lastInfoIndex >= 0) {
        console.log('\nLast INFO message context:');
        for (let i = Math.max(0, lastInfoIndex - 5); i <= Math.min(lines.length - 1, lastInfoIndex + 10); i++) {
            console.log(`  ${lines[i]}`);
        }
    } else {
        console.log('\n❌ NO INFO MESSAGES FOUND IN LOG!');
        console.log('This means Asterisk is NOT sending DTMF via SIP INFO.');
    }
} catch (err) {
    console.log('Error reading server.log:', err.message);
}

// 2. Check broadcast history for confirmation patterns
console.log('\n\n2. CHECKING BROADCAST HISTORY');
console.log('-----------------------------');
try {
    const history = JSON.parse(fs.readFileSync('/home/user/data/broadcast-history.json', 'utf8'));
    
    let totalCalls = 0;
    let answeredCalls = 0;
    let dtmfConfirmedCalls = 0;
    
    history.forEach(broadcast => {
        if (broadcast.callAttempts) {
            Object.values(broadcast.callAttempts).forEach(attempts => {
                attempts.forEach(attempt => {
                    totalCalls++;
                    if (attempt.answered) answeredCalls++;
                    if (attempt.dtmfConfirmed) dtmfConfirmedCalls++;
                });
            });
        }
    });
    
    console.log(`Total calls made: ${totalCalls}`);
    console.log(`Calls answered: ${answeredCalls}`);
    console.log(`Calls with DTMF confirmation: ${dtmfConfirmedCalls}`);
    console.log(`DTMF success rate: ${answeredCalls > 0 ? (dtmfConfirmedCalls / answeredCalls * 100).toFixed(2) : 0}%`);
    
    if (dtmfConfirmedCalls === 0 && answeredCalls > 0) {
        console.log('\n⚠️  WARNING: Calls are being answered but NO DTMF confirmations!');
    }
} catch (err) {
    console.log('Error reading broadcast history:', err.message);
}

// 3. Check Asterisk configuration
console.log('\n\n3. ASTERISK DTMF CONFIGURATION');
console.log('-------------------------------');
console.log('Common Asterisk DTMF issues:');
console.log('- dtmfmode not set to "info" or "auto" for the peer');
console.log('- Asterisk might be configured for RFC2833 instead of SIP INFO');
console.log('- Phone/endpoint might not be sending DTMF properly');
console.log('\nTo check Asterisk configuration, run:');
console.log('  asterisk -rx "sip show peer 5530" | grep -i dtmf');

// 4. Check if our code is listening for the right events
console.log('\n\n4. CODE ANALYSIS');
console.log('-----------------');
const sipBackendPath = path.join(__dirname, 'lib/sip-backend.js');
try {
    const sipBackend = fs.readFileSync(sipBackendPath, 'utf8');
    
    // Check critical code paths
    const checks = [
        { pattern: /handleMessage.*INFO/s, desc: 'INFO detection in handleMessage' },
        { pattern: /parseResponse.*INFO/s, desc: 'INFO handling in parseResponse' },
        { pattern: /handleDTMFInfo/s, desc: 'handleDTMFInfo method' },
        { pattern: /sendInfoResponse/s, desc: 'sendInfoResponse method' },
        { pattern: /broadcast-confirmed/s, desc: 'broadcast-confirmed event emission' }
    ];
    
    checks.forEach(check => {
        if (check.pattern.test(sipBackend)) {
            console.log(`✅ ${check.desc} - FOUND`);
        } else {
            console.log(`❌ ${check.desc} - NOT FOUND`);
        }
    });
} catch (err) {
    console.log('Error analyzing code:', err.message);
}

// 5. Possible root causes
console.log('\n\n5. MOST LIKELY ROOT CAUSES');
console.log('--------------------------');
console.log('Based on the analysis:');
console.log('\n1. Asterisk is not sending DTMF via SIP INFO');
console.log('   - Check: asterisk -rx "sip show peer 5530"');
console.log('   - Solution: Set dtmfmode=info or dtmfmode=auto in sip.conf');
console.log('\n2. The phone/endpoint is not sending DTMF properly');
console.log('   - Test with different phone or softphone');
console.log('   - Ensure DTMF is enabled on the phone');
console.log('\n3. DTMF is being sent via RTP (RFC2833) instead of SIP INFO');
console.log('   - Our code primarily handles SIP INFO');
console.log('   - RTP DTMF detection requires analyzing RTP packets');
console.log('\n4. Network/firewall blocking SIP INFO messages');
console.log('   - Check if INFO messages appear in Asterisk logs');
console.log('   - Use tcpdump/wireshark to capture SIP traffic');

console.log('\n\n=== DIAGNOSIS COMPLETE ===');