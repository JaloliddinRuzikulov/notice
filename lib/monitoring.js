/**
 * Start memory monitoring (every 5 minutes)
 */
function startMemoryMonitoring() {
    setInterval(() => {
        const usage = process.memoryUsage();
        console.log('[MEMORY]', new Date().toISOString(), {
            rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
        });
    }, 300000); // 5 minutes
}

module.exports = { startMemoryMonitoring };
