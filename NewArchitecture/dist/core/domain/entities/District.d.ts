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
export declare class District {
    private readonly _id?;
    private _name;
    private _code;
    private _region?;
    private _population?;
    private _area?;
    private _center?;
    private _employeeCount;
    private _isActive;
    private _metadata?;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: DistrictProps);
    get id(): string | undefined;
    get name(): string;
    get code(): string;
    get region(): string | undefined;
    get population(): number | undefined;
    get area(): number | undefined;
    get center(): string | undefined;
    get employeeCount(): number;
    get isActive(): boolean;
    get metadata(): Record<string, any> | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    updateName(name: string): void;
    updateCode(code: string): void;
    updateRegion(region: string | undefined): void;
    updatePopulation(population: number | undefined): void;
    updateArea(area: number | undefined): void;
    updateCenter(center: string | undefined): void;
    incrementEmployeeCount(): void;
    decrementEmployeeCount(): void;
    setEmployeeCount(count: number): void;
    activate(): void;
    deactivate(): void;
    updateMetadata(key: string, value: any): void;
    private validateProps;
    private updateTimestamp;
    getPopulationDensity(): number | undefined;
    isUrban(): boolean;
    static create(props: DistrictProps): District;
    toObject(): DistrictProps;
}
//# sourceMappingURL=District.d.ts.map