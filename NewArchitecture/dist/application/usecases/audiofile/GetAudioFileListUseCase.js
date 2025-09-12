"use strict";
/**
 * Get Audio File List Use Case
 * Handles retrieving audio files with search and pagination
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
exports.GetAudioFileListUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const IUseCase_1 = require("../base/IUseCase");
let GetAudioFileListUseCase = class GetAudioFileListUseCase {
    audioFileRepository;
    constructor(audioFileRepository) {
        this.audioFileRepository = audioFileRepository;
    }
    async execute(request) {
        try {
            let audioFiles;
            // If search criteria provided
            if (request.search) {
                const searchCriteria = {
                    filename: request.search.filename,
                    // Note: originalName, mimetype, isActive not available in AudioFileSearchCriteria
                    uploadedBy: request.search.uploadedBy,
                    // Use date range for filtering if needed
                    startDate: request.search.sizeRange ? new Date() : undefined, // Placeholder - size filtering not directly supported
                    endDate: request.search.durationRange ? new Date() : undefined // Placeholder - duration filtering not directly supported
                };
                audioFiles = await this.audioFileRepository.search(searchCriteria);
            }
            else {
                audioFiles = await this.audioFileRepository.findAll();
            }
            // Apply manual pagination if requested
            if (request.pagination) {
                const page = request.pagination.page || 1;
                const limit = request.pagination.limit || 20;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedAudioFiles = audioFiles.slice(startIndex, endIndex);
                // Calculate statistics
                const statistics = await this.calculateStatistics(request.search);
                return (0, IUseCase_1.createSuccessResult)({
                    audioFiles: paginatedAudioFiles,
                    pagination: {
                        total: audioFiles.length,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(audioFiles.length / limit)
                    },
                    statistics
                });
            }
            // Calculate statistics
            const statistics = await this.calculateStatistics(request.search);
            return (0, IUseCase_1.createSuccessResult)({
                audioFiles,
                statistics
            });
        }
        catch (error) {
            return (0, IUseCase_1.createErrorResult)(`Failed to retrieve audio files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async calculateStatistics(searchCriteria) {
        let audioFiles;
        if (searchCriteria) {
            const criteria = {
                filename: searchCriteria.filename,
                uploadedBy: searchCriteria.uploadedBy
                // Note: Other properties not available in AudioFileSearchCriteria
            };
            audioFiles = await this.audioFileRepository.search(criteria);
        }
        else {
            audioFiles = await this.audioFileRepository.findAll();
        }
        const totalFiles = audioFiles.length;
        const totalSize = audioFiles.reduce((sum, file) => sum + file.toObject().size, 0);
        const totalDuration = audioFiles.reduce((sum, file) => sum + (file.toObject().duration || 0), 0);
        const averageDuration = totalFiles > 0 ? Math.round(totalDuration / totalFiles) : 0;
        return {
            totalFiles,
            totalSize,
            averageDuration,
            totalDuration
        };
    }
};
exports.GetAudioFileListUseCase = GetAudioFileListUseCase;
exports.GetAudioFileListUseCase = GetAudioFileListUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IAudioFileRepository')),
    __metadata("design:paramtypes", [Object])
], GetAudioFileListUseCase);
//# sourceMappingURL=GetAudioFileListUseCase.js.map