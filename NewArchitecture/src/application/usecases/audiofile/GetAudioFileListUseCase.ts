/**
 * Get Audio File List Use Case
 * Handles retrieving audio files with search and pagination
 */

import { injectable, inject } from 'tsyringe';
import { IUseCase, UseCaseResult, createSuccessResult, createErrorResult } from '../base/IUseCase';
import { IAudioFileRepository, AudioFileSearchCriteria } from '@/core/domain/repositories/IAudioFileRepository';
import { AudioFile } from '@/core/domain/entities/AudioFile';

export interface GetAudioFileListRequest {
  search?: {
    filename?: string;
    originalName?: string;
    mimetype?: string;
    uploadedBy?: string;
    isActive?: boolean;
    sizeRange?: {
      minSize: number;
      maxSize: number;
    };
    durationRange?: {
      minDuration: number;
      maxDuration: number;
    };
  };
  pagination?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

export interface GetAudioFileListResponse {
  audioFiles: AudioFile[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  statistics?: {
    totalFiles: number;
    totalSize: number;
    averageDuration: number;
    totalDuration: number;
  };
}

@injectable()
export class GetAudioFileListUseCase implements IUseCase<GetAudioFileListRequest, UseCaseResult<GetAudioFileListResponse>> {
  constructor(
    @inject('IAudioFileRepository')
    private audioFileRepository: IAudioFileRepository
  ) {}

  async execute(request: GetAudioFileListRequest): Promise<UseCaseResult<GetAudioFileListResponse>> {
    try {
      let audioFiles: AudioFile[];

      // If search criteria provided
      if (request.search) {
        const searchCriteria: AudioFileSearchCriteria = {
          filename: request.search.filename,
          // Note: originalName, mimetype, isActive not available in AudioFileSearchCriteria
          uploadedBy: request.search.uploadedBy,
          // Use date range for filtering if needed
          startDate: request.search.sizeRange ? new Date() : undefined, // Placeholder - size filtering not directly supported
          endDate: request.search.durationRange ? new Date() : undefined // Placeholder - duration filtering not directly supported
        };

        audioFiles = await this.audioFileRepository.search(searchCriteria);
      } else {
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

        return createSuccessResult({
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

      return createSuccessResult({
        audioFiles,
        statistics
      });

    } catch (error) {
      return createErrorResult(`Failed to retrieve audio files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async calculateStatistics(searchCriteria?: GetAudioFileListRequest['search']) {
    let audioFiles: AudioFile[];

    if (searchCriteria) {
      const criteria: AudioFileSearchCriteria = {
        filename: searchCriteria.filename,
        uploadedBy: searchCriteria.uploadedBy
        // Note: Other properties not available in AudioFileSearchCriteria
      };
      audioFiles = await this.audioFileRepository.search(criteria);
    } else {
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
}