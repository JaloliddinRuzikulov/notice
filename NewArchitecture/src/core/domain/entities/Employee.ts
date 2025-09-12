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

export class Employee {
  private readonly _id?: string;
  private _firstName: string;
  private _lastName: string;
  private _middleName?: string;
  private _phoneNumber: string;
  private _additionalPhone?: string;
  private _department: string;
  private _district: string;
  private _position?: string;
  private _rank?: string;
  private _notes?: string;
  private _photoUrl?: string;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: EmployeeProps) {
    // Validate required fields
    if (!props.firstName || props.firstName.trim() === '') {
      throw new Error('First name is required');
    }
    if (!props.lastName || props.lastName.trim() === '') {
      throw new Error('Last name is required');
    }
    if (!props.department || props.department.trim() === '') {
      throw new Error('Department is required');
    }
    if (!props.district || props.district.trim() === '') {
      throw new Error('District is required');
    }
    
    this._id = props.id;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._middleName = props.middleName;
    this._phoneNumber = this.validatePhoneNumber(props.phoneNumber);
    this._additionalPhone = props.additionalPhone ? this.validatePhoneNumber(props.additionalPhone) : undefined;
    this._department = props.department;
    this._district = props.district;
    this._position = props.position;
    this._rank = props.rank;
    this._notes = props.notes;
    this._photoUrl = props.photoUrl;
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get middleName(): string | undefined {
    return this._middleName;
  }

  get fullName(): string {
    const parts = [this._lastName, this._firstName];
    if (this._middleName) {
      parts.push(this._middleName);
    }
    return parts.join(' ');
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get additionalPhone(): string | undefined {
    return this._additionalPhone;
  }

  get department(): string {
    return this._department;
  }

  get district(): string {
    return this._district;
  }

  get position(): string | undefined {
    return this._position;
  }

  get rank(): string | undefined {
    return this._rank;
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get photoUrl(): string | undefined {
    return this._photoUrl;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  updatePhoneNumber(phoneNumber: string): void {
    this._phoneNumber = this.validatePhoneNumber(phoneNumber);
    this.updateTimestamp();
  }

  updateAdditionalPhone(phoneNumber: string | undefined): void {
    this._additionalPhone = phoneNumber ? this.validatePhoneNumber(phoneNumber) : undefined;
    this.updateTimestamp();
  }

  updateDepartment(department: string): void {
    this._department = department;
    this.updateTimestamp();
  }

  updateDistrict(district: string): void {
    this._district = district;
    this.updateTimestamp();
  }

  updatePosition(position: string | undefined): void {
    this._position = position;
    this.updateTimestamp();
  }

  updateRank(rank: string | undefined): void {
    this._rank = rank;
    this.updateTimestamp();
  }

  updatePhoto(photoUrl: string | undefined): void {
    this._photoUrl = photoUrl;
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

  // Validation methods
  private validatePhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Uzbek phone number
    if (!cleaned.match(/^998[0-9]{9}$/)) {
      // Try to fix common formats
      if (cleaned.match(/^[0-9]{9}$/)) {
        return '998' + cleaned;
      }
      if (cleaned.match(/^998[0-9]{9}$/)) {
        return cleaned;
      }
      throw new Error(`Invalid phone number format: ${phoneNumber}`);
    }
    
    return cleaned;
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Factory method
  static create(props: EmployeeProps): Employee {
    return new Employee(props);
  }

  // Convert to plain object
  toObject(): EmployeeProps {
    return {
      id: this._id,
      firstName: this._firstName,
      lastName: this._lastName,
      middleName: this._middleName,
      phoneNumber: this._phoneNumber,
      additionalPhone: this._additionalPhone,
      department: this._department,
      district: this._district,
      position: this._position,
      rank: this._rank,
      notes: this._notes,
      photoUrl: this._photoUrl,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}