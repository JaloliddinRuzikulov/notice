"use strict";
/**
 * Base DTO class with common properties
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDTO = void 0;
class BaseDTO {
    id;
    createdAt;
    updatedAt;
    constructor(data) {
        this.id = data.id;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
}
exports.BaseDTO = BaseDTO;
//# sourceMappingURL=BaseDTO.js.map