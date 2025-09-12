"use strict";
/**
 * Audio File Routes
 * Defines routes for audio file management endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFileRoutes = void 0;
const express_validator_1 = require("express-validator");
const tsyringe_1 = require("tsyringe");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const BaseRouter_1 = require("../base/BaseRouter");
const AudioFileController_1 = require("@/presentation/controllers/audiofile/AudioFileController");
const ErrorHandlerMiddleware_1 = require("@/presentation/middlewares/ErrorHandlerMiddleware");
const RateLimitMiddleware_1 = require("@/presentation/middlewares/RateLimitMiddleware");
// Configure multer for audio file uploads
const uploadDir = process.env.AUDIO_UPLOAD_DIR || './uploads/audio';
// Ensure upload directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'audio/mpeg',
            'audio/wav',
            'audio/mp3',
            'audio/ogg',
            'audio/aac',
            'audio/x-wav',
            'audio/webm'
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
        }
    }
});
class AudioFileRoutes extends BaseRouter_1.BaseRouter {
    audioFileController;
    constructor() {
        super();
        this.audioFileController = tsyringe_1.container.resolve(AudioFileController_1.AudioFileController);
    }
    setupRoutes() {
        /**
         * @route GET /api/audio-files
         * @desc Get list of audio files with search and pagination
         * @access Private
         */
        this.router.get('/', ...this.apiEndpoint(), this.validatePagination(), this.validate([
            (0, express_validator_1.query)('filename')
                .optional()
                .trim()
                .isLength({ min: 1 })
                .withMessage('Filename search must not be empty'),
            (0, express_validator_1.query)('originalName')
                .optional()
                .trim()
                .isLength({ min: 1 })
                .withMessage('Original name search must not be empty'),
            (0, express_validator_1.query)('mimetype')
                .optional()
                .isIn([
                'audio/mpeg',
                'audio/wav',
                'audio/mp3',
                'audio/ogg',
                'audio/aac',
                'audio/x-wav',
                'audio/webm'
            ])
                .withMessage('Invalid MIME type'),
            (0, express_validator_1.query)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be true or false'),
            (0, express_validator_1.query)('minSize')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Minimum size must be a non-negative integer'),
            (0, express_validator_1.query)('maxSize')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Maximum size must be a non-negative integer'),
            (0, express_validator_1.query)('minDuration')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Minimum duration must be a non-negative integer'),
            (0, express_validator_1.query)('maxDuration')
                .optional()
                .isInt({ min: 0 })
                .withMessage('Maximum duration must be a non-negative integer')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.getAudioFiles.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/:id
         * @desc Get audio file by ID
         * @access Private
         */
        this.router.get('/:id', ...this.apiEndpoint(), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.getAudioFileById.bind(this.audioFileController)));
        /**
         * @route POST /api/audio-files
         * @desc Upload audio file
         * @access Private - requires audiofile:upload permission
         */
        this.router.post('/', RateLimitMiddleware_1.RateLimitMiddleware.uploadRateLimit, ...this.apiEndpoint(), this.requirePermissions(['audiofile:upload', 'audiofile:manage']), upload.single('audioFile'), this.validateFileUpload({
            required: true,
            maxSize: 50 * 1024 * 1024,
            allowedMimeTypes: [
                'audio/mpeg',
                'audio/wav',
                'audio/mp3',
                'audio/ogg',
                'audio/aac',
                'audio/x-wav',
                'audio/webm'
            ]
        }), this.validate([
            (0, express_validator_1.body)('description')
                .optional()
                .trim()
                .isLength({ max: 500 })
                .withMessage('Description must not exceed 500 characters')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.uploadAudioFile.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/:id/download
         * @desc Download audio file
         * @access Private - requires audiofile:download permission
         */
        this.router.get('/:id/download', ...this.apiEndpoint(), this.requirePermissions(['audiofile:download', 'audiofile:view']), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.downloadAudioFile.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/:id/stream
         * @desc Stream audio file
         * @access Private - supports range requests for audio streaming
         */
        this.router.get('/:id/stream', ...this.apiEndpoint(), this.requirePermissions(['audiofile:stream', 'audiofile:view']), this.validateUUID('id'), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.streamAudioFile.bind(this.audioFileController)));
        /**
         * @route DELETE /api/audio-files/:id
         * @desc Delete audio file
         * @access Private - requires audiofile:delete permission
         */
        this.router.delete('/:id', ...this.apiEndpoint(), this.requirePermissions(['audiofile:delete', 'audiofile:manage']), this.validateUUID('id'), this.validate([
            (0, express_validator_1.query)('deleteFromDisk')
                .optional()
                .isBoolean()
                .withMessage('deleteFromDisk must be true or false'),
            (0, express_validator_1.query)('force')
                .optional()
                .isBoolean()
                .withMessage('force must be true or false')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.deleteAudioFile.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/statistics
         * @desc Get audio file statistics
         * @access Private - requires audiofile:view permission
         */
        this.router.get('/statistics', ...this.apiEndpoint(), this.requirePermissions(['audiofile:view', 'audiofile:manage']), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.getAudioFileStatistics.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/user/:userId
         * @desc Get audio files by uploader
         * @access Private
         */
        this.router.get('/user/:userId', ...this.apiEndpoint(), this.validateUUID('userId'), this.validatePagination(), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.getAudioFilesByUser.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/my
         * @desc Get current user's audio files
         * @access Private
         */
        this.router.get('/my', ...this.apiEndpoint(), this.validatePagination(), (req, res, next) => {
            // Set userId parameter from authenticated user
            const user = req.user;
            if (user) {
                req.params.userId = user.id;
            }
            next();
        }, ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.getAudioFilesByUser.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/search
         * @desc Search audio files with advanced filters
         * @access Private
         */
        this.router.get('/search', ...this.apiEndpoint(), this.validatePagination(), this.validate([
            (0, express_validator_1.query)('filename')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Filename search must be at least 2 characters'),
            (0, express_validator_1.query)('originalName')
                .optional()
                .trim()
                .isLength({ min: 2 })
                .withMessage('Original name search must be at least 2 characters'),
            (0, express_validator_1.query)('uploadedBy')
                .optional()
                .isUUID()
                .withMessage('UploadedBy must be a valid UUID'),
            (0, express_validator_1.query)('mimetype')
                .optional()
                .isIn([
                'audio/mpeg',
                'audio/wav',
                'audio/mp3',
                'audio/ogg',
                'audio/aac',
                'audio/x-wav',
                'audio/webm'
            ])
                .withMessage('Invalid MIME type'),
            (0, express_validator_1.query)('isActive')
                .optional()
                .isBoolean()
                .withMessage('isActive must be true or false')
        ]), ErrorHandlerMiddleware_1.ErrorHandlerMiddleware.asyncHandler(this.audioFileController.getAudioFiles.bind(this.audioFileController)));
        /**
         * @route GET /api/audio-files/types
         * @desc Get supported audio file types
         * @access Private
         */
        this.router.get('/types', ...this.authenticatedEndpoint(), (req, res) => {
            const supportedTypes = [
                { value: 'audio/mpeg', label: 'MP3', extension: '.mp3' },
                { value: 'audio/wav', label: 'WAV', extension: '.wav' },
                { value: 'audio/ogg', label: 'OGG', extension: '.ogg' },
                { value: 'audio/aac', label: 'AAC', extension: '.aac' },
                { value: 'audio/webm', label: 'WebM', extension: '.webm' }
            ];
            res.json({
                success: true,
                data: {
                    supportedTypes,
                    maxFileSize: 50 * 1024 * 1024, // 50MB
                    uploadLimits: {
                        dailyUploads: 10,
                        hourlyUploads: 10
                    }
                }
            });
        });
    }
}
exports.AudioFileRoutes = AudioFileRoutes;
//# sourceMappingURL=AudioFileRoutes.js.map