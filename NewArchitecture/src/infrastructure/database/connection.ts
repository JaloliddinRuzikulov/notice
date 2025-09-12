/**
 * Database Connection Manager
 * Manages TypeORM DataSource connection
 */

import { DataSource } from 'typeorm';
import { getDatabaseConfig } from './config/database.config';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private dataSource: DataSource | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    try {
      const config = getDatabaseConfig();
      this.dataSource = new DataSource(config);
      await this.dataSource.initialize();
      
      console.log('✅ Database connected successfully');
      console.log(`📊 Database: ${config.type}`);
      
      return this.dataSource;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      this.dataSource = null;
      console.log('🔌 Database disconnected');
    }
  }

  public getDataSource(): DataSource {
    if (!this.dataSource?.isInitialized) {
      throw new Error('Database connection is not initialized. Call connect() first.');
    }
    return this.dataSource;
  }

  public async runMigrations(): Promise<void> {
    const dataSource = this.getDataSource();
    await dataSource.runMigrations();
    console.log('✅ Migrations completed');
  }

  public async dropDatabase(): Promise<void> {
    const dataSource = this.getDataSource();
    await dataSource.dropDatabase();
    console.log('⚠️ Database dropped');
  }

  public async synchronize(): Promise<void> {
    const dataSource = this.getDataSource();
    await dataSource.synchronize();
    console.log('✅ Database synchronized');
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();