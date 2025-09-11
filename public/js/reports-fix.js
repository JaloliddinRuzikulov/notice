// Debug helper to ensure functions are available
document.addEventListener('DOMContentLoaded', function() {
    console.log('[REPORTS FIX] Checking function availability...');
    
    // Check if all required functions are available
    const requiredFunctions = [
        'showBroadcastDetails',
        'closeDetailModal',
        'deleteBroadcast',
        'updateReports',
        'exportReport',
        'printReport',
        'exportSingleBroadcast',
        'viewDetailedReport'
    ];
    
    const missingFunctions = [];
    requiredFunctions.forEach(func => {
        if (typeof window[func] !== 'function') {
            missingFunctions.push(func);
            console.warn(`[REPORTS FIX] Function ${func} is not available`);
        } else {
            console.log(`[REPORTS FIX] ✓ Function ${func} is available`);
        }
    });
    
    if (missingFunctions.length > 0) {
        console.error('[REPORTS FIX] Missing functions:', missingFunctions);
        
        // Add fallback for showBroadcastDetails if it's missing
        if (missingFunctions.includes('showBroadcastDetails')) {
            console.warn('[REPORTS FIX] Adding fallback for showBroadcastDetails');
            window.showBroadcastDetails = function(broadcastId) {
                console.error('showBroadcastDetails fallback called - original function not loaded');
                alert('Modal yuklanishda xatolik. Sahifani yangilang.');
            };
        }
    } else {
        console.log('[REPORTS FIX] All functions loaded successfully');
    }
    
    // Override the showBroadcastDetails to add error handling
    const originalShowBroadcastDetails = window.showBroadcastDetails;
    if (originalShowBroadcastDetails) {
        window.showBroadcastDetails = async function(broadcastId) {
            console.log('[REPORTS FIX] showBroadcastDetails called with ID:', broadcastId);
            try {
                // Check if exportSingleBroadcast and viewDetailedReport are available
                if (typeof window.exportSingleBroadcast !== 'function') {
                    console.warn('[REPORTS FIX] exportSingleBroadcast not available, loading fallback');
                    window.exportSingleBroadcast = function(id) {
                        alert('Excel export funksiyasi yuklanmagan. Sahifani yangilang.');
                    };
                }
                
                if (typeof window.viewDetailedReport !== 'function') {
                    console.warn('[REPORTS FIX] viewDetailedReport not available, loading fallback');
                    window.viewDetailedReport = function(id) {
                        alert('Batafsil ko\'rish funksiyasi yuklanmagan. Sahifani yangilang.');
                    };
                }
                
                // Call the original function
                await originalShowBroadcastDetails.call(this, broadcastId);
                console.log('[REPORTS FIX] Modal opened successfully');
            } catch (error) {
                console.error('[REPORTS FIX] Error in showBroadcastDetails:', error);
                alert('Modal ochishda xatolik: ' + error.message);
            }
        };
    }
});

// Global error handler to catch any uncaught errors
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('is not defined')) {
        console.error('[REPORTS FIX] Undefined function error:', event.message);
        
        // Check if it's one of our functions
        const functionName = event.message.match(/(\w+) is not defined/)?.[1];
        if (functionName && ['exportSingleBroadcast', 'viewDetailedReport'].includes(functionName)) {
            event.preventDefault(); // Prevent default error handling
            console.warn(`[REPORTS FIX] Attempting to recover from missing ${functionName}`);
            
            // Add a stub function
            window[functionName] = function() {
                alert(`${functionName} funksiyasi yuklanmagan. Sahifani yangilang.`);
            };
        }
    }
});

console.log('[REPORTS FIX] Fix script loaded');