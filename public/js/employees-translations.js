// Employees page translation wrapper
// This file wraps hardcoded messages with translation support

(function() {
    'use strict';
    
    // Wait for LanguageManager to be available
    function waitForLanguageManager(callback) {
        if (typeof window.LanguageManager !== 'undefined') {
            callback();
        } else {
            setTimeout(() => waitForLanguageManager(callback), 100);
        }
    }
    
    waitForLanguageManager(() => {
        const t = window.LanguageManager.t;
        
        // Override alert and confirm with translated versions
        const originalAlert = window.alert;
        const originalConfirm = window.confirm;
        
        // Translated message mappings
        window.getTranslatedMessage = function(message) {
            const messageMap = {
                // Error messages
                'Xatolik yuz berdi': t('messages.error'),
                'Ma\'lumot kiriting!': t('messages.fill_all_fields'),
                'Barcha maydonlarni to\'ldiring!': t('messages.fill_all_fields'),
                'Ism kiriting': t('messages.enter_name'),
                'Telefon raqam kiriting': t('messages.enter_phone'),
                'Import xatosi': t('messages.import_error'),
                'Export xatosi': t('messages.export_error'),
                'Server bilan aloqa yo\'q': t('messages.server_error'),
                'Fayl tanlanmagan': t('messages.no_file_selected'),
                'Noto\'g\'ri fayl formati': t('messages.invalid_file_format'),
                
                // Success messages
                'Muvaffaqiyatli saqlandi': t('messages.success'),
                'Xodim qo\'shildi': t('messages.employee_added'),
                'Xodim yangilandi': t('messages.employee_updated'),
                'Xodim o\'chirildi': t('messages.employee_deleted'),
                'Import muvaffaqiyatli': t('messages.import_success'),
                'Export muvaffaqiyatli': t('messages.export_success'),
                
                // Loading/Progress
                'Yuklanmoqda...': t('messages.loading'),
                'Saqlanmoqda...': t('messages.saving'),
                
                // Confirmation
                'Rostdan ham o\'chirmoqchimisiz?': t('messages.confirm_delete'),
                'O\'chirishni tasdiqlaysizmi?': t('messages.confirm_delete'),
                
                // Validation
                'Telefon raqam noto\'g\'ri': t('messages.invalid_phone'),
                'Email noto\'g\'ri': t('messages.invalid_email'),
                
                // Default fallback
                'default': message
            };
            
            // Find matching translation or return original
            for (const [key, translation] of Object.entries(messageMap)) {
                if (message.includes(key)) {
                    return message.replace(key, translation);
                }
            }
            
            return messageMap[message] || message;
        };
        
        // Override alert
        window.alert = function(message) {
            if (typeof message === 'string') {
                message = window.getTranslatedMessage(message);
            }
            return originalAlert(message);
        };
        
        // Override confirm
        window.confirm = function(message) {
            if (typeof message === 'string') {
                message = window.getTranslatedMessage(message);
            }
            return originalConfirm(message);
        };
        
        // Update static text elements with data-translate attribute
        function updateStaticTranslations() {
            // Modal titles
            const addModalTitle = document.querySelector('#employeeModal .md-dialog-title');
            if (addModalTitle && !addModalTitle.hasAttribute('data-translate')) {
                addModalTitle.setAttribute('data-translate', 'employees.add_new');
            }
            
            // Buttons
            const saveButtons = document.querySelectorAll('button[onclick*="saveEmployee"]');
            saveButtons.forEach(btn => {
                if (!btn.hasAttribute('data-translate')) {
                    btn.setAttribute('data-translate', 'buttons.save');
                }
            });
            
            const cancelButtons = document.querySelectorAll('button[onclick*="close"]');
            cancelButtons.forEach(btn => {
                if (!btn.hasAttribute('data-translate')) {
                    btn.setAttribute('data-translate', 'buttons.cancel');
                }
            });
            
            // Form labels
            const labels = {
                'employeeName': 'employees.name',
                'employeePosition': 'employees.position',
                'employeeRank': 'employees.rank',
                'employeeDepartment': 'employees.department',
                'employeePhone': 'employees.phone',
                'employeeServicePhone': 'employees.service_phone',
                'employeeDistrict': 'employees.district'
            };
            
            Object.entries(labels).forEach(([id, translationKey]) => {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label && !label.hasAttribute('data-translate')) {
                    label.setAttribute('data-translate', translationKey);
                }
            });
            
            // Update translations
            if (window.LanguageManager && window.LanguageManager.updateTranslatedElements) {
                window.LanguageManager.updateTranslatedElements();
            }
        }
        
        // Run on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateStaticTranslations);
        } else {
            updateStaticTranslations();
        }
        
        // Also update when modals are shown
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('active') || target.classList.contains('show')) {
                        setTimeout(updateStaticTranslations, 100);
                    }
                }
            });
        });
        
        // Observe modal elements
        const modals = document.querySelectorAll('.md-dialog, .modal');
        modals.forEach(modal => {
            observer.observe(modal, { attributes: true });
        });
    });
})();