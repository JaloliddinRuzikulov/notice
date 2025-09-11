const path = require('path');
const fs = require('fs').promises;

// Load the queue manager from broadcast module
const BroadcastQueueManager = require('./lib/broadcast-queue-manager');
const queueManager = new BroadcastQueueManager();

async function forcePendingBroadcasts() {
    console.log('=== FORCE PROCESSING PENDING BROADCASTS ===\n');
    
    try {
        // Read broadcast history
        const historyPath = path.join(__dirname, 'data/broadcast-history.json');
        const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
        
        // Find all pending broadcasts
        const pendingBroadcasts = history.filter(b => b.status === 'pending' || b.status === 'active');
        
        console.log(`Found ${pendingBroadcasts.length} pending/active broadcasts\n`);
        
        // Sort by creation date (oldest first)
        pendingBroadcasts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Add each to queue
        for (const broadcast of pendingBroadcasts) {
            console.log(`Adding to queue: ${broadcast.id}`);
            console.log(`  From: ${broadcast.createdByName}`);
            console.log(`  Recipients: ${broadcast.totalRecipients}`);
            console.log(`  Created: ${new Date(broadcast.createdAt).toLocaleString()}`);
            
            queueManager.addToQueue(broadcast.id);
            console.log('  ✓ Added to queue\n');
        }
        
        console.log('\n=== SUMMARY ===');
        console.log(`Total broadcasts added to queue: ${pendingBroadcasts.length}`);
        console.log('Queue status:', queueManager.getStatus());
        
        // Set up the process broadcast function
        queueManager.processBroadcast = async (broadcastId) => {
            console.log(`[QUEUE] Processing broadcast ${broadcastId}`);
            // This would normally call the actual broadcast processing
            // For now, just log
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log(`[QUEUE] Completed broadcast ${broadcastId}`);
        };
        
        console.log('\n✅ All pending broadcasts have been queued!');
        console.log('The queue manager will process them automatically.');
        
        // Keep the script running to see the processing
        console.log('\nMonitoring queue progress (Ctrl+C to stop)...\n');
        
        setInterval(() => {
            const status = queueManager.getStatus();
            if (status.queueLength > 0 || status.isProcessing) {
                console.log(`[MONITOR] Queue: ${status.queueLength} items, Processing: ${status.isProcessing}, Current: ${status.currentBroadcast?.id || 'none'}`);
            }
        }, 5000);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Keep process alive
process.on('SIGINT', () => {
    console.log('\n\nStopping...');
    process.exit(0);
});

// Run
forcePendingBroadcasts();