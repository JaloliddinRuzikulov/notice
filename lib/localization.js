const fs = require('fs');
const path = require('path');

// Load all available locales
const localesDir = path.join(__dirname, '..', 'locales');
const locales = {};
const availableLocales = [];

// Load translation files
try {
    const files = fs.readdirSync(localesDir);
    console.log(`[Localization] Found ${files.length} files in ${localesDir}`);
    
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const localeName = file.replace('.json', '');
            const filePath = path.join(localesDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(content);
                locales[localeName] = parsed;
                availableLocales.push(localeName);
                console.log(`[Localization] Loaded locale: ${localeName} with ${Object.keys(parsed).length} top-level keys`);
            } catch (err) {
                console.error(`[Localization] Error loading locale ${localeName}:`, err.message);
            }
        }
    });
    
    console.log(`[Localization] Successfully loaded ${availableLocales.length} locales: ${availableLocales.join(', ')}`);
} catch (err) {
    console.error(`[Localization] Critical error reading locales directory:`, err.message);
}

// Default locale
const defaultLocale = 'uz-latin';

// Get user locale with multiple fallbacks
function getUserLocale(req) {
    // Priority order:
    // 1. Query parameter (for immediate switch)
    // 2. Session (persisted choice)
    // 3. Cookie (backup persistence)
    // 4. Default
    
    let locale = req.query.locale || 
                 req.session?.locale || 
                 req.cookies?.locale || 
                 defaultLocale;
    
    // Validate locale exists
    if (!availableLocales.includes(locale)) {
        locale = defaultLocale;
    }
    
    // Save to both session and cookie for persistence
    if (req.session) {
        req.session.locale = locale;
    }
    
    // Set cookie for 1 year
    if (req.cookies !== undefined) {
        req.res.cookie('locale', locale, {
            maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            httpOnly: false, // Allow JavaScript access for client-side
            sameSite: 'lax',
            path: '/'
        });
    }
    
    return locale;
}

// Translation function
function translate(locale, key, params = {}) {
    const keys = key.split('.');
    let value = locales[locale];
    
    if (!value) {
        console.warn(`Locale ${locale} not found, using default`);
        value = locales[defaultLocale];
    }
    
    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k];
        } else {
            break;
        }
    }
    
    if (typeof value !== 'string') {
        console.warn(`Translation key ${key} not found for locale ${locale}`);
        return key; // Return the key itself as fallback
    }
    
    // Replace parameters
    Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });
    
    return value;
}

// Middleware function
function localizationMiddleware(req, res, next) {
    const locale = getUserLocale(req);
    
    // Add translation function to locals for views
    res.locals.t = (key, params) => translate(locale, key, params);
    res.locals.locale = locale;
    res.locals.availableLocales = availableLocales;
    
    // Helper function to generate locale URLs
    res.locals.getLocaleUrl = (targetLocale) => {
        const url = new URL(req.originalUrl, `http://${req.headers.host}`);
        url.searchParams.set('locale', targetLocale);
        return url.pathname + url.search;
    };
    
    next();
}

// API endpoint for client-side translations
function translationsEndpoint(req, res) {
    const locale = getUserLocale(req);
    console.log(`[Localization API] Requested locale: ${locale}`);
    console.log(`[Localization API] Available locales: ${availableLocales.join(', ')}`);
    console.log(`[Localization API] Locales object has ${Object.keys(locales).length} entries`);
    
    const translations = locales[locale] || locales[defaultLocale];
    console.log(`[Localization API] Returning translations for ${locale}: ${translations ? Object.keys(translations).length + ' keys' : 'NONE'}`);
    
    res.json({
        locale: locale,
        translations: translations
    });
}

module.exports = {
    middleware: localizationMiddleware,
    translationsEndpoint,
    translate,
    locales,
    availableLocales,
    defaultLocale
};