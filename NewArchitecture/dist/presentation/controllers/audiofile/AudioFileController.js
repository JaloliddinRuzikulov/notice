"use strict";
/**
 * Audio File Controller
 * Handles HTTP requests for audio file management
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFileController = void 0;
const tsyringe_1 = require("tsyringe");
const BaseController_1 = require("../base/BaseController");
const UploadAudioFileUseCase_1 = require("@/application/usecases/audiofile/UploadAudioFileUseCase");
const GetAudioFileListUseCase_1 = require("@/application/usecases/audiofile/GetAudioFileListUseCase");
const DeleteAudioFileUseCase_1 = require("@/application/usecases/audiofile/DeleteAudioFileUseCase");
const AudioFileMapper_1 = require("@/application/mappers/audiofile/AudioFileMapper");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let AudioFileController = class AudioFileController extends BaseController_1.BaseController {
    uploadAudioFileUseCase;
    getAudioFileListUseCase;
    deleteAudioFileUseCase;
    audioFileMapper;
    constructor(uploadAudioFileUseCase, getAudioFileListUseCase, deleteAudioFileUseCase, audioFileMapper) {
        super();
        this.uploadAudioFileUseCase = uploadAudioFileUseCase;
        this.getAudioFileListUseCase = getAudioFileListUseCase;
        this.deleteAudioFileUseCase = deleteAudioFileUseCase;
        this.audioFileMapper = audioFileMapper;
    }
    /**
     * Upload audio file
     * POST /api/audio-files
     */
    async uploadAudioFile(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            // Check if file was uploaded
            if (!req.file) {
                return this.badRequest(res, 'No audio file provided');
            }
            const file = req.file;
            // Generate unique filename
            const timestamp = Date.now();
            const randomSuffix = Math.round(Math.random() * 1e9);
            const fileExtension = path_1.default.extname(file.originalname);
            const uniqueFilename = `${timestamp}-${randomSuffix}${fileExtension}`;
            const uploadDTO = {
                filename: uniqueFilename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path,
                description: this.sanitizeInput(req.body.description)
            };
            // Validate using mapper
            const validation = this.audioFileMapper.validateAudioFile(uploadDTO);
            if (!validation.isValid) {
                // Clean up uploaded file
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
                return this.badRequest(res, 'Audio file validation failed', validation.errors);
            }
            const result = await this.uploadAudioFileUseCase.execute({
                ...uploadDTO,
                uploadedBy: user.id
            });
            if (result.success && result.data) {
                const audioFileDTO = this.audioFileMapper.toDTO(result.data.audioFile);
                return this.created(res, audioFileDTO, 'Audio file uploaded successfully');
            }
            // Clean up file if use case failed
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error uploading audio file:', error);
            // Clean up file on error
            if (req.file && fs_1.default.existsSync(req.file.path)) {
                fs_1.default.unlinkSync(req.file.path);
            }
            return this.internalError(res, 'Failed to upload audio file');
        }
    }
    /**
     * Get audio file list with search and pagination
     * GET /api/audio-files
     */
    async getAudioFiles(req, res) {
        try {
            const pagination = this.getPaginationFromQuery(req);
            const search = {
                filename: req.query.filename,
                originalName: req.query.originalName,
                mimetype: req.query.mimetype,
                uploadedBy: req.query.uploadedBy,
                isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
            };
            // Handle size range
            if (req.query.minSize || req.query.maxSize) {
                search.sizeRange = {
                    minSize: req.query.minSize ? parseInt(req.query.minSize) : 0,
                    maxSize: req.query.maxSize ? parseInt(req.query.maxSize) : Infinity
                };
            }
            // Handle duration range
            if (req.query.minDuration || req.query.maxDuration) {
                search.durationRange = {
                    minDuration: req.query.minDuration ? parseInt(req.query.minDuration) : 0,
                    maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration) : Infinity
                };
            }
            // Remove undefined values
            Object.keys(search).forEach(key => search[key] === undefined && delete search[key]);
            const result = await this.getAudioFileListUseCase.execute({
                search: Object.keys(search).length > 0 ? search : undefined,
                pagination
            });
            if (result.success && result.data) {
                const audioFileDTOs = result.data.audioFiles.map(file => this.audioFileMapper.toDTO(file));
                if (result.data.pagination) {
                    return this.paginated(res, audioFileDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, {
                        audioFiles: audioFileDTOs,
                        statistics: result.data.statistics
                    });
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting audio files:', error);
            return this.internalError(res, 'Failed to retrieve audio files');
        }
    }
    /**
     * Get audio file by ID
     * GET /api/audio-files/:id
     */
    async getAudioFileById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Audio file ID is required');
            }
            // This would use a GetAudioFileByIdUseCase (not implemented in this example)
            // For now, we'll use the list use case with a workaround
            const result = await this.getAudioFileListUseCase.execute({});
            if (result.success && result.data && result.data.audioFiles.length > 0) {
                const audioFile = result.data.audioFiles.find(f => f.toObject().id === id);
                if (audioFile) {
                    const audioFileDTO = this.audioFileMapper.toDTO(audioFile);
                    return this.success(res, audioFileDTO);
                }
            }
            return this.notFound(res, 'Audio file not found');
        }
        catch (error) {
            console.error('Error getting audio file by ID:', error);
            return this.internalError(res, 'Failed to retrieve audio file');
        }
    }
    /**
     * Download audio file
     * GET /api/audio-files/:id/download
     */
    async downloadAudioFile(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Audio file ID is required');
            }
            // Get audio file info
            const result = await this.getAudioFileListUseCase.execute({});
            if (result.success && result.data && result.data.audioFiles.length > 0) {
                const audioFile = result.data.audioFiles.find(f => f.toObject().id === id);
                if (audioFile) {
                    const fileData = audioFile.toObject();
                    // Check if file exists on disk
                    if (!fs_1.default.existsSync(fileData.path)) {
                        return this.notFound(res, 'Audio file not found on disk');
                    }
                    // Set headers for file download
                    res.setHeader('Content-Type', fileData.mimetype);
                    res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
                    res.setHeader('Content-Length', fileData.size);
                    // Stream the file
                    const fileStream = fs_1.default.createReadStream(fileData.path);
                    fileStream.pipe(res);
                    return res;
                }
            }
            return this.notFound(res, 'Audio file not found');
        }
        catch (error) {
            console.error('Error downloading audio file:', error);
            return this.internalError(res, 'Failed to download audio file');
        }
    }
    /**
     * Stream audio file
     * GET /api/audio-files/:id/stream
     */
    async streamAudioFile(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return this.badRequest(res, 'Audio file ID is required');
            }
            // Get audio file info
            const result = await this.getAudioFileListUseCase.execute({});
            if (result.success && result.data && result.data.audioFiles.length > 0) {
                const audioFile = result.data.audioFiles.find(f => f.toObject().id === id);
                if (audioFile) {
                    const fileData = audioFile.toObject();
                    // Check if file exists on disk
                    if (!fs_1.default.existsSync(fileData.path)) {
                        return this.notFound(res, 'Audio file not found on disk');
                    }
                    const stat = fs_1.default.statSync(fileData.path);
                    const fileSize = stat.size;
                    const range = req.headers.range;
                    if (range) {
                        // Handle range requests for audio streaming
                        const parts = range.replace(/bytes=/, "").split("-");
                        const start = parseInt(parts[0], 10);
                        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                        const chunksize = (end - start) + 1;
                        const file = fs_1.default.createReadStream(fileData.path, { start, end });
                        const head = {
                            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': fileData.mimetype,
                        };
                        res.writeHead(206, head);
                        file.pipe(res);
                    }
                    else {
                        // No range request
                        const head = {
                            'Content-Length': fileSize,
                            'Content-Type': fileData.mimetype,
                        };
                        res.writeHead(200, head);
                        fs_1.default.createReadStream(fileData.path).pipe(res);
                    }
                    return res;
                }
            }
            return this.notFound(res, 'Audio file not found');
        }
        catch (error) {
            console.error('Error streaming audio file:', error);
            return this.internalError(res, 'Failed to stream audio file');
        }
    }
    /**
     * Delete audio file
     * DELETE /api/audio-files/:id
     */
    async deleteAudioFile(req, res) {
        try {
            const user = this.getUserFromRequest(req);
            const { id } = req.params;
            if (!user.id) {
                return this.unauthorized(res, 'User not authenticated');
            }
            if (!id) {
                return this.badRequest(res, 'Audio file ID is required');
            }
            const deleteDTO = {
                deleteFromDisk: req.query.deleteFromDisk === 'true',
                force: req.query.force === 'true'
            };
            const result = await this.deleteAudioFileUseCase.execute({
                audioFileId: id,
                deletedBy: user.id,
                ...deleteDTO
            });
            if (result.success) {
                return this.noContent(res, 'Audio file deleted successfully');
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error deleting audio file:', error);
            return this.internalError(res, 'Failed to delete audio file');
        }
    }
    /**
     * Get audio file statistics
     * GET /api/audio-files/statistics
     */
    async getAudioFileStatistics(req, res) {
        try {
            const result = await this.getAudioFileListUseCase.execute({});
            if (result.success && result.data && result.data.statistics) {
                return this.success(res, result.data.statistics);
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting audio file statistics:', error);
            return this.internalError(res, 'Failed to retrieve audio file statistics');
        }
    }
    /**
     * Get audio files by uploader
     * GET /api/audio-files/user/:userId
     */
    async getAudioFilesByUser(req, res) {
        try {
            const { userId } = req.params;
            const pagination = this.getPaginationFromQuery(req);
            if (!userId) {
                return this.badRequest(res, 'User ID is required');
            }
            const result = await this.getAudioFileListUseCase.execute({
                search: { uploadedBy: userId, isActive: true },
                pagination
            });
            if (result.success && result.data) {
                const audioFileDTOs = result.data.audioFiles.map(file => this.audioFileMapper.toDTO(file));
                if (result.data.pagination) {
                    return this.paginated(res, audioFileDTOs, result.data.pagination);
                }
                else {
                    return this.success(res, audioFileDTOs);
                }
            }
            return this.handleUseCaseResult(res, result);
        }
        catch (error) {
            console.error('Error getting audio files by user:', error);
            return this.internalError(res, 'Failed to retrieve user audio files');
        }
    }
};
exports.AudioFileController = AudioFileController;
exports.AudioFileController = AudioFileController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(UploadAudioFileUseCase_1.UploadAudioFileUseCase)),
    __param(1, (0, tsyringe_1.inject)(GetAudioFileListUseCase_1.GetAudioFileListUseCase)),
    __param(2, (0, tsyringe_1.inject)(DeleteAudioFileUseCase_1.DeleteAudioFileUseCase)),
    __param(3, (0, tsyringe_1.inject)(AudioFileMapper_1.AudioFileMapper)),
    __metadata("design:paramtypes", [UploadAudioFileUseCase_1.UploadAudioFileUseCase,
        GetAudioFileListUseCase_1.GetAudioFileListUseCase,
        DeleteAudioFileUseCase_1.DeleteAudioFileUseCase,
        AudioFileMapper_1.AudioFileMapper])
], AudioFileController);
//# sourceMappingURL=AudioFileController.js.map