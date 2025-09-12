/**
 * AudioFile Repository Implementation
 * Maps AudioFile domain entity to database operations
 */

import { injectable } from 'tsyringe';
import { Repository, DataSource } from 'typeorm';
import { IAudioFileRepository, AudioFileSearchCriteria } from '@/core/domain/repositories/IAudioFileRepository';
import { AudioFile, AudioFileType, AudioFileFormat, AudioFileStatus } from '@/core/domain/entities/AudioFile';
import { AudioFileEntity } from '@/infrastructure/database/entities/AudioFileEntity';
import { DatabaseConnection } from '@/infrastructure/database/connection';

@injectable()
export class AudioFileRepository implements IAudioFileRepository {
  private repository: Repository<AudioFileEntity>;

  constructor() {
    const dataSource: DataSource = DatabaseConnection.getInstance().getDataSource();
    this.repository = dataSource.getRepository(AudioFileEntity);
  }

  // Convert entity to domain
  private toDomain(entity: AudioFileEntity): AudioFile {
    return AudioFile.create({
      id: entity.id,
      filename: entity.filename,
      originalName: entity.originalName,
      path: entity.path,
      url: entity.url,
      type: entity.type as AudioFileType,
      format: entity.format as AudioFileFormat,
      status: entity.status as AudioFileStatus,
      size: entity.size,
      duration: entity.duration,
      sampleRate: entity.sampleRate,
      bitRate: entity.bitRate,
      channels: entity.channels,
      text: entity.text,
      language: entity.language,
      voice: entity.voice,
      broadcastId: entity.broadcastId,
      callId: entity.callId,
      uploadedBy: entity.uploadedBy,
      transcription: entity.transcription,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  // Convert domain to entity
  private toEntity(domain: AudioFile): AudioFileEntity {
    const entity = new AudioFileEntity();
    
    if (domain.id) {
      entity.id = domain.id;
    }
    
    const props = domain.toObject();
    entity.filename = props.filename;
    entity.originalName = props.originalName;
    entity.path = props.path;
    entity.url = props.url;
    entity.type = props.type as string;
    entity.format = props.format as string;
    entity.status = props.status as string;
    entity.size = props.size;
    entity.duration = props.duration;
    entity.sampleRate = props.sampleRate;
    entity.bitRate = props.bitRate;
    entity.channels = props.channels;
    entity.text = props.text;
    entity.language = props.language;
    entity.voice = props.voice;
    entity.broadcastId = props.broadcastId;
    entity.callId = props.callId;
    entity.uploadedBy = props.uploadedBy;
    entity.transcription = props.transcription;
    entity.metadata = props.metadata;
    entity.createdAt = props.createdAt;
    entity.updatedAt = props.updatedAt;

    return entity;
  }

  // Basic CRUD operations
  async findById(id: string): Promise<AudioFile | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByFilename(filename: string): Promise<AudioFile | null> {
    const entity = await this.repository.findOne({ where: { filename } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<AudioFile[]> {
    const entities = await this.repository.find();
    return entities.map(entity => this.toDomain(entity));
  }

  async save(audioFile: AudioFile): Promise<AudioFile> {
    const entity = this.toEntity(audioFile);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(id: string, audioFile: Partial<AudioFile>): Promise<AudioFile | null> {
    await this.repository.update(id, audioFile as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  // Status management
  async findByStatus(status: AudioFileStatus): Promise<AudioFile[]> {
    const entities = await this.repository.find({ where: { status: status as string } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findReady(): Promise<AudioFile[]> {
    return this.findByStatus(AudioFileStatus.READY);
  }

  async findProcessing(): Promise<AudioFile[]> {
    return this.findByStatus(AudioFileStatus.PROCESSING);
  }

  async findFailed(): Promise<AudioFile[]> {
    return this.findByStatus(AudioFileStatus.FAILED);
  }

  async updateStatus(id: string, status: AudioFileStatus): Promise<boolean> {
    const result = await this.repository.update(id, { status: status as string });
    return result.affected ? result.affected > 0 : false;
  }

  // Type and format
  async findByType(type: AudioFileType): Promise<AudioFile[]> {
    const entities = await this.repository.find({ where: { type: type as string } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByFormat(format: AudioFileFormat): Promise<AudioFile[]> {
    const entities = await this.repository.find({ where: { format: format as string } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findTTSFiles(): Promise<AudioFile[]> {
    return this.findByType(AudioFileType.TTS);
  }

  async findRecordings(): Promise<AudioFile[]> {
    return this.findByType(AudioFileType.RECORDING);
  }

  async findUploadedFiles(): Promise<AudioFile[]> {
    return this.findByType(AudioFileType.UPLOADED);
  }

  // Associations
  async findByBroadcast(broadcastId: string): Promise<AudioFile[]> {
    const entities = await this.repository.find({ where: { broadcastId } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByCall(callId: string): Promise<AudioFile[]> {
    const entities = await this.repository.find({ where: { callId } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUploader(userId: string): Promise<AudioFile[]> {
    const entities = await this.repository.find({ where: { uploadedBy: userId } });
    return entities.map(entity => this.toDomain(entity));
  }

  // Search and filtering
  async search(criteria: AudioFileSearchCriteria): Promise<AudioFile[]> {
    const queryBuilder = this.repository.createQueryBuilder('audioFile');
    
    if (criteria.filename) {
      queryBuilder.andWhere('audioFile.filename LIKE :filename', { filename: `%${criteria.filename}%` });
    }
    if (criteria.type) {
      queryBuilder.andWhere('audioFile.type = :type', { type: criteria.type });
    }
    if (criteria.format) {
      queryBuilder.andWhere('audioFile.format = :format', { format: criteria.format });
    }
    if (criteria.status) {
      queryBuilder.andWhere('audioFile.status = :status', { status: criteria.status });
    }
    if (criteria.broadcastId) {
      queryBuilder.andWhere('audioFile.broadcastId = :broadcastId', { broadcastId: criteria.broadcastId });
    }
    if (criteria.callId) {
      queryBuilder.andWhere('audioFile.callId = :callId', { callId: criteria.callId });
    }
    if (criteria.uploadedBy) {
      queryBuilder.andWhere('audioFile.uploadedBy = :uploadedBy', { uploadedBy: criteria.uploadedBy });
    }
    if (criteria.language) {
      queryBuilder.andWhere('audioFile.language = :language', { language: criteria.language });
    }
    if (criteria.startDate) {
      queryBuilder.andWhere('audioFile.createdAt >= :startDate', { startDate: criteria.startDate });
    }
    if (criteria.endDate) {
      queryBuilder.andWhere('audioFile.createdAt <= :endDate', { endDate: criteria.endDate });
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AudioFile[]> {
    const entities = await this.repository.createQueryBuilder('audioFile')
      .where('audioFile.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findByLanguage(language: string): Promise<AudioFile[]> {
    const entities = await this.repository.find({ where: { language } });
    return entities.map(entity => this.toDomain(entity));
  }

  async findWithTranscription(): Promise<AudioFile[]> {
    const entities = await this.repository.createQueryBuilder('audioFile')
      .where('audioFile.transcription IS NOT NULL')
      .andWhere('audioFile.transcription != ""')
      .getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findWithoutTranscription(): Promise<AudioFile[]> {
    const entities = await this.repository.createQueryBuilder('audioFile')
      .where('audioFile.transcription IS NULL OR audioFile.transcription = ""')
      .getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  // File management
  async markAsDeleted(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { status: AudioFileStatus.DELETED as string });
    return result.affected ? result.affected > 0 : false;
  }

  async deletePhysicalFile(id: string): Promise<boolean> {
    // This would involve file system operations - placeholder implementation
    return true;
  }

  async updatePath(id: string, path: string): Promise<boolean> {
    const result = await this.repository.update(id, { path });
    return result.affected ? result.affected > 0 : false;
  }

  async updateUrl(id: string, url: string): Promise<boolean> {
    const result = await this.repository.update(id, { url });
    return result.affected ? result.affected > 0 : false;
  }

  // Audio properties
  async updateDuration(id: string, duration: number): Promise<boolean> {
    const result = await this.repository.update(id, { duration });
    return result.affected ? result.affected > 0 : false;
  }

  async updateTranscription(id: string, transcription: string): Promise<boolean> {
    const result = await this.repository.update(id, { transcription });
    return result.affected ? result.affected > 0 : false;
  }

  // Cleanup
  async findOrphaned(): Promise<AudioFile[]> {
    const entities = await this.repository.createQueryBuilder('audioFile')
      .where('audioFile.broadcastId IS NULL')
      .andWhere('audioFile.callId IS NULL')
      .getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async deleteOldFiles(beforeDate: Date): Promise<number> {
    const result = await this.repository.delete({
      createdAt: { $lt: beforeDate } as any
    });
    return result.affected || 0;
  }

  async cleanupFailedFiles(): Promise<number> {
    const result = await this.repository.delete({
      status: AudioFileStatus.FAILED as string
    });
    return result.affected || 0;
  }

  // Statistics
  async getTotalSize(): Promise<number> {
    const result = await this.repository.createQueryBuilder('audioFile')
      .select('SUM(audioFile.size)', 'totalSize')
      .getRawOne();
    return parseInt(result?.totalSize) || 0;
  }

  async getTotalDuration(): Promise<number> {
    const result = await this.repository.createQueryBuilder('audioFile')
      .select('SUM(audioFile.duration)', 'totalDuration')
      .getRawOne();
    return parseInt(result?.totalDuration) || 0;
  }

  async countByType(): Promise<Record<string, number>> {
    const results = await this.repository.createQueryBuilder('audioFile')
      .select(['audioFile.type', 'COUNT(*) as count'])
      .groupBy('audioFile.type')
      .getRawMany();
    
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.audioFile_type] = parseInt(result.count);
    });
    return counts;
  }

  async countByFormat(): Promise<Record<string, number>> {
    const results = await this.repository.createQueryBuilder('audioFile')
      .select(['audioFile.format', 'COUNT(*) as count'])
      .groupBy('audioFile.format')
      .getRawMany();
    
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.audioFile_format] = parseInt(result.count);
    });
    return counts;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const results = await this.repository.createQueryBuilder('audioFile')
      .select(['audioFile.status', 'COUNT(*) as count'])
      .groupBy('audioFile.status')
      .getRawMany();
    
    const counts: Record<string, number> = {};
    results.forEach(result => {
      counts[result.audioFile_status] = parseInt(result.count);
    });
    return counts;
  }

  // Check existence
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }

  async existsByFilename(filename: string): Promise<boolean> {
    const count = await this.repository.count({ where: { filename } });
    return count > 0;
  }

  async countTotal(): Promise<number> {
    return await this.repository.count();
  }
}