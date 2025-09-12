/**
 * AudioFile Entity for TypeORM
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AudioFileTypeDB {
  RECORDING = 'recording',
  TTS = 'tts',
  UPLOADED = 'uploaded',
  SYSTEM = 'system',
  CALL_RECORDING = 'call_recording'
}

export enum AudioFileFormatDB {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
  OPUS = 'opus',
  G711 = 'g711',
  G729 = 'g729'
}

export enum AudioFileStatusDB {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted'
}

@Entity('audio_files')
@Index(['filename'])
@Index(['type'])
@Index(['status'])
@Index(['broadcastId'])
export class AudioFileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  filename!: string;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 500 })
  path!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'uploaded'
  })
  type!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'mp3'
  })
  format!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status!: string;

  @Column({ type: 'int' })
  size!: number; // bytes

  @Column({ type: 'int', nullable: true })
  duration?: number; // seconds

  @Column({ type: 'int', nullable: true })
  sampleRate?: number;

  @Column({ type: 'int', nullable: true })
  bitRate?: number;

  @Column({ type: 'int', nullable: true })
  channels?: number;

  @Column({ type: 'text', nullable: true })
  text?: string; // For TTS

  @Column({ type: 'varchar', length: 10, nullable: true })
  language?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  voice?: string;

  @Column({ type: 'uuid', nullable: true })
  broadcastId?: string;

  @Column({ type: 'uuid', nullable: true })
  callId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  uploadedBy?: string;

  @Column({ type: 'text', nullable: true })
  transcription?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}