"use strict";
/**
 * Base Use Case Interface
 * Generic interface for all use cases following Command pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSuccessResult = createSuccessResult;
exports.createErrorResult = createErrorResult;
// Helper function to create success result
function createSuccessResult(data) {
    return {
        success: true,
        data
    };
}
// Helper function to create error result
function createErrorResult(error, errors) {
    return {
        success: false,
        error,
        errors
    };
}
//# sourceMappingURL=IUseCase.js.map