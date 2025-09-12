"use strict";
/**
 * SIPAccount Domain Entity
 * Represents SIP extensions/accounts for VoIP communication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIPAccount = exports.SIPTransport = exports.SIPAccountStatus = void 0;
var SIPAccountStatus;
(function (SIPAccountStatus) {
    SIPAccountStatus["REGISTERED"] = "registered";
    SIPAccountStatus["UNREGISTERED"] = "unregistered";
    SIPAccountStatus["REGISTERING"] = "registering";
    SIPAccountStatus["FAILED"] = "failed";
    SIPAccountStatus["SUSPENDED"] = "suspended";
})(SIPAccountStatus || (exports.SIPAccountStatus = SIPAccountStatus = {}));
var SIPTransport;
(function (SIPTransport) {
    SIPTransport["UDP"] = "udp";
    SIPTransport["TCP"] = "tcp";
    SIPTransport["TLS"] = "tls";
    SIPTransport["WS"] = "ws";
    SIPTransport["WSS"] = "wss";
})(SIPTransport || (exports.SIPTransport = SIPTransport = {}));
class SIPAccount {
    _id;
    _extension;
    _username;
    _password;
    _domain;
    _proxy;
    _port;
    _transport;
    _status;
    _displayName;
    _isDefault;
    _isActive;
    _lastRegisteredAt;
    _lastRegisteredIp;
    _registrationExpires;
    _maxConcurrentCalls;
    _currentActiveCalls;
    _totalCallsMade;
    _totalCallsReceived;
    _metadata;
    _createdAt;
    _updatedAt;
    constructor(props) {
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
    get id() {
        return this._id;
    }
    get extension() {
        return this._extension;
    }
    get username() {
        return this._username;
    }
    get password() {
        return this._password;
    }
    get domain() {
        return this._domain;
    }
    get proxy() {
        return this._proxy;
    }
    get port() {
        return this._port;
    }
    get transport() {
        return this._transport;
    }
    get status() {
        return this._status;
    }
    get displayName() {
        return this._displayName;
    }
    get isDefault() {
        return this._isDefault;
    }
    get isActive() {
        return this._isActive;
    }
    get lastRegisteredAt() {
        return this._lastRegisteredAt;
    }
    get lastRegisteredIp() {
        return this._lastRegisteredIp;
    }
    get registrationExpires() {
        return this._registrationExpires;
    }
    get maxConcurrentCalls() {
        return this._maxConcurrentCalls;
    }
    get currentActiveCalls() {
        return this._currentActiveCalls;
    }
    get totalCallsMade() {
        return this._totalCallsMade;
    }
    get totalCallsReceived() {
        return this._totalCallsReceived;
    }
    get metadata() {
        return this._metadata;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    // Business methods
    updateCredentials(username, password) {
        this._username = username;
        this._password = password;
        this._status = SIPAccountStatus.UNREGISTERED;
        this.updateTimestamp();
    }
    updatePassword(password) {
        this._password = password;
        this._status = SIPAccountStatus.UNREGISTERED;
        this.updateTimestamp();
    }
    updateDisplayName(displayName) {
        this._displayName = displayName;
        this.updateTimestamp();
    }
    updateTransport(transport) {
        this._transport = transport;
        this._status = SIPAccountStatus.UNREGISTERED;
        this.updateTimestamp();
    }
    updateProxy(proxy, port) {
        this._proxy = proxy;
        if (port !== undefined) {
            this._port = port;
        }
        this._status = SIPAccountStatus.UNREGISTERED;
        this.updateTimestamp();
    }
    setAsDefault() {
        this._isDefault = true;
        this.updateTimestamp();
    }
    unsetAsDefault() {
        this._isDefault = false;
        this.updateTimestamp();
    }
    activate() {
        this._isActive = true;
        this.updateTimestamp();
    }
    deactivate() {
        this._isActive = false;
        this._status = SIPAccountStatus.UNREGISTERED;
        this.updateTimestamp();
    }
    suspend() {
        this._status = SIPAccountStatus.SUSPENDED;
        this._isActive = false;
        this.updateTimestamp();
    }
    startRegistration() {
        this._status = SIPAccountStatus.REGISTERING;
        this.updateTimestamp();
    }
    completeRegistration(ipAddress, expires) {
        this._status = SIPAccountStatus.REGISTERED;
        this._lastRegisteredAt = new Date();
        this._lastRegisteredIp = ipAddress;
        if (expires !== undefined) {
            this._registrationExpires = expires;
        }
        this.updateTimestamp();
    }
    failRegistration(reason) {
        this._status = SIPAccountStatus.FAILED;
        if (reason && this._metadata) {
            this._metadata.lastFailureReason = reason;
        }
        this.updateTimestamp();
    }
    unregister() {
        this._status = SIPAccountStatus.UNREGISTERED;
        this.updateTimestamp();
    }
    startCall() {
        if (this._currentActiveCalls >= this._maxConcurrentCalls) {
            throw new Error(`Maximum concurrent calls (${this._maxConcurrentCalls}) reached`);
        }
        this._currentActiveCalls++;
        this._totalCallsMade++;
        this.updateTimestamp();
    }
    receiveCall() {
        if (this._currentActiveCalls >= this._maxConcurrentCalls) {
            throw new Error(`Maximum concurrent calls (${this._maxConcurrentCalls}) reached`);
        }
        this._currentActiveCalls++;
        this._totalCallsReceived++;
        this.updateTimestamp();
    }
    endCall() {
        if (this._currentActiveCalls > 0) {
            this._currentActiveCalls--;
            this.updateTimestamp();
        }
    }
    resetCallCount() {
        this._currentActiveCalls = 0;
        this.updateTimestamp();
    }
    updateMaxConcurrentCalls(max) {
        if (max < 1) {
            throw new Error('Maximum concurrent calls must be at least 1');
        }
        this._maxConcurrentCalls = max;
        this.updateTimestamp();
    }
    updateMetadata(key, value) {
        if (!this._metadata) {
            this._metadata = {};
        }
        this._metadata[key] = value;
        this.updateTimestamp();
    }
    // Validation
    validateProps(props) {
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
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    isRegistered() {
        return this._status === SIPAccountStatus.REGISTERED;
    }
    isAvailable() {
        return this.isRegistered() &&
            this._isActive &&
            this._currentActiveCalls < this._maxConcurrentCalls;
    }
    canMakeCall() {
        return this.isAvailable();
    }
    hasAvailableSlots() {
        return Math.max(0, this._maxConcurrentCalls - this._currentActiveCalls);
    }
    isRegistrationExpired() {
        if (!this._lastRegisteredAt || !this._registrationExpires) {
            return true;
        }
        const expirationTime = new Date(this._lastRegisteredAt.getTime() + (this._registrationExpires * 1000));
        return expirationTime < new Date();
    }
    getSipUri() {
        return `sip:${this._extension}@${this._domain}`;
    }
    getProxyUri() {
        const proto = this._transport.toLowerCase();
        const host = this._proxy || this._domain;
        return `sip:${host}:${this._port};transport=${proto}`;
    }
    // Factory method
    static create(props) {
        return new SIPAccount(props);
    }
    // Convert to plain object
    toObject() {
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
exports.SIPAccount = SIPAccount;
//# sourceMappingURL=SIPAccount.js.map