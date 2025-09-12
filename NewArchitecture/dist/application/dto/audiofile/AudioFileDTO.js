"use strict";
/**
 * Audio File Data Transfer Objects
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFileDTO = void 0;
const BaseDTO_1 = require("../base/BaseDTO");
class AudioFileDTO extends BaseDTO_1.BaseDTO {
    filename;
    originalName;
    mimetype;
    size;
    path;
    duration;
    uploadedBy;
    description;
    isActive;
    constructor(data) {
        super({
            id: data.id,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
        this.filename = data.filename;
        this.originalName = data.originalName;
        this.mimetype = data.mimetype;
        this.size = data.size;
        this.path = data.path;
        this.duration = data.duration;
        this.uploadedBy = data.uploadedBy;
        this.description = data.description;
        this.isActive = data.isActive;
    }
    get formattedSize() {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = this.size;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }
    get formattedDuration() {
        if (this.duration < 60) {
            return `${this.duration}s`;
        }
        const minutes = Math.floor(this.duration / 60);
        const seconds = this.duration % 60;
        if (minutes < 60) {
            return `${minutes}m ${seconds}s`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m ${seconds}s`;
    }
    get fileExtension() {
        return this.filename.split('.').pop() || '';
    }
}
exports.AudioFileDTO = AudioFileDTO;
//# sourceMappingURL=AudioFileDTO.js.map