/**
 * Audio File Data Transfer Objects
 */
import { BaseDTO } from '../base/BaseDTO';
export declare class AudioFileDTO extends BaseDTO {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    duration: number;
    uploadedBy: string;
    description?: string;
    isActive: boolean;
    constructor(data: {
        id: string;
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
        path: string;
        duration: number;
        uploadedBy: string;
        description?: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    });
    get formattedSize(): string;
    get formattedDuration(): string;
    get fileExtension(): string;
}
export interface UploadAudioFileDTO {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    description?: string;
}
export interface UpdateAudioFileDTO {
    filename?: string;
    description?: string;
    isActive?: boolean;
}
export interface AudioFileSearchDTO {
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
}
export interface AudioFileListRequestDTO {
    search?: AudioFileSearchDTO;
    pagination?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    };
}
export interface AudioFileStatisticsDTO {
    totalFiles: number;
    totalSize: number;
    averageDuration: number;
    totalDuration: number;
    mostUsedMimeType: string;
    largestFile: {
        id: string;
        filename: string;
        size: number;
    };
    longestFile: {
        id: string;
        filename: string;
        duration: number;
    };
}
export interface AudioFileUsageDTO {
    audioFileId: string;
    filename: string;
    broadcastCount: number;
    lastUsed?: Date;
    totalPlayTime: number;
}
export interface DeleteAudioFileDTO {
    deleteFromDisk?: boolean;
    force?: boolean;
}
//# sourceMappingURL=AudioFileDTO.d.ts.map