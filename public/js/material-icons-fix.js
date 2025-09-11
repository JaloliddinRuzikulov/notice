// Material Icons Fix for Offline/Closed Network
(function() {
    'use strict';
    
    // Icon mappings - text to Unicode/Emoji
    const iconMap = {
        'edit': '✏️',
        'delete': '🗑️',
        'add': '➕',
        'person_add': '➕',
        'search': '🔍',
        'phone': '📞',
        'call': '📞',
        'group': '👥',
        'groups': '👥',
        'people': '👥',
        'supervisor_account': '👥',
        'person': '👤',
        'home': '🏠',
        'settings': '⚙️',
        'logout': '⬅️',
        'dashboard': '📊',
        'broadcast': '📢',
        'campaign': '📢',
        'report': '📋',
        'assessment': '📋',
        'file_upload': '📤',
        'file_download': '📥',
        'download': '⬇️',
        'description': '📄',
        'check': '✅',
        'check_circle': '✅',
        'close': '❌',
        'arrow_back': '⬅️',
        'arrow_forward': '➡️',
        'expand_more': '▼',
        'expand_less': '▲',
        'menu': '☰',
        'more_vert': '⋮',
        'filter_list': '🔽',
        'warning': '⚠️',
        'info': 'ℹ️',
        'error': '❌',
        'account_tree': '🌳',
        'domain': '🏢',
        'business': '🏢',
        'location_city': '🏙️',
        'save': '💾',
        'visibility': '👁️',
        'visibility_off': '🚫',
        'chevron_right': '›',
        'chevron_left': '‹',
        'group_off': '👥',
        // New icons added
        'admin_panel_settings': '🛡️',
        'bar_chart': '📊',
        'cell_tower': '📡',
        'chat': '💬',
        'contact_phone': '☎️',
        'corporate_fare': '🏢',
        'dark_mode': '🌙',
        'dialpad': '📱',
        'group_work': '👨‍👩‍👧‍👦',
        'language': '🌐',
        'layers': '📚',
        'light_mode': '☀️',
        'location_on': '📍',
        'login': '🔐',
        'mic': '🎤',
        'person_check': '✅',
        'phone_in_talk': '📞',
        'play_arrow': '▶️',
        'refresh': '🔄',
        'send': '📤',
        'sms': '💬',
        'upload': '📤',
        'volume_up': '🔊',
        'work': '💼'
    };

    // Simple text icons as fallback
    const textIconMap = {
        'edit': 'E',
        'delete': 'D',
        'add': '+',
        'person_add': '+',
        'search': 'S',
        'phone': 'P',
        'call': 'C',
        'group': 'G',
        'groups': 'G',
        'people': 'P',
        'supervisor_account': 'SA',
        'person': 'P',
        'home': 'H',
        'settings': 'S',
        'logout': 'L',
        'dashboard': 'D',
        'broadcast': 'B',
        'campaign': 'C',
        'report': 'R',
        'assessment': 'A',
        'file_upload': 'U',
        'file_download': 'D',
        'download': 'D',
        'description': 'F',
        'check': '✓',
        'check_circle': '✓',
        'close': '✕',
        'arrow_back': '←',
        'arrow_forward': '→',
        'expand_more': '▼',
        'expand_less': '▲',
        'menu': '☰',
        'more_vert': '⋮',
        'filter_list': 'F',
        'warning': '!',
        'info': 'i',
        'error': '!',
        'account_tree': 'T',
        'domain': 'D',
        'business': 'B',
        'location_city': 'C',
        'save': 'S',
        'visibility': 'V',
        'visibility_off': 'H',
        'chevron_right': '›',
        'chevron_left': '‹',
        'group_off': 'GO',
        // New text fallbacks
        'admin_panel_settings': 'A',
        'bar_chart': 'B',
        'cell_tower': 'T',
        'chat': 'C',
        'contact_phone': 'CP',
        'corporate_fare': 'CF',
        'dark_mode': 'DM',
        'dialpad': 'DP',
        'group_work': 'GW',
        'language': 'L',
        'layers': 'LY',
        'light_mode': 'LM',
        'location_on': 'L',
        'login': 'IN',
        'mic': 'M',
        'person_check': 'PC',
        'phone_in_talk': 'PT',
        'play_arrow': '►',
        'refresh': 'R',
        'send': 'S',
        'sms': 'SM',
        'upload': 'UP',
        'volume_up': 'V',
        'work': 'W'
    };

    function replaceIcons() {
        // Find all material icon elements
        const iconElements = document.querySelectorAll('.material-symbols-outlined, .material-icons');
        
        iconElements.forEach(element => {
            // Skip if already processed
            if (element.dataset.processed === 'true') return;
            
            // Get icon name from text content
            const iconText = element.textContent.trim().toLowerCase();
            
            if (iconText) {
                // Try to use emoji first
                const emojiIcon = iconMap[iconText];
                const textIcon = textIconMap[iconText];
                
                if (emojiIcon) {
                    // Use emoji icon
                    element.textContent = emojiIcon;
                    element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                    element.style.fontSize = '20px';
                    element.style.lineHeight = '24px';
                } else if (textIcon) {
                    // Use text fallback
                    element.textContent = textIcon;
                    element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                    element.style.fontSize = '18px';
                    element.style.fontWeight = 'bold';
                    element.style.lineHeight = '24px';
                    element.style.backgroundColor = '#f0f0f0';
                    element.style.borderRadius = '4px';
                    element.style.padding = '2px 4px';
                    element.style.display = 'inline-flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.minWidth = '24px';
                    element.style.minHeight = '24px';
                } else {
                    // Unknown icon - show first letter
                    const firstLetter = iconText.charAt(0).toUpperCase();
                    element.textContent = firstLetter;
                    element.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                    element.style.fontSize = '16px';
                    element.style.fontWeight = 'bold';
                    element.style.lineHeight = '24px';
                    element.style.backgroundColor = '#e0e0e0';
                    element.style.borderRadius = '50%';
                    element.style.padding = '4px';
                    element.style.display = 'inline-flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.width = '24px';
                    element.style.height = '24px';
                }
                
                // Mark as processed
                element.dataset.processed = 'true';
                element.dataset.originalIcon = iconText;
            }
        });
    }

    // Run immediately
    replaceIcons();

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceIcons);
    }

    // Run less frequently to reduce CPU usage (was 500ms, now 2000ms)
    setInterval(replaceIcons, 2000);

    // Also observe for new elements
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            let shouldReplace = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    shouldReplace = true;
                }
            });
            if (shouldReplace) {
                replaceIcons();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Export for debugging
    window.materialIconsFix = {
        replaceIcons: replaceIcons,
        iconMap: iconMap
    };
})();