#!/usr/bin/env node

/**
 * Test real SIP call
 */

const { getSIPBackend } = require('./lib/sip-backend');

async function testCall() {
    console.log('🚀 Starting SIP backend test...\n');

    // Get existing SIP backend instance
    const sip = await getSIPBackend({
        server: '10.105.0.3',
        port: 5060,
        username: '5530',
        password: '5530',
        domain: '10.105.0.3'
    });

    try {
        // Initialize
        await sip.initialize();
        console.log('✅ SIP backend initialized\n');

        // Register with server
        console.log('📞 Registering with SIP server...');
        await sip.register();
        console.log('✅ Registered successfully\n');

        // Make call to the target number
        const targetNumber = '9998993442729';  // 9 bilan boshlanadi (trunk orqali)
        console.log(`📱 Making call to: ${targetNumber}`);

        const callId = await sip.makeCall(targetNumber);
        console.log(`✅ Call initiated with ID: ${callId}\n`);

        // Listen for call events
        sip.on('call-ringing', (data) => {
            console.log('🔔 Phone is ringing...', data);
        });

        sip.on('call-answered', (data) => {
            console.log('✅ Call answered!', data);
        });

        sip.on('call-ended', (data) => {
            console.log('📴 Call ended', data);
        });

        sip.on('call-failed', (data) => {
            console.log('❌ Call failed:', data);
        });

        // Wait for call to complete
        console.log('⏳ Waiting for call to complete...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    } catch (error) {
        console.error('❌ Error:', error);
    }

    process.exit(0);
}

// Run test
testCall();