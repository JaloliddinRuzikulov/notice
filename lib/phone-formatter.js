/**
 * Phone number formatter for Uzbekistan numbers with ATS support
 */
class PhoneFormatter {
    /**
     * Format phone number for storage (99XXXXXXXXX format)
     * @param {string} phoneNumber - Input phone number
     * @returns {string} - Formatted phone number or null if invalid
     */
    static formatPhoneNumber(phoneNumber) {
        if (!phoneNumber) return null;
        
        // Remove all non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // Handle different formats
        if (cleaned.startsWith('998')) {
            // International format - remove 998 to get 99XXXXXXXXX
            cleaned = cleaned.substring(3);
        } else if (cleaned.startsWith('0')) {
            // Local format with 0 prefix - just remove the 0
            cleaned = cleaned.substring(1);
        }
        
        // Should be 9 digits starting with 99, 98, 97, 93, 94, 95, 90, 91, 88, 33, etc.
        if (cleaned.length === 9 && /^(99|98|97|93|94|95|90|91|88|77|75|33)/.test(cleaned)) {
            return cleaned;
        }
        
        console.warn(`Invalid phone number format: ${phoneNumber} -> ${cleaned}`);
        return null;
    }
    
    /**
     * Format phone number for ATS dialing (no prefix needed)
     * @param {string} phoneNumber - Phone number (99XXXXXXXXX format)
     * @returns {string} - ATS formatted number (99XXXXXXXXX)
     */
    static formatForATS(phoneNumber) {
        if (!phoneNumber) return null;
        
        // Remove any non-digits
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // If has 0 prefix, remove it
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // Return without any prefix
        return cleaned;
    }
    
    /**
     * Validate phone number format
     * @param {string} phoneNumber - Phone number to validate
     * @returns {boolean} - True if valid
     */
    static isValidPhoneNumber(phoneNumber) {
        const formatted = this.formatPhoneNumber(phoneNumber);
        return formatted !== null;
    }
    
    /**
     * Format for display (0XX XXX XX XX)
     * @param {string} phoneNumber - Phone number to format
     * @returns {string} - Display formatted number
     */
    static formatForDisplay(phoneNumber) {
        const formatted = this.formatPhoneNumber(phoneNumber);
        if (!formatted) return phoneNumber;
        
        // Add 0 prefix if not present
        const localNumber = formatted.startsWith('0') ? formatted : '0' + formatted;
        // Format as 0XX XXX XX XX
        return localNumber.replace(/^0(\d{2})(\d{3})(\d{2})(\d{2})$/, '0$1 $2 $3 $4');
    }
    
    /**
     * Alias for formatPhoneNumber for backward compatibility
     */
    static format(phoneNumber) {
        return PhoneFormatter.formatPhoneNumber(phoneNumber);
    }
}

module.exports = PhoneFormatter;