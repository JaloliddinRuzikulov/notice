/**
 * SIPAccount Domain Entity
 * Represents SIP extensions/accounts for VoIP communication
 */

export enum SIPAccountStatus {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered',
  REGISTERING = 'registering',
  FAILED = 'failed',
  SUSPENDED = 'suspended'
}

export enum SIPTransport {
  UDP = 'udp',
  TCP = 'tcp',
  TLS = 'tls',
  WS = 'ws',
  WSS = 'wss'
}

export interface SIPAccountProps {
  id?: string;
  extension: string;
  username: string;
  password?: string; // encrypted
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
  registrationExpires?: number; // seconds
  maxConcurrentCalls?: number;
  currentActiveCalls?: number;
  totalCallsMade?: number;
  totalCallsReceived?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SIPAccount {
  private readonly _id?: string;
  private _extension: string;
  private _username: string;
  private _password?: string;
  private _domain: string;
  private _proxy?: string;
  private _port: number;
  private _transport: SIPTransport;
  private _status: SIPAccountStatus;
  private _displayName?: string;
  private _isDefault: boolean;
  private _isActive: boolean;
  private _lastRegisteredAt?: Date;
  private _lastRegisteredIp?: string;
  private _registrationExpires?: number;
  private _maxConcurrentCalls: number;
  private _currentActiveCalls: number;
  private _totalCallsMade: number;
  private _totalCallsReceived: number;
  private _metadata?: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: SIPAccountProps) {
    this.validateProps(props);
    
    this._id = props.id;
    this._extension = props.extension;
    this._username = props.username;
    this._password = props.password;
    this._domain = props.domain;
    this._proxy = props.proxy;
    this._port = props.port;
    this._transport = props.transport;
    this._status = props.status;
    this._displayName = props.displayName;
    this._isDefault = props.isDefault ?? false;
    this._isActive = props.isActive ?? true;
    this._lastRegisteredAt = props.lastRegisteredAt;
    this._lastRegisteredIp = props.lastRegisteredIp;
    this._registrationExpires = props.registrationExpires ?? 3600;
    this._maxConcurrentCalls = props.maxConcurrentCalls ?? 5;
    this._currentActiveCalls = props.currentActiveCalls ?? 0;
    this._totalCallsMade = props.totalCallsMade ?? 0;
    this._totalCallsReceived = props.totalCallsReceived ?? 0;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get extension(): string {
    return this._extension;
  }

  get username(): string {
    return this._username;
  }

  get password(): string | undefined {
    return this._password;
  }

  get domain(): string {
    return this._domain;
  }

  get proxy(): string | undefined {
    return this._proxy;
  }

  get port(): number {
    return this._port;
  }

  get transport(): SIPTransport {
    return this._transport;
  }

  get status(): SIPAccountStatus {
    return this._status;
  }

  get displayName(): string | undefined {
    return this._displayName;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastRegisteredAt(): Date | undefined {
    return this._lastRegisteredAt;
  }

  get lastRegisteredIp(): string | undefined {
    return this._lastRegisteredIp;
  }

  get registrationExpires(): number | undefined {
    return this._registrationExpires;
  }

  get maxConcurrentCalls(): number {
    return this._maxConcurrentCalls;
  }

  get currentActiveCalls(): number {
    return this._currentActiveCalls;
  }

  get totalCallsMade(): number {
    return this._totalCallsMade;
  }

  get totalCallsReceived(): number {
    return this._totalCallsReceived;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  updateCredentials(username: string, password: string): void {
    this._username = username;
    this._password = password;
    this._status = SIPAccountStatus.UNREGISTERED;
    this.updateTimestamp();
  }

  updatePassword(password: string): void {
    this._password = password;
    this._status = SIPAccountStatus.UNREGISTERED;
    this.updateTimestamp();
  }

  updateDisplayName(displayName: string | undefined): void {
    this._displayName = displayName;
    this.updateTimestamp();
  }

  updateTransport(transport: SIPTransport): void {
    this._transport = transport;
    this._status = SIPAccountStatus.UNREGISTERED;
    this.updateTimestamp();
  }

  updateProxy(proxy: string | undefined, port?: number): void {
    this._proxy = proxy;
    if (port !== undefined) {
      this._port = port;
    }
    this._status = SIPAccountStatus.UNREGISTERED;
    this.updateTimestamp();
  }

  setAsDefault(): void {
    this._isDefault = true;
    this.updateTimestamp();
  }

  unsetAsDefault(): void {
    this._isDefault = false;
    this.updateTimestamp();
  }

  activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._isActive = false;
    this._status = SIPAccountStatus.UNREGISTERED;
    this.updateTimestamp();
  }

  suspend(): void {
    this._status = SIPAccountStatus.SUSPENDED;
    this._isActive = false;
    this.updateTimestamp();
  }

  startRegistration(): void {
    this._status = SIPAccountStatus.REGISTERING;
    this.updateTimestamp();
  }

  completeRegistration(ipAddress: string, expires?: number): void {
    this._status = SIPAccountStatus.REGISTERED;
    this._lastRegisteredAt = new Date();
    this._lastRegisteredIp = ipAddress;
    if (expires !== undefined) {
      this._registrationExpires = expires;
    }
    this.updateTimestamp();
  }

  failRegistration(reason?: string): void {
    this._status = SIPAccountStatus.FAILED;
    if (reason && this._metadata) {
      this._metadata.lastFailureReason = reason;
    }
    this.updateTimestamp();
  }

  unregister(): void {
    this._status = SIPAccountStatus.UNREGISTERED;
    this.updateTimestamp();
  }

  startCall(): void {
    if (this._currentActiveCalls >= this._maxConcurrentCalls) {
      throw new Error(`Maximum concurrent calls (${this._maxConcurrentCalls}) reached`);
    }
    this._currentActiveCalls++;
    this._totalCallsMade++;
    this.updateTimestamp();
  }

  receiveCall(): void {
    if (this._currentActiveCalls >= this._maxConcurrentCalls) {
      throw new Error(`Maximum concurrent calls (${this._maxConcurrentCalls}) reached`);
    }
    this._currentActiveCalls++;
    this._totalCallsReceived++;
    this.updateTimestamp();
  }

  endCall(): void {
    if (this._currentActiveCalls > 0) {
      this._currentActiveCalls--;
      this.updateTimestamp();
    }
  }

  resetCallCount(): void {
    this._currentActiveCalls = 0;
    this.updateTimestamp();
  }

  updateMaxConcurrentCalls(max: number): void {
    if (max < 1) {
      throw new Error('Maximum concurrent calls must be at least 1');
    }
    this._maxConcurrentCalls = max;
    this.updateTimestamp();
  }

  updateMetadata(key: string, value: any): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    this._metadata[key] = value;
    this.updateTimestamp();
  }

  // Validation
  private validateProps(props: SIPAccountProps): void {
    if (!props.extension || props.extension.trim().length === 0) {
      throw new Error('Extension is required');
    }
    if (!props.username || props.username.trim().length === 0) {
      throw new Error('Username is required');
    }
    if (!props.domain || props.domain.trim().length === 0) {
      throw new Error('Domain is required');
    }
    if (props.port < 1 || props.port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  isRegistered(): boolean {
    return this._status === SIPAccountStatus.REGISTERED;
  }

  isAvailable(): boolean {
    return this.isRegistered() && 
           this._isActive && 
           this._currentActiveCalls < this._maxConcurrentCalls;
  }

  canMakeCall(): boolean {
    return this.isAvailable();
  }

  hasAvailableSlots(): number {
    return Math.max(0, this._maxConcurrentCalls - this._currentActiveCalls);
  }

  isRegistrationExpired(): boolean {
    if (!this._lastRegisteredAt || !this._registrationExpires) {
      return true;
    }
    
    const expirationTime = new Date(
      this._lastRegisteredAt.getTime() + (this._registrationExpires * 1000)
    );
    
    return expirationTime < new Date();
  }

  getSipUri(): string {
    return `sip:${this._extension}@${this._domain}`;
  }

  getProxyUri(): string {
    const proto = this._transport.toLowerCase();
    const host = this._proxy || this._domain;
    return `sip:${host}:${this._port};transport=${proto}`;
  }

  // Factory method
  static create(props: SIPAccountProps): SIPAccount {
    return new SIPAccount(props);
  }

  // Convert to plain object
  toObject(): SIPAccountProps {
    return {
      id: this._id,
      extension: this._extension,
      username: this._username,
      password: this._password,
      domain: this._domain,
      proxy: this._proxy,
      port: this._port,
      transport: this._transport,
      status: this._status,
      displayName: this._displayName,
      isDefault: this._isDefault,
      isActive: this._isActive,
      lastRegisteredAt: this._lastRegisteredAt,
      lastRegisteredIp: this._lastRegisteredIp,
      registrationExpires: this._registrationExpires,
      maxConcurrentCalls: this._maxConcurrentCalls,
      currentActiveCalls: this._currentActiveCalls,
      totalCallsMade: this._totalCallsMade,
      totalCallsReceived: this._totalCallsReceived,
      metadata: this._metadata ? { ...this._metadata } : undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}