"use strict";
/**
 * Employee Domain Entity
 * Core business entity representing an employee in the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
class Employee {
    _id;
    _firstName;
    _lastName;
    _middleName;
    _phoneNumber;
    _additionalPhone;
    _department;
    _district;
    _position;
    _rank;
    _notes;
    _photoUrl;
    _isActive;
    _createdAt;
    _updatedAt;
    constructor(props) {
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
    get id() {
        return this._id;
    }
    get firstName() {
        return this._firstName;
    }
    get lastName() {
        return this._lastName;
    }
    get middleName() {
        return this._middleName;
    }
    get fullName() {
        const parts = [this._lastName, this._firstName];
        if (this._middleName) {
            parts.push(this._middleName);
        }
        return parts.join(' ');
    }
    get phoneNumber() {
        return this._phoneNumber;
    }
    get additionalPhone() {
        return this._additionalPhone;
    }
    get department() {
        return this._department;
    }
    get district() {
        return this._district;
    }
    get position() {
        return this._position;
    }
    get rank() {
        return this._rank;
    }
    get notes() {
        return this._notes;
    }
    get photoUrl() {
        return this._photoUrl;
    }
    get isActive() {
        return this._isActive;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    // Business methods
    updatePhoneNumber(phoneNumber) {
        this._phoneNumber = this.validatePhoneNumber(phoneNumber);
        this.updateTimestamp();
    }
    updateAdditionalPhone(phoneNumber) {
        this._additionalPhone = phoneNumber ? this.validatePhoneNumber(phoneNumber) : undefined;
        this.updateTimestamp();
    }
    updateDepartment(department) {
        this._department = department;
        this.updateTimestamp();
    }
    updateDistrict(district) {
        this._district = district;
        this.updateTimestamp();
    }
    updatePosition(position) {
        this._position = position;
        this.updateTimestamp();
    }
    updateRank(rank) {
        this._rank = rank;
        this.updateTimestamp();
    }
    updatePhoto(photoUrl) {
        this._photoUrl = photoUrl;
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
    // Validation methods
    validatePhoneNumber(phoneNumber) {
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
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Factory method
    static create(props) {
        return new Employee(props);
    }
    // Convert to plain object
    toObject() {
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
exports.Employee = Employee;
//# sourceMappingURL=Employee.js.map