"use strict";
/**
 * Department Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
class DepartmentDTO extends BaseDTO_1.BaseDTO {
    name;
    code;
    description;
    parentDepartmentId;
    parentDepartmentName;
    level;
    isActive;
    employeeCount;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.name = data.name;
        this.code = data.code;
        this.description = data.description;
        this.parentDepartmentId = data.parentDepartmentId;
        this.parentDepartmentName = data.parentDepartmentName;
        this.level = data.level;
        this.isActive = data.isActive;
        this.employeeCount = data.employeeCount;
    }
    get isRootDepartment() {
        return !this.parentDepartmentId;
    }
    get hasEmployees() {
        return (this.employeeCount || 0) > 0;
    }
}
exports.DepartmentDTO = DepartmentDTO;
//# sourceMappingURL=DepartmentDTO.js.map