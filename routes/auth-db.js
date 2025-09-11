const bcrypt = require('bcrypt');
const db = require('../lib/database');

async function authenticateUser(username, password) {
    try {
        // Get user from database
        const user = await db.get(
            'SELECT * FROM users WHERE username = ? AND active = 1',
            [username]
        );
        
        if (!user) {
            return { success: false, message: 'Foydalanuvchi topilmadi' };
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return { success: false, message: 'Noto\'g\'ri parol' };
        }
        
        // Update last login
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );
        
        // Parse JSON fields
        user.permissions = JSON.parse(user.permissions || '{}');
        user.allowedDistricts = JSON.parse(user.allowed_districts || '[]');
        
        return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                permissions: user.permissions,
                allowedDistricts: user.allowedDistricts
            }
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, message: 'Tizim xatoligi' };
    }
}

module.exports = { authenticateUser };