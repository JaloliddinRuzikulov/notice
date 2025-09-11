# Batch System Fix for broadcast-simple.js

## The Problem
The current batch system is making 60-80 calls per minute instead of the expected 20-25 calls. This is because:

1. **No Real Batch Enforcement**: While `BATCH_SIZE = 5` is defined, the actual concurrent calls are limited by `MAX_CONCURRENT_CALLS` (which could be 15-45 depending on SIP accounts).

2. **Race Condition**: Multiple calls ending simultaneously can each trigger `checkAndStartNextBatch()`, potentially starting multiple batches.

3. **Continuous Processing**: The system processes calls continuously as channels become available, not in discrete batches.

## The Fix

Replace the current batch logic (lines 596-643) with this improved version:

```javascript
// Track batch state
let currentBatchCount = 0;
let completedInCurrentBatch = 0;
let isWaitingForBatch = false;
let isBatchInProgress = false;  // NEW: Prevent concurrent batches
const BATCH_SIZE = 5;
const BATCH_WAIT_TIME = 2000; // 2 seconds between batches

// Function to check if we should start next batch
const checkAndStartNextBatch = async () => {
    // Prevent multiple simultaneous checks
    if (isWaitingForBatch || isBatchInProgress || callQueue.length === 0) return;
    
    // If all calls in current batch are completed
    if (currentBatchCount > 0 && completedInCurrentBatch >= currentBatchCount) {
        console.log(`\n✅ Batch complete! Processed ${currentBatchCount} calls.`);
        console.log(`📊 Remaining in queue: ${callQueue.length}`);
        
        if (callQueue.length > 0) {
            // Mark that we're waiting
            isWaitingForBatch = true;
            isBatchInProgress = false;
            
            // Reset batch counters
            currentBatchCount = 0;
            completedInCurrentBatch = 0;
            
            // Wait before starting next batch
            console.log(`⏳ Waiting ${BATCH_WAIT_TIME/1000} seconds before starting next batch...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_WAIT_TIME));
            
            // Start next batch
            isWaitingForBatch = false;
            await startNewBatch();
        } else {
            // No more calls, mark batch complete
            isBatchInProgress = false;
        }
    }
};

// Function to start a new batch of calls
const startNewBatch = async () => {
    // Prevent concurrent batch starts
    if (isBatchInProgress || callQueue.length === 0) {
        console.log(`⚠️ Batch already in progress or queue empty, skipping...`);
        return;
    }
    
    isBatchInProgress = true;
    
    // Use BATCH_SIZE, not MAX_CONCURRENT_CALLS
    const batchSize = Math.min(BATCH_SIZE, callQueue.length);
    console.log(`\n🚀 Starting new batch of ${batchSize} calls...`);
    currentBatchCount = batchSize;
    completedInCurrentBatch = 0;
    
    // Start exactly batchSize calls
    for (let i = 0; i < batchSize; i++) {
        if (totalActiveCallsCount < BATCH_SIZE) {  // Double-check we don't exceed batch size
            await processNextInQueue();
            if (i < batchSize - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
    }
};
```

Also update `processNextInQueue` (line 646) to respect batch limits:

```javascript
const processNextInQueue = async () => {
    if (callQueue.length === 0) {
        console.log('Call queue is empty, no more recipients');
        return;
    }
    
    // NEW: Check if we're in a batch and if we've reached batch size
    if (isBatchInProgress && totalActiveCallsCount >= BATCH_SIZE) {
        console.log(`Batch limit reached (${BATCH_SIZE}), waiting for calls to complete...`);
        return;
    }
    
    // Find available SIP backend
    const backend = findBestSipBackend();
    // Check channel limits - but respect BATCH_SIZE when in batch mode
    const effectiveLimit = isBatchInProgress ? BATCH_SIZE : MAX_CONCURRENT_CALLS;
    if (!backend || totalActiveCallsCount >= effectiveLimit) {
        console.log(`Channels busy - Active: ${totalActiveCallsCount}/${effectiveLimit}`);
        return;
    }
    
    // ... rest of the function remains the same
```

## Summary of Changes

1. Added `isBatchInProgress` flag to prevent concurrent batch processing
2. Limited concurrent calls to `BATCH_SIZE` (5) instead of `MAX_CONCURRENT_CALLS`
3. Added protection against race conditions in `checkAndStartNextBatch()`
4. Modified `processNextInQueue()` to respect batch limits
5. Added clear logging to track batch state

## Expected Result
With these changes:
- Exactly 5 calls will run in parallel
- System will wait for ALL 5 to complete
- 2-second pause between batches
- Expected calls per minute: ~20-25 (depending on call duration)

## Testing
Monitor the logs for:
- "Starting new batch of 5 calls..."
- "Batch complete! Processed 5 calls."
- "Waiting 2 seconds before starting next batch..."
- Verify no more than 5 concurrent calls at any time