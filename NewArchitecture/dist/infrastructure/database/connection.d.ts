/**
 * Database Connection Manager
 * Manages TypeORM DataSource connection
 */
import { DataSource } from 'typeorm';
export declare class DatabaseConnection {
    private static instance;
    private dataSource;
    private constructor();
    static getInstance(): DatabaseConnection;
    connect(): Promise<DataSource>;
    disconnect(): Promise<void>;
    getDataSource(): DataSource;
    runMigrations(): Promise<void>;
    dropDatabase(): Promise<void>;
    synchronize(): Promise<void>;
}
export declare const databaseConnection: DatabaseConnection;
//# sourceMappingURL=connection.d.ts.map