/**
 * Audio File Controller
 * Handles HTTP requests for audio file management
 */
import { Request, Response } from 'express';
import { BaseController } from '../base/BaseController';
import { UploadAudioFileUseCase } from '@/application/usecases/audiofile/UploadAudioFileUseCase';
import { GetAudioFileListUseCase } from '@/application/usecases/audiofile/GetAudioFileListUseCase';
import { DeleteAudioFileUseCase } from '@/application/usecases/audiofile/DeleteAudioFileUseCase';
import { AudioFileMapper } from '@/application/mappers/audiofile/AudioFileMapper';
export declare class AudioFileController extends BaseController {
    private uploadAudioFileUseCase;
    private getAudioFileListUseCase;
    private deleteAudioFileUseCase;
    private audioFileMapper;
    constructor(uploadAudioFileUseCase: UploadAudioFileUseCase, getAudioFileListUseCase: GetAudioFileListUseCase, deleteAudioFileUseCase: DeleteAudioFileUseCase, audioFileMapper: AudioFileMapper);
    /**
     * Upload audio file
     * POST /api/audio-files
     */
    uploadAudioFile(req: Request, res: Response): Promise<Response>;
    /**
     * Get audio file list with search and pagination
     * GET /api/audio-files
     */
    getAudioFiles(req: Request, res: Response): Promise<Response>;
    /**
     * Get audio file by ID
     * GET /api/audio-files/:id
     */
    getAudioFileById(req: Request, res: Response): Promise<Response>;
    /**
     * Download audio file
     * GET /api/audio-files/:id/download
     */
    downloadAudioFile(req: Request, res: Response): Promise<Response>;
    /**
     * Stream audio file
     * GET /api/audio-files/:id/stream
     */
    streamAudioFile(req: Request, res: Response): Promise<Response>;
    /**
     * Delete audio file
     * DELETE /api/audio-files/:id
     */
    deleteAudioFile(req: Request, res: Response): Promise<Response>;
    /**
     * Get audio file statistics
     * GET /api/audio-files/statistics
     */
    getAudioFileStatistics(req: Request, res: Response): Promise<Response>;
    /**
     * Get audio files by uploader
     * GET /api/audio-files/user/:userId
     */
    getAudioFilesByUser(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=AudioFileController.d.ts.map