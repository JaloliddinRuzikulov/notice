/**
 * AudioFile Repository Interface
 * Domain layer repository contract for AudioFile entity
 */
import { AudioFile, AudioFileType, AudioFileFormat, AudioFileStatus } from '../entities/AudioFile';
export interface AudioFileSearchCriteria {
    filename?: string;
    type?: AudioFileType;
    format?: AudioFileFormat;
    status?: AudioFileStatus;
    broadcastId?: string;
    callId?: string;
    uploadedBy?: string;
    language?: string;
    startDate?: Date;
    endDate?: Date;
}
export interface IAudioFileRepository {
    findById(id: string): Promise<AudioFile | null>;
    findByFilename(filename: string): Promise<AudioFile | null>;
    findAll(): Promise<AudioFile[]>;
    save(audioFile: AudioFile): Promise<AudioFile>;
    update(id: string, audioFile: Partial<AudioFile>): Promise<AudioFile | null>;
    delete(id: string): Promise<boolean>;
    findByStatus(status: AudioFileStatus): Promise<AudioFile[]>;
    findReady(): Promise<AudioFile[]>;
    findProcessing(): Promise<AudioFile[]>;
    findFailed(): Promise<AudioFile[]>;
    updateStatus(id: string, status: AudioFileStatus): Promise<boolean>;
    findByType(type: AudioFileType): Promise<AudioFile[]>;
    findByFormat(format: AudioFileFormat): Promise<AudioFile[]>;
    findTTSFiles(): Promise<AudioFile[]>;
    findRecordings(): Promise<AudioFile[]>;
    findUploadedFiles(): Promise<AudioFile[]>;
    findByBroadcast(broadcastId: string): Promise<AudioFile[]>;
    findByCall(callId: string): Promise<AudioFile[]>;
    findByUploader(userId: string): Promise<AudioFile[]>;
    search(criteria: AudioFileSearchCriteria): Promise<AudioFile[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<AudioFile[]>;
    findByLanguage(language: string): Promise<AudioFile[]>;
    findWithTranscription(): Promise<AudioFile[]>;
    findWithoutTranscription(): Promise<AudioFile[]>;
    markAsDeleted(id: string): Promise<boolean>;
    deletePhysicalFile(id: string): Promise<boolean>;
    updatePath(id: string, path: string): Promise<boolean>;
    updateUrl(id: string, url: string): Promise<boolean>;
    updateDuration(id: string, duration: number): Promise<boolean>;
    updateTranscription(id: string, transcription: string): Promise<boolean>;
    findOrphaned(): Promise<AudioFile[]>;
    deleteOldFiles(beforeDate: Date): Promise<number>;
    cleanupFailedFiles(): Promise<number>;
    getTotalSize(): Promise<number>;
    getTotalDuration(): Promise<number>;
    countByType(): Promise<Record<string, number>>;
    countByFormat(): Promise<Record<string, number>>;
    countByStatus(): Promise<Record<string, number>>;
    exists(id: string): Promise<boolean>;
    existsByFilename(filename: string): Promise<boolean>;
    countTotal(): Promise<number>;
}
//# sourceMappingURL=IAudioFileRepository.d.ts.map