/**
 * Employee Domain Entity
 * Core business entity representing an employee in the system
 */
export interface EmployeeProps {
    id?: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phoneNumber: string;
    additionalPhone?: string;
    department: string;
    district: string;
    position?: string;
    rank?: string;
    notes?: string;
    photoUrl?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class Employee {
    private readonly _id?;
    private _firstName;
    private _lastName;
    private _middleName?;
    private _phoneNumber;
    private _additionalPhone?;
    private _department;
    private _district;
    private _position?;
    private _rank?;
    private _notes?;
    private _photoUrl?;
    private _isActive;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: EmployeeProps);
    get id(): string | undefined;
    get firstName(): string;
    get lastName(): string;
    get middleName(): string | undefined;
    get fullName(): string;
    get phoneNumber(): string;
    get additionalPhone(): string | undefined;
    get department(): string;
    get district(): string;
    get position(): string | undefined;
    get rank(): string | undefined;
    get notes(): string | undefined;
    get photoUrl(): string | undefined;
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    updatePhoneNumber(phoneNumber: string): void;
    updateAdditionalPhone(phoneNumber: string | undefined): void;
    updateDepartment(department: string): void;
    updateDistrict(district: string): void;
    updatePosition(position: string | undefined): void;
    updateRank(rank: string | undefined): void;
    updatePhoto(photoUrl: string | undefined): void;
    activate(): void;
    deactivate(): void;
    private validatePhoneNumber;
    private updateTimestamp;
    static create(props: EmployeeProps): Employee;
    toObject(): EmployeeProps;
}
//# sourceMappingURL=Employee.d.ts.map