"use strict";
/**
 * District Domain Entity
 * Represents geographical districts in the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.District = void 0;
class District {
    _id;
    _name;
    _code;
    _region;
    _population;
    _area;
    _center;
    _employeeCount;
    _isActive;
    _metadata;
    _createdAt;
    _updatedAt;
    constructor(props) {
        this.validateProps(props);
        this._id = props.id;
        this._name = props.name;
        this._code = props.code.toUpperCase();
        this._region = props.region;
        this._population = props.population;
        this._area = props.area;
        this._center = props.center;
        this._employeeCount = props.employeeCount ?? 0;
        this._isActive = props.isActive ?? true;
        this._metadata = props.metadata;
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }
    // Getters
    get id() {
        return this._id;
    }
    get name() {
        return this._name;
    }
    get code() {
        return this._code;
    }
    get region() {
        return this._region;
    }
    get population() {
        return this._population;
    }
    get area() {
        return this._area;
    }
    get center() {
        return this._center;
    }
    get employeeCount() {
        return this._employeeCount;
    }
    get isActive() {
        return this._isActive;
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
    updateName(name) {
        if (!name || name.trim().length === 0) {
            throw new Error('District name cannot be empty');
        }
        this._name = name;
        this.updateTimestamp();
    }
    updateCode(code) {
        if (!code || code.trim().length === 0) {
            throw new Error('District code cannot be empty');
        }
        this._code = code.toUpperCase();
        this.updateTimestamp();
    }
    updateRegion(region) {
        this._region = region;
        this.updateTimestamp();
    }
    updatePopulation(population) {
        if (population !== undefined && population < 0) {
            throw new Error('Population cannot be negative');
        }
        this._population = population;
        this.updateTimestamp();
    }
    updateArea(area) {
        if (area !== undefined && area < 0) {
            throw new Error('Area cannot be negative');
        }
        this._area = area;
        this.updateTimestamp();
    }
    updateCenter(center) {
        this._center = center;
        this.updateTimestamp();
    }
    incrementEmployeeCount() {
        this._employeeCount++;
        this.updateTimestamp();
    }
    decrementEmployeeCount() {
        if (this._employeeCount > 0) {
            this._employeeCount--;
            this.updateTimestamp();
        }
    }
    setEmployeeCount(count) {
        if (count < 0) {
            throw new Error('Employee count cannot be negative');
        }
        this._employeeCount = count;
        this.updateTimestamp();
    }
    activate() {
        this._isActive = true;
        this.updateTimestamp();
    }
    deactivate() {
        this._isActive = false;
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
        if (!props.name || props.name.trim().length === 0) {
            throw new Error('District name is required');
        }
        if (!props.code || props.code.trim().length === 0) {
            throw new Error('District code is required');
        }
        if (props.population !== undefined && props.population < 0) {
            throw new Error('Population cannot be negative');
        }
        if (props.area !== undefined && props.area < 0) {
            throw new Error('Area cannot be negative');
        }
    }
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    getPopulationDensity() {
        if (this._population && this._area && this._area > 0) {
            return Math.round(this._population / this._area);
        }
        return undefined;
    }
    isUrban() {
        const density = this.getPopulationDensity();
        return density ? density > 100 : false; // 100 people per sq km threshold
    }
    // Factory method
    static create(props) {
        return new District(props);
    }
    // Convert to plain object
    toObject() {
        return {
            id: this._id,
            name: this._name,
            code: this._code,
            region: this._region,
            population: this._population,
            area: this._area,
            center: this._center,
            employeeCount: this._employeeCount,
            isActive: this._isActive,
            metadata: this._metadata,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
        };
    }
}
exports.District = District;
//# sourceMappingURL=District.js.map