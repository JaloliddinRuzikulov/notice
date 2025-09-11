/**
 * Broadcast Queue Manager
 * Manages broadcast queue to prevent blocking and stuck broadcasts
 */

class BroadcastQueueManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.currentBroadcast = null;
        this.processTimeout = null;
        this.maxProcessTime = 5 * 60 * 1000; // 5 minutes max per broadcast
        this.checkInterval = 30000; // Check every 30 seconds
        
        // Start monitoring
        this.startMonitoring();
    }

    /**
     * Add broadcast to queue
     */
    addToQueue(broadcastId) {
        console.log(`[QUEUE MANAGER] Adding broadcast to queue: ${broadcastId}`);
        this.queue.push({
            id: broadcastId,
            addedAt: new Date(),
            attempts: 0
        });
        
        // Trigger processing if not already running
        this.startProcessing();
    }

    /**
     * Start processing queue
     */
    async startProcessing() {
        if (this.isProcessing) {
            console.log('[QUEUE MANAGER] Already processing, skipping start');
            return;
        }

        if (this.queue.length === 0) {
            console.log('[QUEUE MANAGER] Queue is empty');
            return;
        }

        this.isProcessing = true;
        console.log('[QUEUE MANAGER] Starting queue processing');

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            this.currentBroadcast = item;

            try {
                console.log(`[QUEUE MANAGER] Processing broadcast: ${item.id}`);
                
                // Set timeout for this broadcast
                this.processTimeout = setTimeout(() => {
                    console.error(`[QUEUE MANAGER] Broadcast ${item.id} timed out after ${this.maxProcessTime}ms`);
                    this.handleTimeout(item);
                }, this.maxProcessTime);

                // Process the broadcast
                await this.processBroadcast(item.id);

                // Clear timeout if successful
                clearTimeout(this.processTimeout);
                this.processTimeout = null;

                console.log(`[QUEUE MANAGER] Successfully processed: ${item.id}`);
                
            } catch (error) {
                console.error(`[QUEUE MANAGER] Error processing broadcast ${item.id}:`, error);
                clearTimeout(this.processTimeout);
                this.processTimeout = null;

                // Retry logic
                item.attempts++;
                if (item.attempts < 3) {
                    console.log(`[QUEUE MANAGER] Retrying broadcast ${item.id} (attempt ${item.attempts + 1})`);
                    this.queue.push(item);
                } else {
                    console.error(`[QUEUE MANAGER] Max retries reached for ${item.id}, marking as failed`);
                    await this.markBroadcastFailed(item.id, error.message);
                }
            }

            this.currentBroadcast = null;

            // Short delay between broadcasts
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        this.isProcessing = false;
        console.log('[QUEUE MANAGER] Queue processing completed');
    }

    /**
     * Handle timeout for stuck broadcast
     */
    async handleTimeout(item) {
        console.error(`[QUEUE MANAGER] Handling timeout for broadcast ${item.id}`);
        
        // Force stop current broadcast
        this.currentBroadcast = null;
        
        // Mark as failed
        await this.markBroadcastFailed(item.id, 'Broadcast timed out');
        
        // Reset processing flag to allow queue to continue
        this.isProcessing = false;
        
        // Restart processing if there are more items
        if (this.queue.length > 0) {
            setTimeout(() => this.startProcessing(), 1000);
        }
    }

    /**
     * Process broadcast (placeholder - will be set by broadcast-simple.js)
     */
    async processBroadcast(broadcastId) {
        // This will be overridden by the actual implementation
        throw new Error('processBroadcast not implemented');
    }

    /**
     * Mark broadcast as failed (placeholder)
     */
    async markBroadcastFailed(broadcastId, reason) {
        // This will be overridden by the actual implementation
        console.error(`[QUEUE MANAGER] Marking broadcast ${broadcastId} as failed: ${reason}`);
    }

    /**
     * Start monitoring for stuck broadcasts
     */
    startMonitoring() {
        setInterval(() => {
            this.checkHealth();
        }, this.checkInterval);
    }

    /**
     * Check queue health
     */
    checkHealth() {
        const now = new Date();
        
        // Check if processing is stuck
        if (this.isProcessing && this.currentBroadcast) {
            const processingTime = now - this.currentBroadcast.addedAt;
            
            if (processingTime > this.maxProcessTime * 2) {
                console.error('[QUEUE MANAGER] Processing seems stuck, forcing reset');
                this.forceReset();
            }
        }

        // Check for old items in queue
        const oldItems = this.queue.filter(item => {
            const age = now - item.addedAt;
            return age > 30 * 60 * 1000; // 30 minutes
        });

        if (oldItems.length > 0) {
            console.warn(`[QUEUE MANAGER] Found ${oldItems.length} old items in queue`);
        }

        // Log current status
        console.log('[QUEUE MANAGER] Health check:', {
            isProcessing: this.isProcessing,
            queueLength: this.queue.length,
            currentBroadcast: this.currentBroadcast?.id || 'none',
            oldItems: oldItems.length
        });
    }

    /**
     * Force reset the queue manager
     */
    forceReset() {
        console.warn('[QUEUE MANAGER] Forcing reset');
        
        // Clear timeout
        if (this.processTimeout) {
            clearTimeout(this.processTimeout);
            this.processTimeout = null;
        }

        // Reset flags
        this.isProcessing = false;
        this.currentBroadcast = null;

        // Restart processing if queue has items
        if (this.queue.length > 0) {
            setTimeout(() => this.startProcessing(), 1000);
        }
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            queueLength: this.queue.length,
            currentBroadcast: this.currentBroadcast,
            queue: this.queue.map(item => ({
                id: item.id,
                addedAt: item.addedAt,
                attempts: item.attempts,
                age: new Date() - item.addedAt
            }))
        };
    }

    /**
     * Clear the queue
     */
    clearQueue() {
        console.warn('[QUEUE MANAGER] Clearing queue');
        this.queue = [];
        this.forceReset();
    }
}

module.exports = BroadcastQueueManager;