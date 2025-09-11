const axios = require('axios');

class SMSGateway {
    constructor() {
        // PlayMobile SMS gateway credentials
        this.baseUrl = process.env.SMS_API_URL || 'https://notify.eskiz.uz/api';
        this.login = process.env.SMS_LOGIN || 'roziqulovjahongir05@gmail.com';
        this.password = process.env.SMS_PASSWORD || 'k4bZVa6MEC1HP8mX2m9VvjEat51Pudn6IiVsSAbx';
        
        // Check if credentials are configured
        if (!this.login || !this.password) {
            console.warn('WARNING: SMS gateway credentials not configured. Please set SMS_LOGIN and SMS_PASSWORD in .env file');
            console.warn('SMS functionality will be disabled until credentials are configured.');
        }
        this.token = null;
        this.tokenExpiry = null;
    }

    // Get authentication token
    async authenticate() {
        // Check if credentials exist
        if (!this.login || !this.password) {
            throw new Error('SMS credentials not configured');
        }
        
        try {
            // Check if token is still valid
            if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
                return this.token;
            }

            const response = await axios.post(`${this.baseUrl}/auth/login`, {
                email: this.login,
                password: this.password
            });

            if (response.data && response.data.data && response.data.data.token) {
                this.token = response.data.data.token;
                // Token valid for 30 days
                this.tokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                console.log('SMS Gateway authenticated successfully');
                return this.token;
            } else {
                throw new Error('Invalid authentication response');
            }
        } catch (error) {
            console.error('SMS Gateway authentication failed:', error.message);
            throw error;
        }
    }

    // Format phone number for SMS gateway
    formatPhoneNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');
        
        // Remove leading 0 if present
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // Add country code if not present
        if (!cleaned.startsWith('998')) {
            cleaned = '998' + cleaned;
        }
        
        return cleaned;
    }

    // Send SMS message
    async sendSMS(phone, message) {
        try {
            const token = await this.authenticate();
            const formattedPhone = this.formatPhoneNumber(phone);

            // Check if in test mode
            const isTestMode = process.env.SMS_TEST_MODE === 'true';
            
            // In test mode, use predefined test message
            const smsText = isTestMode ? 'Bu Eskiz dan test' : message;
            
            if (isTestMode) {
                console.log(`SMS TEST MODE: ${formattedPhone} - Original: "${message}" - Test: "${smsText}"`);
            } else {
                console.log(`SMS PRODUCTION: ${formattedPhone} - Message: "${smsText}"`);
            }

            const response = await axios.post(
                `${this.baseUrl}/message/sms/send`,
                {
                    mobile_phone: formattedPhone,
                    message: smsText,
                    from: '4546' // Eskiz.uz default sender ID
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && (response.data.status === 'waiting' || response.data.message === 'Waiting for SMS provider')) {
                console.log(`SMS sent successfully to ${formattedPhone}`);
                console.log(`SMS ID: ${response.data.id}, Status: ${response.data.status || 'waiting'}`);
                return {
                    success: true,
                    messageId: response.data.id,
                    status: response.data.status || 'waiting',
                    testMode: isTestMode // Dynamic test mode indicator
                };
            } else {
                throw new Error('SMS sending failed: ' + (response.data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(`Failed to send SMS to ${phone}:`, error.message);
            if (error.response) {
                console.error('SMS API Error Response:', error.response.data);
                console.error('SMS API Status:', error.response.status);
            }
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Send bulk SMS
    async sendBulkSMS(phones, message) {
        const results = [];
        
        for (const phone of phones) {
            const result = await this.sendSMS(phone, message);
            results.push({
                phone,
                ...result
            });
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    }

    // Check SMS status
    async checkStatus(messageId) {
        try {
            const token = await this.authenticate();

            const response = await axios.get(
                `${this.baseUrl}/message/sms/status/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error(`Failed to check SMS status for ${messageId}:`, error.message);
            return null;
        }
    }
}

module.exports = new SMSGateway();