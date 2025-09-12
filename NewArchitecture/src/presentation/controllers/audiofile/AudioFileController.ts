/**
 * Audio File Controller
 * Handles HTTP requests for audio file management
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { BaseController } from '../base/BaseController';
import { UploadAudioFileUseCase } from '@/application/usecases/audiofile/UploadAudioFileUseCase';
import { GetAudioFileListUseCase } from '@/application/usecases/audiofile/GetAudioFileListUseCase';
import { DeleteAudioFileUseCase } from '@/application/usecases/audiofile/DeleteAudioFileUseCase';
import { AudioFileMapper } from '@/application/mappers/audiofile/AudioFileMapper';
import { UploadAudioFileDTO, AudioFileSearchDTO, DeleteAudioFileDTO } from '@/application/dto/audiofile/AudioFileDTO';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

@injectable()
export class AudioFileController extends BaseController {
  constructor(
    @inject(UploadAudioFileUseCase)
    private uploadAudioFileUseCase: UploadAudioFileUseCase,
    @inject(GetAudioFileListUseCase)
    private getAudioFileListUseCase: GetAudioFileListUseCase,
    @inject(DeleteAudioFileUseCase)
    private deleteAudioFileUseCase: DeleteAudioFileUseCase,
    @inject(AudioFileMapper)
    private audioFileMapper: AudioFileMapper
  ) {
    super();
  }

  /**
   * Upload audio file
   * POST /api/audio-files
   */
  async uploadAudioFile(req: Request, res: Response): Promise<Response> {
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
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${timestamp}-${randomSuffix}${fileExtension}`;

      const uploadDTO: UploadAudioFileDTO = {
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
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
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
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error uploading audio file:', error);

      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return this.internalError(res, 'Failed to upload audio file');
    }
  }

  /**
   * Get audio file list with search and pagination
   * GET /api/audio-files
   */
  async getAudioFiles(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.getPaginationFromQuery(req);
      
      const search: AudioFileSearchDTO = {
        filename: req.query.filename as string,
        originalName: req.query.originalName as string,
        mimetype: req.query.mimetype as string,
        uploadedBy: req.query.uploadedBy as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };

      // Handle size range
      if (req.query.minSize || req.query.maxSize) {
        search.sizeRange = {
          minSize: req.query.minSize ? parseInt(req.query.minSize as string) : 0,
          maxSize: req.query.maxSize ? parseInt(req.query.maxSize as string) : Infinity
        };
      }

      // Handle duration range
      if (req.query.minDuration || req.query.maxDuration) {
        search.durationRange = {
          minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : 0,
          maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : Infinity
        };
      }

      // Remove undefined values
      Object.keys(search).forEach(key => 
        search[key as keyof AudioFileSearchDTO] === undefined && delete search[key as keyof AudioFileSearchDTO]
      );

      const result = await this.getAudioFileListUseCase.execute({
        search: Object.keys(search).length > 0 ? search : undefined,
        pagination
      });

      if (result.success && result.data) {
        const audioFileDTOs = result.data.audioFiles.map(file => this.audioFileMapper.toDTO(file));
        
        if (result.data.pagination) {
          return this.paginated(res, audioFileDTOs, result.data.pagination);
        } else {
          return this.success(res, {
            audioFiles: audioFileDTOs,
            statistics: result.data.statistics
          });
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting audio files:', error);
      return this.internalError(res, 'Failed to retrieve audio files');
    }
  }

  /**
   * Get audio file by ID
   * GET /api/audio-files/:id
   */
  async getAudioFileById(req: Request, res: Response): Promise<Response> {
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

    } catch (error) {
      console.error('Error getting audio file by ID:', error);
      return this.internalError(res, 'Failed to retrieve audio file');
    }
  }

  /**
   * Download audio file
   * GET /api/audio-files/:id/download
   */
  async downloadAudioFile(req: Request, res: Response): Promise<Response> {
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
          if (!fs.existsSync(fileData.path)) {
            return this.notFound(res, 'Audio file not found on disk');
          }

          // Set headers for file download
          res.setHeader('Content-Type', fileData.mimetype);
          res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalName}"`);
          res.setHeader('Content-Length', fileData.size);

          // Stream the file
          const fileStream = fs.createReadStream(fileData.path);
          fileStream.pipe(res);
          return res;
        }
      }

      return this.notFound(res, 'Audio file not found');

    } catch (error) {
      console.error('Error downloading audio file:', error);
      return this.internalError(res, 'Failed to download audio file');
    }
  }

  /**
   * Stream audio file
   * GET /api/audio-files/:id/stream
   */
  async streamAudioFile(req: Request, res: Response): Promise<Response> {
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
          if (!fs.existsSync(fileData.path)) {
            return this.notFound(res, 'Audio file not found on disk');
          }

          const stat = fs.statSync(fileData.path);
          const fileSize = stat.size;
          const range = req.headers.range;

          if (range) {
            // Handle range requests for audio streaming
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            
            const file = fs.createReadStream(fileData.path, { start, end });
            const head = {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': fileData.mimetype,
            };
            
            res.writeHead(206, head);
            file.pipe(res);
          } else {
            // No range request
            const head = {
              'Content-Length': fileSize,
              'Content-Type': fileData.mimetype,
            };
            
            res.writeHead(200, head);
            fs.createReadStream(fileData.path).pipe(res);
          }
          
          return res;
        }
      }

      return this.notFound(res, 'Audio file not found');

    } catch (error) {
      console.error('Error streaming audio file:', error);
      return this.internalError(res, 'Failed to stream audio file');
    }
  }

  /**
   * Delete audio file
   * DELETE /api/audio-files/:id
   */
  async deleteAudioFile(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const { id } = req.params;

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!id) {
        return this.badRequest(res, 'Audio file ID is required');
      }

      const deleteDTO: DeleteAudioFileDTO = {
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

    } catch (error) {
      console.error('Error deleting audio file:', error);
      return this.internalError(res, 'Failed to delete audio file');
    }
  }

  /**
   * Get audio file statistics
   * GET /api/audio-files/statistics
   */
  async getAudioFileStatistics(req: Request, res: Response): Promise<Response> {
    try {
      const result = await this.getAudioFileListUseCase.execute({});

      if (result.success && result.data && result.data.statistics) {
        return this.success(res, result.data.statistics);
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting audio file statistics:', error);
      return this.internalError(res, 'Failed to retrieve audio file statistics');
    }
  }

  /**
   * Get audio files by uploader
   * GET /api/audio-files/user/:userId
   */
  async getAudioFilesByUser(req: Request, res: Response): Promise<Response> {
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
        } else {
          return this.success(res, audioFileDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting audio files by user:', error);
      return this.internalError(res, 'Failed to retrieve user audio files');
    }
  }
}