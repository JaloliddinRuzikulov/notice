"use strict";
/**
 * Employee Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
class EmployeeDTO extends BaseDTO_1.BaseDTO {
    firstName;
    lastName;
    middleName;
    phoneNumber;
    additionalPhone;
    department;
    district;
    position;
    rank;
    notes;
    photoUrl;
    isActive;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.middleName = data.middleName;
        this.phoneNumber = data.phoneNumber;
        this.additionalPhone = data.additionalPhone;
        this.department = data.department;
        this.district = data.district;
        this.position = data.position;
        this.rank = data.rank;
        this.notes = data.notes;
        this.photoUrl = data.photoUrl;
        this.isActive = data.isActive;
    }
    get fullName() {
        const names = [this.firstName, this.middleName, this.lastName].filter(Boolean);
        return names.join(' ');
    }
}
exports.EmployeeDTO = EmployeeDTO;
//# sourceMappingURL=EmployeeDTO.js.map