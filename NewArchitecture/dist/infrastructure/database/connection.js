"use strict";
/**
 * Database Connection Manager
 * Manages TypeORM DataSource connection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConnection = exports.DatabaseConnection = void 0;
const typeorm_1 = require("typeorm");
const database_config_1 = require("./config/database.config");
class DatabaseConnection {
    static instance;
    dataSource = null;
    constructor() { }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async connect() {
        if (this.dataSource?.isInitialized) {
            return this.dataSource;
        }
        try {
            const config = (0, database_config_1.getDatabaseConfig)();
            this.dataSource = new typeorm_1.DataSource(config);
            await this.dataSource.initialize();
            console.log('✅ Database connected successfully');
            console.log(`📊 Database: ${config.type}`);
            return this.dataSource;
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        if (this.dataSource?.isInitialized) {
            await this.dataSource.destroy();
            this.dataSource = null;
            console.log('🔌 Database disconnected');
        }
    }
    getDataSource() {
        if (!this.dataSource?.isInitialized) {
            throw new Error('Database connection is not initialized. Call connect() first.');
        }
        return this.dataSource;
    }
    async runMigrations() {
        const dataSource = this.getDataSource();
        await dataSource.runMigrations();
        console.log('✅ Migrations completed');
    }
    async dropDatabase() {
        const dataSource = this.getDataSource();
        await dataSource.dropDatabase();
        console.log('⚠️ Database dropped');
    }
    async synchronize() {
        const dataSource = this.getDataSource();
        await dataSource.synchronize();
        console.log('✅ Database synchronized');
    }
}
exports.DatabaseConnection = DatabaseConnection;
// Export singleton instance
exports.databaseConnection = DatabaseConnection.getInstance();
//# sourceMappingURL=connection.js.map