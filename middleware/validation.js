const { body, param, query, validationResult } = require('express-validator');

// Validation middleware factory
const validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    };
};

// Common validation rules
const validationRules = {
    // User validation
    login: [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username faqat harf, raqam va _ belgisidan iborat bo\'lishi kerak'),
        body('password')
            .isLength({ min: 1, max: 100 })
            .withMessage('Parol kiritilmagan')
    ],

    // Employee validation
    createEmployee: [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .matches(/^[a-zA-Z\s\'\-\u0400-\u04FF]+$/)
            .withMessage('Ism faqat harflardan iborat bo\'lishi kerak'),
        body('position')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Lavozim noto\'g\'ri'),
        body('phone')
            .trim()
            .matches(/^(0)?\d{9}$/)
            .withMessage('Telefon raqam formati: 991234567 yoki 0991234567'),
        body('email')
            .optional()
            .trim()
            .isEmail()
            .normalizeEmail()
            .withMessage('Email formati noto\'g\'ri'),
        body('district')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Tuman nomi juda uzun')
    ],

    // Broadcast validation
    createBroadcast: [
        body('title')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Sarlavha 3-200 belgi orasida bo\'lishi kerak'),
        body('phoneNumbers')
            .isArray({ min: 1 })
            .withMessage('Kamida 1 ta telefon raqam bo\'lishi kerak'),
        body('phoneNumbers.*')
            .matches(/^(0)?\d{9}$/)
            .withMessage('Telefon raqam formati: 991234567 yoki 0991234567'),
        body('scheduleTime')
            .optional()
            .isISO8601()
            .withMessage('Vaqt formati noto\'g\'ri')
    ],

    // ID validation
    validateId: [
        param('id')
            .matches(/^[a-zA-Z0-9\-]+$/)
            .withMessage('ID formati noto\'g\'ri')
    ],

    // Search validation
    search: [
        query('q')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Qidiruv so\'rovi juda uzun'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 1000 })
            .withMessage('Limit 1-1000 orasida bo\'lishi kerak'),
        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset 0 dan katta bo\'lishi kerak')
    ],

    // Password change validation
    changePassword: [
        body('oldPassword')
            .notEmpty()
            .withMessage('Eski parol kiritilmagan'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak')
    ]
};

// Simple input sanitization
const sanitizeInput = (req, res, next) => {
    // Basic sanitization - just trim strings
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                result[key] = value.trim();
            } else if (Array.isArray(value)) {
                result[key] = value.map(v => typeof v === 'string' ? v.trim() : v);
            } else {
                result[key] = value;
            }
        }
        return result;
    };

    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
};

module.exports = {
    validate,
    validationRules,
    sanitizeInput
};