/**
 * SIPAccount Repository Interface
 * Domain layer repository contract for SIPAccount entity
 */

import { SIPAccount, SIPAccountStatus, SIPTransport } from '../entities/SIPAccount';

export interface ISIPAccountRepository {
  // Basic CRUD operations
  findById(id: string): Promise<SIPAccount | null>;
  findByExtension(extension: string): Promise<SIPAccount | null>;
  findAll(): Promise<SIPAccount[]>;
  save(account: SIPAccount): Promise<SIPAccount>;
  update(id: string, account: Partial<SIPAccount>): Promise<SIPAccount | null>;
  delete(id: string): Promise<boolean>;
  
  // Status management
  findByStatus(status: SIPAccountStatus): Promise<SIPAccount[]>;
  findRegistered(): Promise<SIPAccount[]>;
  findUnregistered(): Promise<SIPAccount[]>;
  findActive(): Promise<SIPAccount[]>;
  updateStatus(id: string, status: SIPAccountStatus): Promise<boolean>;
  
  // Registration
  register(id: string, ipAddress: string, expires?: number): Promise<boolean>;
  unregister(id: string): Promise<boolean>;
  updateRegistration(id: string, ipAddress: string, expires: number): Promise<boolean>;
  findExpiredRegistrations(): Promise<SIPAccount[]>;
  
  // Default account
  findDefault(): Promise<SIPAccount | null>;
  setDefault(id: string): Promise<boolean>;
  unsetDefault(id: string): Promise<boolean>;
  
  // Transport
  findByTransport(transport: SIPTransport): Promise<SIPAccount[]>;
  
  // Call management
  incrementCallCount(id: string, direction: 'made' | 'received'): Promise<boolean>;
  updateActiveCallCount(id: string, count: number): Promise<boolean>;
  findAvailable(): Promise<SIPAccount[]>;
  findWithAvailableSlots(): Promise<SIPAccount[]>;
  
  // Statistics
  getCallStatistics(id: string): Promise<any>;
  getTotalCallStatistics(): Promise<any>;
  
  // Check existence
  exists(id: string): Promise<boolean>;
  existsByExtension(extension: string): Promise<boolean>;
  countTotal(): Promise<number>;
  countActive(): Promise<number>;
  countRegistered(): Promise<number>;
}