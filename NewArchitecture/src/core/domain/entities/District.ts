/**
 * District Domain Entity
 * Represents geographical districts in the system
 */

export interface DistrictProps {
  id?: string;
  name: string;
  code: string;
  region?: string;
  population?: number;
  area?: number;
  center?: string;
  employeeCount?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class District {
  private readonly _id?: string;
  private _name: string;
  private _code: string;
  private _region?: string;
  private _population?: number;
  private _area?: number;
  private _center?: string;
  private _employeeCount: number;
  private _isActive: boolean;
  private _metadata?: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: DistrictProps) {
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
  get id(): string | undefined {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get code(): string {
    return this._code;
  }

  get region(): string | undefined {
    return this._region;
  }

  get population(): number | undefined {
    return this._population;
  }

  get area(): number | undefined {
    return this._area;
  }

  get center(): string | undefined {
    return this._center;
  }

  get employeeCount(): number {
    return this._employeeCount;
  }

  get isActive(): boolean {
    return this._isActive;
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
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('District name cannot be empty');
    }
    this._name = name;
    this.updateTimestamp();
  }

  updateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('District code cannot be empty');
    }
    this._code = code.toUpperCase();
    this.updateTimestamp();
  }

  updateRegion(region: string | undefined): void {
    this._region = region;
    this.updateTimestamp();
  }

  updatePopulation(population: number | undefined): void {
    if (population !== undefined && population < 0) {
      throw new Error('Population cannot be negative');
    }
    this._population = population;
    this.updateTimestamp();
  }

  updateArea(area: number | undefined): void {
    if (area !== undefined && area < 0) {
      throw new Error('Area cannot be negative');
    }
    this._area = area;
    this.updateTimestamp();
  }

  updateCenter(center: string | undefined): void {
    this._center = center;
    this.updateTimestamp();
  }

  incrementEmployeeCount(): void {
    this._employeeCount++;
    this.updateTimestamp();
  }

  decrementEmployeeCount(): void {
    if (this._employeeCount > 0) {
      this._employeeCount--;
      this.updateTimestamp();
    }
  }

  setEmployeeCount(count: number): void {
    if (count < 0) {
      throw new Error('Employee count cannot be negative');
    }
    this._employeeCount = count;
    this.updateTimestamp();
  }

  activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._isActive = false;
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
  private validateProps(props: DistrictProps): void {
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

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  getPopulationDensity(): number | undefined {
    if (this._population && this._area && this._area > 0) {
      return Math.round(this._population / this._area);
    }
    return undefined;
  }

  isUrban(): boolean {
    const density = this.getPopulationDensity();
    return density ? density > 100 : false; // 100 people per sq km threshold
  }

  // Factory method
  static create(props: DistrictProps): District {
    return new District(props);
  }

  // Convert to plain object
  toObject(): DistrictProps {
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