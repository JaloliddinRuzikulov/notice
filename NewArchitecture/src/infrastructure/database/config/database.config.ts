/**
 * Database Configuration
 * TypeORM configuration for different environments
 */

import { DataSourceOptions } from 'typeorm';
import { EmployeeEntity } from '../entities/EmployeeEntity';
import { UserEntity } from '../entities/UserEntity';
import { GroupEntity } from '../entities/GroupEntity';
import { BroadcastEntity } from '../entities/BroadcastEntity';
import { CallEntity } from '../entities/CallEntity';
import { SIPAccountEntity } from '../entities/SIPAccountEntity';
import { AudioFileEntity } from '../entities/AudioFileEntity';
import { DepartmentEntity } from '../entities/DepartmentEntity';
import { DistrictEntity } from '../entities/DistrictEntity';

const entities = [
  EmployeeEntity,
  UserEntity,
  GroupEntity,
  BroadcastEntity,
  CallEntity,
  SIPAccountEntity,
  AudioFileEntity,
  DepartmentEntity,
  DistrictEntity,
];

export const developmentConfig: DataSourceOptions = {
  type: 'sqlite',
  database: process.env.DB_PATH || './data/notice_dev.db',
  entities,
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  subscribers: ['src/infrastructure/database/subscribers/*.ts'],
  synchronize: true, // Only in development
  logging: ['query', 'error', 'warn'],
};

export const testConfig: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities,
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  subscribers: ['src/infrastructure/database/subscribers/*.ts'],
  synchronize: true,
  logging: false,
};

export const productionConfig: DataSourceOptions = (() => {
  const dbType = process.env.DB_TYPE || 'sqlite';
  
  if (dbType === 'sqlite') {
    return {
      type: 'sqlite' as const,
      database: process.env.DB_PATH || './data/notice.db',
      entities,
      migrations: ['src/infrastructure/database/migrations/*.ts'],
      subscribers: ['src/infrastructure/database/subscribers/*.ts'],
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
    };
  } else if (dbType === 'postgres') {
    return {
      type: 'postgres' as const,
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
  } else {
    return {
      type: 'mysql' as const,
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

export const getDatabaseConfig = (): DataSourceOptions => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      return testConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
};