const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

/**
 * Configure Express middleware
 * @param {express.Application} app - Express app instance
 * @param {number} port - Server port for CORS configuration
 */
function configureExpress(app, port) {
    // CORS configuration - dynamic based on PORT
    const corsOrigins = [
        `https://172.27.64.10:${port}`,
        `https://localhost:${port}`,
        `https://10.105.1.45:${port}`,
        'https://172.27.64.10:8444',
        'https://localhost:8444'
    ];

    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or Postman)
            if (!origin) return callback(null, true);

            if (corsOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.warn('CORS blocked origin:', origin);
                callback(null, true); // For development, allow all origins
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Body parsers
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Static files middleware
    app.use(express.static(path.join(__dirname, '../../public'), {
        maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
        etag: true,
        lastModified: true,
        setHeaders: (res, filePath) => {
            if (process.env.NODE_ENV !== 'production') {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
        }
    }));

    // View engine setup
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../../views'));
    app.set('etag', false);
    app.set('view cache', false);

    // Cookie parser - MUST be before session
    app.use(cookieParser());

    // Localization middleware
    const localization = require('../localization');
    app.use(localization.middleware);
}

module.exports = { configureExpress };
