/**
 * Test Setup Configuration
 * Configures the testing environment
 */

import 'reflect-metadata';
import { DIContainer } from '@/infrastructure/container/DIContainer';

// Global test setup
beforeAll(() => {
  // Setup environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = ':memory:';
  process.env.SESSION_SECRET = 'test-secret-key';
  process.env.PORT = '3001';
  
  // Initialize DI container for tests
  DIContainer.configure();
});

afterAll(() => {
  // Clean up after all tests
  DIContainer.clear();
});

// Increase timeout for integration tests
jest.setTimeout(30000);