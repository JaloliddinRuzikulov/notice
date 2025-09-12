/**
 * Get Audio File List Use Case
 * Handles retrieving audio files with search and pagination
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IAudioFileRepository } from '@/core/domain/repositories/IAudioFileRepository';
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
export declare class GetAudioFileListUseCase implements IUseCase<GetAudioFileListRequest, UseCaseResult<GetAudioFileListResponse>> {
    private audioFileRepository;
    constructor(audioFileRepository: IAudioFileRepository);
    execute(request: GetAudioFileListRequest): Promise<UseCaseResult<GetAudioFileListResponse>>;
    private calculateStatistics;
}
//# sourceMappingURL=GetAudioFileListUseCase.d.ts.map