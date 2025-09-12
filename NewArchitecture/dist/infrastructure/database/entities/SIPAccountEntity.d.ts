/**
 * SIPAccount Entity for TypeORM
 */
export declare enum SIPAccountStatusDB {
    REGISTERED = "registered",
    UNREGISTERED = "unregistered",
    REGISTERING = "registering",
    FAILED = "failed",
    SUSPENDED = "suspended"
}
export declare enum SIPTransportDB {
    UDP = "udp",
    TCP = "tcp",
    TLS = "tls",
    WS = "ws",
    WSS = "wss"
}
export declare class SIPAccountEntity {
    id: string;
    extension: string;
    username: string;
    password?: string;
    domain: string;
    proxy?: string;
    port: number;
    transport: SIPTransportDB;
    status: SIPAccountStatusDB;
    displayName?: string;
    isDefault: boolean;
    isActive: boolean;
    lastRegisteredAt?: Date;
    lastRegisteredIp?: string;
    registrationExpires: number;
    maxConcurrentCalls: number;
    currentActiveCalls: number;
    totalCallsMade: number;
    totalCallsReceived: number;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=SIPAccountEntity.d.ts.map