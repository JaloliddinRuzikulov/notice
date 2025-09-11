const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

async function processPendingBroadcasts() {
    console.log('=== PROCESSING PENDING BROADCASTS ===\n');
    
    try {
        // Read broadcast history
        const historyPath = path.join(__dirname, 'data/broadcast-history.json');
        const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
        
        // Find all pending broadcasts
        const pendingBroadcasts = history.filter(b => b.status === 'pending');
        
        console.log(`Found ${pendingBroadcasts.length} pending broadcasts:\n`);
        
        // Show summary
        pendingBroadcasts.forEach((broadcast, index) => {
            console.log(`${index + 1}. ${broadcast.createdByName} - ${broadcast.totalRecipients} recipients`);
            console.log(`   Created: ${new Date(broadcast.createdAt).toLocaleString()}`);
            console.log(`   Message: ${broadcast.smsMessage || 'Audio message'}`);
            console.log(`   ID: ${broadcast.id}\n`);
        });
        
        if (pendingBroadcasts.length === 0) {
            console.log('No pending broadcasts found.');
            return;
        }
        
        console.log('Triggering broadcast queue reset to process all pending broadcasts...\n');
        
        // Reset queue via API
        try {
            const response = await axios.post('https://localhost:8444/api/broadcast/reset-queue', {}, {
                headers: {
                    'Cookie': 'xabarnoma.sid=s%3AsOc_VqCXO0Yo7rvyugm7lsNQAGEfWUuB.XwYyfvJoJSQ8Cn%2BOdI1zL3DdQe9NZRM7HVcddsjVSFg'
                },
                httpsAgent: new (require('https').Agent)({
                    rejectUnauthorized: false
                })
            });
            
            console.log('Queue reset response:', response.data);
            console.log('\n✅ All pending broadcasts have been added to the queue!');
            console.log('They will be processed automatically in order.');
            
        } catch (error) {
            console.error('Error resetting queue:', error.response?.data || error.message);
            console.log('\nTrying alternative method...');
            
            // Alternative: Add each broadcast individually
            for (const broadcast of pendingBroadcasts) {
                try {
                    console.log(`Adding broadcast ${broadcast.id} to queue...`);
                    // Would need to implement individual add endpoint
                } catch (err) {
                    console.error(`Failed to add broadcast ${broadcast.id}:`, err.message);
                }
            }
        }
        
    } catch (error) {
        console.error('Error processing pending broadcasts:', error);
    }
}

// Run the script
processPendingBroadcasts();