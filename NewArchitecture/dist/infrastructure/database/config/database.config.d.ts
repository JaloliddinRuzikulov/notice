/**
 * Database Configuration
 * TypeORM configuration for different environments
 */
import { DataSourceOptions } from 'typeorm';
export declare const developmentConfig: DataSourceOptions;
export declare const testConfig: DataSourceOptions;
export declare const productionConfig: DataSourceOptions;
export declare const getDatabaseConfig: () => DataSourceOptions;
//# sourceMappingURL=database.config.d.ts.map