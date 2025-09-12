"use strict";
/**
 * Group Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
class GroupDTO extends BaseDTO_1.BaseDTO {
    name;
    description;
    employeeIds;
    createdBy;
    isActive;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.name = data.name;
        this.description = data.description;
        this.employeeIds = data.employeeIds;
        this.createdBy = data.createdBy;
        this.isActive = data.isActive;
    }
    get memberCount() {
        return this.employeeIds.length;
    }
}
exports.GroupDTO = GroupDTO;
//# sourceMappingURL=GroupDTO.js.map