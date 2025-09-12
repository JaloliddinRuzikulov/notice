"use strict";
/**
 * Database Configuration
 * TypeORM configuration for different environments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = exports.productionConfig = exports.testConfig = exports.developmentConfig = void 0;
const EmployeeEntity_1 = require("../entities/EmployeeEntity");
const UserEntity_1 = require("../entities/UserEntity");
const GroupEntity_1 = require("../entities/GroupEntity");
const BroadcastEntity_1 = require("../entities/BroadcastEntity");
const CallEntity_1 = require("../entities/CallEntity");
const SIPAccountEntity_1 = require("../entities/SIPAccountEntity");
const AudioFileEntity_1 = require("../entities/AudioFileEntity");
const DepartmentEntity_1 = require("../entities/DepartmentEntity");
const DistrictEntity_1 = require("../entities/DistrictEntity");
const entities = [
    EmployeeEntity_1.EmployeeEntity,
    UserEntity_1.UserEntity,
    GroupEntity_1.GroupEntity,
    BroadcastEntity_1.BroadcastEntity,
    CallEntity_1.CallEntity,
    SIPAccountEntity_1.SIPAccountEntity,
    AudioFileEntity_1.AudioFileEntity,
    DepartmentEntity_1.DepartmentEntity,
    DistrictEntity_1.DistrictEntity,
];
exports.developmentConfig = {
    type: 'sqlite',
    database: process.env.DB_PATH || './data/notice_dev.db',
    entities,
    migrations: ['src/infrastructure/database/migrations/*.ts'],
    subscribers: ['src/infrastructure/database/subscribers/*.ts'],
    synchronize: true, // Only in development
    logging: ['query', 'error', 'warn'],
};
exports.testConfig = {
    type: 'sqlite',
    database: ':memory:',
    entities,
    migrations: ['src/infrastructure/database/migrations/*.ts'],
    subscribers: ['src/infrastructure/database/subscribers/*.ts'],
    synchronize: true,
    logging: false,
};
exports.productionConfig = (() => {
    const dbType = process.env.DB_TYPE || 'sqlite';
    if (dbType === 'sqlite') {
        return {
            type: 'sqlite',
            database: process.env.DB_PATH || './data/notice.db',
            entities,
            migrations: ['src/infrastructure/database/migrations/*.ts'],
            subscribers: ['src/infrastructure/database/subscribers/*.ts'],
            synchronize: false,
            logging: process.env.DB_LOGGING === 'true',
        };
    }
    else if (dbType === 'postgres') {
        return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_DATABASE || 'notice',
            entities,
            migrations: ['src/infrastructure/database/migrations/*.ts'],
            subscribers: ['src/infrastructure/database/subscribers/*.ts'],
            synchronize: false,
            logging: process.env.DB_LOGGING === 'true',
            ssl: process.env.DB_SSL === 'true',
            extra: {
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000,
            },
        };
    }
    else {
        return {
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_DATABASE || 'notice',
            entities,
            migrations: ['src/infrastructure/database/migrations/*.ts'],
            subscribers: ['src/infrastructure/database/subscribers/*.ts'],
            synchronize: false,
            logging: process.env.DB_LOGGING === 'true',
        };
    }
})();
const getDatabaseConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    switch (env) {
        case 'test':
            return exports.testConfig;
        case 'production':
            return exports.productionConfig;
        default:
            return exports.developmentConfig;
    }
};
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map