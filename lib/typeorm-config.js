const { DataSource } = require('typeorm');
const path = require('path');

// Import entities
const User = require('./entities/User');
const Employee = require('./entities/Employee');
const SIPAccount = require('./entities/SIPAccount');
const BroadcastHistory = require('./entities/BroadcastHistory');
const Department = require('./entities/Department');
const District = require('./entities/District');
const Group = require('./entities/Group');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(__dirname, '../data/xabarnoma.db'),
    synchronize: false, // IMPORTANT: false for production, use migrations instead
    logging: process.env.NODE_ENV === 'development',
    entities: [
        User,
        Employee,
        SIPAccount,
        BroadcastHistory,
        Department,
        District,
        Group
    ]
});

let isInitialized = false;

async function initializeDatabase() {
    if (!isInitialized) {
        try {
            await AppDataSource.initialize();
            isInitialized = true;
            console.log('✅ TypeORM Data Source initialized');
        } catch (error) {
            console.error('❌ Error initializing TypeORM:', error);
            throw error;
        }
    }
    return AppDataSource;
}

module.exports = {
    AppDataSource,
    initializeDatabase
};
