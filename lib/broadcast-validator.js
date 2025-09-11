/**
 * Broadcast Validator
 * Validates broadcast operations to prevent impossible scenarios
 */

class BroadcastValidator {
    constructor() {
        // Minimum time required per call (in seconds)
        this.MIN_CALL_DURATION = 5;
        this.MIN_CONFIRMATION_TIME = 3;
        this.MAX_CONCURRENT_CALLS = 10; // Maximum concurrent calls per SIP account
    }

    /**
     * Validate confirmation timing
     * Returns false if confirmations are impossible (too fast)
     */
    validateConfirmationTiming(broadcast) {
        if (!broadcast.confirmations || broadcast.confirmations.length === 0) {
            return true; // No confirmations to validate
        }

        // Sort confirmations by time
        const sortedConfirmations = [...broadcast.confirmations].sort((a, b) => 
            new Date(a.confirmedAt) - new Date(b.confirmedAt)
        );

        // Check if all confirmations happened too quickly
        const firstConfirmation = new Date(sortedConfirmations[0].confirmedAt);
        const lastConfirmation = new Date(sortedConfirmations[sortedConfirmations.length - 1].confirmedAt);
        const timeDiff = (lastConfirmation - firstConfirmation) / 1000; // in seconds

        // Calculate minimum required time
        const totalCalls = broadcast.confirmations.length;
        const minRequiredTime = (totalCalls / this.MAX_CONCURRENT_CALLS) * this.MIN_CALL_DURATION;

        if (timeDiff < minRequiredTime * 0.8) { // Allow 20% margin
            console.error(`[VALIDATOR] Impossible confirmation timing detected!`);
            console.error(`- Total confirmations: ${totalCalls}`);
            console.error(`- Time taken: ${timeDiff} seconds`);
            console.error(`- Minimum required: ${minRequiredTime} seconds`);
            console.error(`- First confirmation: ${firstConfirmation.toISOString()}`);
            console.error(`- Last confirmation: ${lastConfirmation.toISOString()}`);
            return false;
        }

        // Check for duplicate timestamps (multiple confirmations at exact same time)
        const timestampCounts = {};
        sortedConfirmations.forEach(conf => {
            const timestamp = conf.confirmedAt;
            timestampCounts[timestamp] = (timestampCounts[timestamp] || 0) + 1;
        });

        for (const [timestamp, count] of Object.entries(timestampCounts)) {
            if (count > this.MAX_CONCURRENT_CALLS) {
                console.error(`[VALIDATOR] Too many confirmations at same time!`);
                console.error(`- Timestamp: ${timestamp}`);
                console.error(`- Count: ${count} (max allowed: ${this.MAX_CONCURRENT_CALLS})`);
                return false;
            }
        }

        return true;
    }

    /**
     * Validate individual call attempt
     */
    validateCallAttempt(callAttempt) {
        if (!callAttempt) return false;

        // Check if call was answered but confirmed too quickly
        if (callAttempt.answered && callAttempt.dtmfConfirmed) {
            const answerTime = new Date(callAttempt.answeredAt);
            const confirmTime = new Date(callAttempt.dtmfConfirmedAt);
            const timeDiff = (confirmTime - answerTime) / 1000;

            if (timeDiff < 1) { // Less than 1 second is impossible
                console.error(`[VALIDATOR] DTMF confirmed too quickly!`);
                console.error(`- Answer time: ${answerTime.toISOString()}`);
                console.error(`- Confirm time: ${confirmTime.toISOString()}`);
                console.error(`- Difference: ${timeDiff} seconds`);
                return false;
            }
        }

        return true;
    }

    /**
     * Validate broadcast before saving
     */
    validateBroadcast(broadcast) {
        const errors = [];

        // Check if test mode is accidentally enabled
        if (broadcast.useTestMode === true) {
            errors.push('Test mode is enabled - no real calls will be made');
        }

        // Validate confirmation timing
        if (!this.validateConfirmationTiming(broadcast)) {
            errors.push('Confirmation timing is impossible - possible system error');
        }

        // Check for suspicious patterns
        if (broadcast.confirmedCount === broadcast.totalRecipients && 
            broadcast.totalRecipients > 20 &&
            broadcast.confirmations.length > 0) {
            
            const broadcastStart = new Date(broadcast.createdAt);
            const lastConfirmation = new Date(broadcast.confirmations[broadcast.confirmations.length - 1].confirmedAt);
            const totalTime = (lastConfirmation - broadcastStart) / 1000;
            
            if (totalTime < broadcast.totalRecipients * 2) { // Less than 2 seconds per person
                errors.push(`All ${broadcast.totalRecipients} recipients confirmed in ${totalTime} seconds - this is impossible`);
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Fix invalid broadcast data
     */
    fixInvalidBroadcast(broadcast) {
        console.log('[VALIDATOR] Fixing invalid broadcast data...');
        
        // Reset suspicious confirmations
        if (!this.validateConfirmationTiming(broadcast)) {
            console.log('[VALIDATOR] Resetting invalid confirmations');
            broadcast.confirmedCount = 0;
            broadcast.confirmations = [];
            broadcast.status = 'failed';
            broadcast.error = 'Invalid confirmation data detected - broadcast marked as failed';
        }

        return broadcast;
    }
}

module.exports = BroadcastValidator;