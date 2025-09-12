/**
 * Upload Audio File Use Case
 * Handles audio file upload and validation
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IAudioFileRepository } from '@/core/domain/repositories/IAudioFileRepository';
import { AudioFile, AudioFileType, AudioFileFormat, AudioFileStatus } from '@/core/domain/entities/AudioFile';

export interface UploadAudioFileRequest {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedBy: string;
  description?: string;
}

export interface UploadAudioFileResponse {
  audioFile: AudioFile;
}

@injectable()
export class UploadAudioFileUseCase implements IUseCase<UploadAudioFileRequest, UseCaseResult<UploadAudioFileResponse>> {
  constructor(
    @inject('IAudioFileRepository')
    private audioFileRepository: IAudioFileRepository
  ) {}

  private readonly ALLOWED_MIME_TYPES = [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp3',
    'audio/ogg',
    'audio/aac',
    'audio/x-wav',
    'audio/webm'
  ];

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  async execute(request: UploadAudioFileRequest): Promise<UseCaseResult<UploadAudioFileResponse>> {
    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.isValid) {
        return createErrorResult('Validation failed', validation.errors);
      }

      // Check if filename already exists
      const existingFile = await this.audioFileRepository.findByFilename(request.filename);
      if (existingFile) {
        return createErrorResult('File with this name already exists');
      }

      // Calculate duration (would normally use audio processing library)
      const duration = await this.calculateAudioDuration(request.path);

      // Create audio file entity
      const audioFile = AudioFile.create({
        filename: request.filename,
        originalName: request.originalName,
        // Note: mimetype not available in AudioFileProps, using format instead
        type: AudioFileType.UPLOADED,
        format: AudioFileFormat.MP3, // Default format, should be determined from file
        status: AudioFileStatus.READY,
        size: request.size,
        path: request.path,
        duration: duration,
        uploadedBy: request.uploadedBy
        // Note: description and isActive not available in AudioFileProps
      });

      // Save audio file record
      const savedAudioFile = await this.audioFileRepository.save(audioFile);

      return createSuccessResult({
        audioFile: savedAudioFile
      });

    } catch (error) {
      return createErrorResult(`Failed to upload audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateRequest(request: UploadAudioFileRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.filename?.trim()) {
      errors.push('Filename is required');
    }

    if (!request.originalName?.trim()) {
      errors.push('Original filename is required');
    }

    if (!request.mimetype?.trim()) {
      errors.push('MIME type is required');
    } else if (!this.ALLOWED_MIME_TYPES.includes(request.mimetype)) {
      errors.push(`Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (!request.size || request.size <= 0) {
      errors.push('File size must be greater than 0');
    } else if (request.size > this.MAX_FILE_SIZE) {
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

  private async calculateAudioDuration(filePath: string): Promise<number> {
    // In a real implementation, you would use a library like node-ffmpeg
    // or similar to get the actual audio duration
    // For now, return a placeholder duration
    try {
      // Placeholder implementation - in real app use ffprobe or similar
      return 0; // Duration in seconds
    } catch (error) {
      // If duration calculation fails, return 0
      return 0;
    }
  }
}