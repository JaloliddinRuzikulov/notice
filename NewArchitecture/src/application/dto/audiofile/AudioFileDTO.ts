/**
 * Audio File Data Transfer Objects
 */

import { BaseDTO } from '../base/BaseDTO';

export class AudioFileDTO extends BaseDTO {
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
  }) {
    super({
      id: data.id,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    });

    this.filename = data.filename;
    this.originalName = data.originalName;
    this.mimetype = data.mimetype;
    this.size = data.size;
    this.path = data.path;
    this.duration = data.duration;
    this.uploadedBy = data.uploadedBy;
    this.description = data.description;
    this.isActive = data.isActive;
  }

  get formattedSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  get formattedDuration(): string {
    if (this.duration < 60) {
      return `${this.duration}s`;
    }
    
    const minutes = Math.floor(this.duration / 60);
    const seconds = this.duration % 60;
    
    if (minutes < 60) {
      return `${minutes}m ${seconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m ${seconds}s`;
  }

  get fileExtension(): string {
    return this.filename.split('.').pop() || '';
  }
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