const { notFoundHandler, errorHandler } = require('../middleware/errorHandler');

/**
 * Setup error handlers for the application
 * @param {express.Application} app - Express app instance
 */
function setupErrorHandlers(app) {
    // 404 handler - must be after all routes
    app.use(notFoundHandler);

    // Error handler - must be last
    app.use(errorHandler);
}

/**
 * Setup global process error handlers
 */
function setupGlobalErrorHandlers() {
    // Global error handlers to prevent crashes
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        console.error('Stack:', error.stack);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
}

module.exports = {
    setupErrorHandlers,
    setupGlobalErrorHandlers
};
