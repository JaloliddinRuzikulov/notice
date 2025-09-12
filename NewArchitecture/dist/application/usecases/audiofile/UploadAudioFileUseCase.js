"use strict";
/**
 * Upload Audio File Use Case
 * Handles audio file upload and validation
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadAudioFileUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
const AudioFile_1 = require("@/core/domain/entities/AudioFile");
let UploadAudioFileUseCase = class UploadAudioFileUseCase {
    audioFileRepository;
    constructor(audioFileRepository) {
        this.audioFileRepository = audioFileRepository;
    }
    ALLOWED_MIME_TYPES = [
        'audio/mpeg',
        'audio/wav',
        'audio/mp3',
        'audio/ogg',
        'audio/aac',
        'audio/x-wav',
        'audio/webm'
    ];
    MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    async execute(request) {
        try {
            // Validate request
            const validation = this.validateRequest(request);
            if (!validation.isValid) {
                return (0, IUseCase_1.createErrorResult)('Validation failed', validation.errors);
            }
            // Check if filename already exists
            const existingFile = await this.audioFileRepository.findByFilename(request.filename);
            if (existingFile) {
                return (0, IUseCase_1.createErrorResult)('File with this name already exists');
            }
            // Calculate duration (would normally use audio processing library)
            const duration = await this.calculateAudioDuration(request.path);
            // Create audio file entity
            const audioFile = AudioFile_1.AudioFile.create({
                filename: request.filename,
                originalName: request.originalName,
                // Note: mimetype not available in AudioFileProps, using format instead
                type: AudioFile_1.AudioFileType.UPLOADED,
                format: AudioFile_1.AudioFileFormat.MP3, // Default format, should be determined from file
                status: AudioFile_1.AudioFileStatus.READY,
                size: request.size,
                path: request.path,
                duration: duration,
                uploadedBy: request.uploadedBy
                // Note: description and isActive not available in AudioFileProps
            });
            // Save audio file record
            const savedAudioFile = await this.audioFileRepository.save(audioFile);
            return (0, IUseCase_1.createSuccessResult)({
                audioFile: savedAudioFile
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to upload audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.filename?.trim()) {
            errors.push('Filename is required');
        }
        if (!request.originalName?.trim()) {
            errors.push('Original filename is required');
        }
        if (!request.mimetype?.trim()) {
            errors.push('MIME type is required');
        }
        else if (!this.ALLOWED_MIME_TYPES.includes(request.mimetype)) {
            errors.push(`Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
        }
        if (!request.size || request.size <= 0) {
            errors.push('File size must be greater than 0');
        }
        else if (request.size > this.MAX_FILE_SIZE) {
            errors.push(`File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }
        if (!request.path?.trim()) {
            errors.push('File path is required');
        }
        if (!request.uploadedBy?.trim()) {
            errors.push('Uploader ID is required');
        }
        // Validate filename format
        const filenameRegex = /^[a-zA-Z0-9_\-\.]+$/;
        if (request.filename && !filenameRegex.test(request.filename)) {
            errors.push('Filename contains invalid characters');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async calculateAudioDuration(filePath) {
        // In a real implementation, you would use a library like node-ffmpeg
        // or similar to get the actual audio duration
        // For now, return a placeholder duration
        try {
            // Placeholder implementation - in real app use ffprobe or similar
            return 0; // Duration in seconds
        }
        catch (error) {
            // If duration calculation fails, return 0
            return 0;
        }
    }
};
exports.UploadAudioFileUseCase = UploadAudioFileUseCase;
exports.UploadAudioFileUseCase = UploadAudioFileUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IAudioFileRepository')),
    __metadata("design:paramtypes", [Object])
], UploadAudioFileUseCase);
//# sourceMappingURL=UploadAudioFileUseCase.js.map