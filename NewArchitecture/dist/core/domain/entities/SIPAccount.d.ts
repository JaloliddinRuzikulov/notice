/**
 * SIPAccount Domain Entity
 * Represents SIP extensions/accounts for VoIP communication
 */
export declare enum SIPAccountStatus {
    REGISTERED = "registered",
    UNREGISTERED = "unregistered",
    REGISTERING = "registering",
    FAILED = "failed",
    SUSPENDED = "suspended"
}
export declare enum SIPTransport {
    UDP = "udp",
    TCP = "tcp",
    TLS = "tls",
    WS = "ws",
    WSS = "wss"
}
export interface SIPAccountProps {
    id?: string;
    extension: string;
    username: string;
    password?: string;
    domain: string;
    proxy?: string;
    port: number;
    transport: SIPTransport;
    status: SIPAccountStatus;
    displayName?: string;
    isDefault: boolean;
    isActive: boolean;
    lastRegisteredAt?: Date;
    lastRegisteredIp?: string;
    registrationExpires?: number;
    maxConcurrentCalls?: number;
    currentActiveCalls?: number;
    totalCallsMade?: number;
    totalCallsReceived?: number;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class SIPAccount {
    private readonly _id?;
    private _extension;
    private _username;
    private _password?;
    private _domain;
    private _proxy?;
    private _port;
    private _transport;
    private _status;
    private _displayName?;
    private _isDefault;
    private _isActive;
    private _lastRegisteredAt?;
    private _lastRegisteredIp?;
    private _registrationExpires?;
    private _maxConcurrentCalls;
    private _currentActiveCalls;
    private _totalCallsMade;
    private _totalCallsReceived;
    private _metadata?;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: SIPAccountProps);
    get id(): string | undefined;
    get extension(): string;
    get username(): string;
    get password(): string | undefined;
    get domain(): string;
    get proxy(): string | undefined;
    get port(): number;
    get transport(): SIPTransport;
    get status(): SIPAccountStatus;
    get displayName(): string | undefined;
    get isDefault(): boolean;
    get isActive(): boolean;
    get lastRegisteredAt(): Date | undefined;
    get lastRegisteredIp(): string | undefined;
    get registrationExpires(): number | undefined;
    get maxConcurrentCalls(): number;
    get currentActiveCalls(): number;
    get totalCallsMade(): number;
    get totalCallsReceived(): number;
    get metadata(): Record<string, any> | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateCredentials(username: string, password: string): void;
    updatePassword(password: string): void;
    updateDisplayName(displayName: string | undefined): void;
    updateTransport(transport: SIPTransport): void;
    updateProxy(proxy: string | undefined, port?: number): void;
    setAsDefault(): void;
    unsetAsDefault(): void;
    activate(): void;
    deactivate(): void;
    suspend(): void;
    startRegistration(): void;
    completeRegistration(ipAddress: string, expires?: number): void;
    failRegistration(reason?: string): void;
    unregister(): void;
    startCall(): void;
    receiveCall(): void;
    endCall(): void;
    resetCallCount(): void;
    updateMaxConcurrentCalls(max: number): void;
    updateMetadata(key: string, value: any): void;
    private validateProps;
    private updateTimestamp;
    isRegistered(): boolean;
    isAvailable(): boolean;
    canMakeCall(): boolean;
    hasAvailableSlots(): number;
    isRegistrationExpired(): boolean;
    getSipUri(): string;
    getProxyUri(): string;
    static create(props: SIPAccountProps): SIPAccount;
    toObject(): SIPAccountProps;
}
//# sourceMappingURL=SIPAccount.d.ts.map