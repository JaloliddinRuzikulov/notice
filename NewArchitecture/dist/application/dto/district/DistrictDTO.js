"use strict";
/**
 * District Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistrictDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
class DistrictDTO extends BaseDTO_1.BaseDTO {
    name;
    code;
    region;
    coordinates;
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
        this.region = data.region;
        this.coordinates = data.coordinates;
        this.isActive = data.isActive;
        this.employeeCount = data.employeeCount;
    }
    get hasEmployees() {
        return (this.employeeCount || 0) > 0;
    }
    get hasCoordinates() {
        return !!(this.coordinates?.latitude && this.coordinates?.longitude);
    }
}
exports.DistrictDTO = DistrictDTO;
//# sourceMappingURL=DistrictDTO.js.map