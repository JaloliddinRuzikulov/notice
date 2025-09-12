/**
 * SIPAccount Repository Interface
 * Domain layer repository contract for SIPAccount entity
 */
import { SIPAccount, SIPAccountStatus, SIPTransport } from '../entities/SIPAccount';
export interface ISIPAccountRepository {
    findById(id: string): Promise<SIPAccount | null>;
    findByExtension(extension: string): Promise<SIPAccount | null>;
    findAll(): Promise<SIPAccount[]>;
    save(account: SIPAccount): Promise<SIPAccount>;
    update(id: string, account: Partial<SIPAccount>): Promise<SIPAccount | null>;
    delete(id: string): Promise<boolean>;
    findByStatus(status: SIPAccountStatus): Promise<SIPAccount[]>;
    findRegistered(): Promise<SIPAccount[]>;
    findUnregistered(): Promise<SIPAccount[]>;
    findActive(): Promise<SIPAccount[]>;
    updateStatus(id: string, status: SIPAccountStatus): Promise<boolean>;
    register(id: string, ipAddress: string, expires?: number): Promise<boolean>;
    unregister(id: string): Promise<boolean>;
    updateRegistration(id: string, ipAddress: string, expires: number): Promise<boolean>;
    findExpiredRegistrations(): Promise<SIPAccount[]>;
    findDefault(): Promise<SIPAccount | null>;
    setDefault(id: string): Promise<boolean>;
    unsetDefault(id: string): Promise<boolean>;
    findByTransport(transport: SIPTransport): Promise<SIPAccount[]>;
    incrementCallCount(id: string, direction: 'made' | 'received'): Promise<boolean>;
    updateActiveCallCount(id: string, count: number): Promise<boolean>;
    findAvailable(): Promise<SIPAccount[]>;
    findWithAvailableSlots(): Promise<SIPAccount[]>;
    getCallStatistics(id: string): Promise<any>;
    getTotalCallStatistics(): Promise<any>;
    exists(id: string): Promise<boolean>;
    existsByExtension(extension: string): Promise<boolean>;
    countTotal(): Promise<number>;
    countActive(): Promise<number>;
    countRegistered(): Promise<number>;
}
//# sourceMappingURL=ISIPAccountRepository.d.ts.map