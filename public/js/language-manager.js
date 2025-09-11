// Language Manager - Client-side translation system
(function() {
    'use strict';
    
    let translations = {};
    let currentLocale = 'uz-latin';
    
    // Fallback translations for Uzbek (Latin)
    const fallbackTranslations = {
        'uz-latin': {
            app: {
                title: "Qashqadaryo IIB Xabarnoma Tizimi",
                welcome: "Xush kelibsiz"
            },
            navigation: {
                dashboard: "Bosh sahifa",
                broadcast: "Xabarnoma",
                employees: "Xodimlar",
                reports: "Hisobotlar",
                settings: "Sozlamalar",
                logout: "Chiqish"
            },
            dashboard: {
                subtitle: "Qashqadaryo IIB xabarnoma tizimi boshqaruv paneli",
                system_statistics: "Tizim statistikasi",
                quick_actions: "Tezkor harakatlar",
                recent_broadcasts: "Oxirgi xabarlar",
                recent_broadcasts_subtitle: "So'nggi yuborilgan xabarlar ro'yxati"
            },
            buttons: {
                add: "Qo'shish",
                edit: "Tahrirlash",
                delete: "O'chirish",
                save: "Saqlash",
                cancel: "Bekor qilish",
                search: "Qidirish"
            },
            employees: {
                title: "Xodimlar",
                add_employee: "Xodim qo'shish",
                edit_employee: "Xodimni tahrirlash",
                search_placeholder: "Ism, familiya yoki telefon raqami bo'yicha qidirish..."
            },
            language: {
                uz_latin: "O'zbek (lotin)",
                uz_cyrillic: "Ўзбек (кирилл)",
                ru: "Русский",
                uz_latin_short: "O'zb",
                uz_cyrillic_short: "Ўзб",
                ru_short: "Рус"
            }
        },
        'ru': {
            app: {
                title: "Система оповещения Кашкадарьинского УВД",
                welcome: "Добро пожаловать"
            },
            navigation: {
                dashboard: "Главная",
                broadcast: "Оповещение",
                employees: "Сотрудники",
                reports: "Отчеты",
                settings: "Настройки",
                logout: "Выход"
            },
            language: {
                uz_latin: "Узбекский (латиница)",
                uz_cyrillic: "Узбекский (кириллица)",
                ru: "Русский",
                uz_latin_short: "Узб",
                uz_cyrillic_short: "Узб",
                ru_short: "Рус"
            }
        }
    };
    
    // Load translations from API
    async function loadTranslations() {
        try {
            const response = await fetch('/api/translations');
            const data = await response.json();
            
            // Use API translations if available, otherwise use fallback
            if (data.translations && Object.keys(data.translations).length > 0) {
                translations = data.translations;
            } else {
                console.warn('No translations from API, using fallback');
                translations = fallbackTranslations[data.locale || 'uz-latin'] || fallbackTranslations['uz-latin'];
            }
            currentLocale = data.locale || 'uz-latin';
            
            // Save to localStorage for offline access
            localStorage.setItem('locale', currentLocale);
            localStorage.setItem('translations_' + currentLocale, JSON.stringify(translations));
            
            return true;
        } catch (error) {
            console.error('Failed to load translations:', error);
            
            // Try to load from localStorage
            const savedLocale = localStorage.getItem('locale');
            if (savedLocale) {
                currentLocale = savedLocale;
                const savedTranslations = localStorage.getItem('translations_' + savedLocale);
                if (savedTranslations) {
                    try {
                        translations = JSON.parse(savedTranslations);
                        return true;
                    } catch (e) {
                        console.error('Failed to parse saved translations:', e);
                    }
                }
            }
            
            // Use fallback translations as last resort
            console.warn('Using fallback translations');
            translations = fallbackTranslations[currentLocale] || fallbackTranslations['uz-latin'];
            return true;
        }
    }
    
    // Translation function
    function t(key, params = {}) {
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                break;
            }
        }
        
        if (typeof value !== 'string') {
            console.warn(`Translation key ${key} not found`);
            return key; // Return key as fallback
        }
        
        // Replace parameters
        Object.keys(params).forEach(param => {
            value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });
        
        return value;
    }
    
    // Change language
    async function changeLanguage(locale) {
        // Save choice immediately
        localStorage.setItem('locale', locale);
        
        // Set cookie for server-side
        document.cookie = `locale=${locale};path=/;max-age=${365*24*60*60}`;
        
        // Reload page with new locale
        const url = new URL(window.location.href);
        url.searchParams.set('locale', locale);
        window.location.href = url.toString();
    }
    
    // Update all elements with data-translate attribute
    function updateTranslatedElements() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = t(key);
            if (translation && translation !== key) {
                element.textContent = translation;
            }
        });
        
        // Update placeholders
        const placeholders = document.querySelectorAll('[data-translate-placeholder]');
        placeholders.forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = t(key);
            if (translation && translation !== key) {
                element.placeholder = translation;
            }
        });
        
        // Update titles
        const titles = document.querySelectorAll('[data-translate-title]');
        titles.forEach(element => {
            const key = element.getAttribute('data-translate-title');
            const translation = t(key);
            if (translation && translation !== key) {
                element.title = translation;
            }
        });
    }
    
    // Initialize on page load
    async function init() {
        await loadTranslations();
        updateTranslatedElements();
        
        // Update language switcher if exists
        const switcher = document.querySelector('.language-switcher select');
        if (switcher) {
            switcher.value = currentLocale;
            switcher.addEventListener('change', (e) => {
                changeLanguage(e.target.value);
            });
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export for global use
    window.LanguageManager = {
        t: t,
        changeLanguage: changeLanguage,
        updateTranslatedElements: updateTranslatedElements,
        getCurrentLocale: () => currentLocale,
        getTranslations: () => translations
    };
})();