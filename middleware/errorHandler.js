// Error handling middleware

// Request logger
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    // Log 404 errors for debugging
    console.log(`[404] ${req.method} ${req.url} - IP: ${req.ip}`);
    
    // For API requests, return JSON
    if (req.path.startsWith('/api/') || req.headers['accept']?.includes('application/json')) {
        res.status(404).json({
            success: false,
            message: 'Endpoint topilmadi',
            path: req.url,
            method: req.method
        });
    } else {
        // For page requests, redirect to home
        res.redirect('/');
    }
};

// General error handler
const errorHandler = (err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err);
    
    const status = err.status || 500;
    const message = err.message || 'Server xatosi';
    
    res.status(status).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    requestLogger,
    notFoundHandler,
    errorHandler
};