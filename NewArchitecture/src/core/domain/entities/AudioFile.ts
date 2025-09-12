/**
 * AudioFile Domain Entity
 * Represents audio files used for broadcasts and recordings
 */

export enum AudioFileType {
  RECORDING = 'recording',
  TTS = 'tts',
  UPLOADED = 'uploaded',
  SYSTEM = 'system',
  CALL_RECORDING = 'call_recording'
}

export enum AudioFileFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
  OPUS = 'opus',
  G711 = 'g711',
  G729 = 'g729'
}

export enum AudioFileStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  DELETED = 'deleted'
}

export interface AudioFileProps {
  id?: string;
  filename: string;
  originalName: string;
  path: string;
  url?: string;
  type: AudioFileType;
  format: AudioFileFormat;
  mimetype?: string;
  status: AudioFileStatus;
  size: number; // bytes
  duration?: number; // seconds
  sampleRate?: number; // Hz
  bitRate?: number; // kbps
  channels?: number;
  text?: string; // For TTS files
  language?: string; // For TTS files
  voice?: string; // TTS voice used
  broadcastId?: string;
  callId?: string;
  uploadedBy?: string;
  transcription?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AudioFile {
  private readonly _id?: string;
  private _filename: string;
  private _originalName: string;
  private _path: string;
  private _url?: string;
  private _type: AudioFileType;
  private _format: AudioFileFormat;
  private _status: AudioFileStatus;
  private _size: number;
  private _duration?: number;
  private _sampleRate?: number;
  private _bitRate?: number;
  private _channels?: number;
  private _text?: string;
  private _language?: string;
  private _voice?: string;
  private _broadcastId?: string;
  private _callId?: string;
  private _uploadedBy?: string;
  private _transcription?: string;
  private _metadata?: Record<string, any>;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AudioFileProps) {
    this.validateProps(props);
    
    this._id = props.id;
    this._filename = props.filename;
    this._originalName = props.originalName;
    this._path = props.path;
    this._url = props.url;
    this._type = props.type;
    this._format = props.format;
    this._status = props.status;
    this._size = props.size;
    this._duration = props.duration;
    this._sampleRate = props.sampleRate;
    this._bitRate = props.bitRate;
    this._channels = props.channels;
    this._text = props.text;
    this._language = props.language;
    this._voice = props.voice;
    this._broadcastId = props.broadcastId;
    this._callId = props.callId;
    this._uploadedBy = props.uploadedBy;
    this._transcription = props.transcription;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get filename(): string {
    return this._filename;
  }

  get originalName(): string {
    return this._originalName;
  }

  get path(): string {
    return this._path;
  }

  get url(): string | undefined {
    return this._url;
  }

  get type(): AudioFileType {
    return this._type;
  }

  get format(): AudioFileFormat {
    return this._format;
  }

  get status(): AudioFileStatus {
    return this._status;
  }

  get size(): number {
    return this._size;
  }

  get duration(): number | undefined {
    return this._duration;
  }

  get sampleRate(): number | undefined {
    return this._sampleRate;
  }

  get bitRate(): number | undefined {
    return this._bitRate;
  }

  get channels(): number | undefined {
    return this._channels;
  }

  get text(): string | undefined {
    return this._text;
  }

  get language(): string | undefined {
    return this._language;
  }

  get voice(): string | undefined {
    return this._voice;
  }

  get broadcastId(): string | undefined {
    return this._broadcastId;
  }

  get callId(): string | undefined {
    return this._callId;
  }

  get uploadedBy(): string | undefined {
    return this._uploadedBy;
  }

  get transcription(): string | undefined {
    return this._transcription;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  startProcessing(): void {
    if (this._status !== AudioFileStatus.PENDING) {
      throw new Error('Can only process pending files');
    }
    this._status = AudioFileStatus.PROCESSING;
    this.updateTimestamp();
  }

  markAsReady(): void {
    if (this._status !== AudioFileStatus.PROCESSING) {
      throw new Error('Can only mark processing files as ready');
    }
    this._status = AudioFileStatus.READY;
    this.updateTimestamp();
  }

  markAsFailed(reason?: string): void {
    this._status = AudioFileStatus.FAILED;
    if (reason && this._metadata) {
      this._metadata.failureReason = reason;
    }
    this.updateTimestamp();
  }

  markAsDeleted(): void {
    this._status = AudioFileStatus.DELETED;
    this.updateTimestamp();
  }

  updateUrl(url: string): void {
    this._url = url;
    this.updateTimestamp();
  }

  updatePath(path: string): void {
    this._path = path;
    this.updateTimestamp();
  }

  updateDuration(duration: number): void {
    if (duration < 0) {
      throw new Error('Duration cannot be negative');
    }
    this._duration = duration;
    this.updateTimestamp();
  }

  updateAudioProperties(props: {
    duration?: number;
    sampleRate?: number;
    bitRate?: number;
    channels?: number;
  }): void {
    if (props.duration !== undefined) {
      this._duration = props.duration;
    }
    if (props.sampleRate !== undefined) {
      this._sampleRate = props.sampleRate;
    }
    if (props.bitRate !== undefined) {
      this._bitRate = props.bitRate;
    }
    if (props.channels !== undefined) {
      this._channels = props.channels;
    }
    this.updateTimestamp();
  }

  setTranscription(transcription: string): void {
    this._transcription = transcription;
    this.updateTimestamp();
  }

  associateWithBroadcast(broadcastId: string): void {
    this._broadcastId = broadcastId;
    this.updateTimestamp();
  }

  associateWithCall(callId: string): void {
    this._callId = callId;
    this.updateTimestamp();
  }

  updateMetadata(key: string, value: any): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    this._metadata[key] = value;
    this.updateTimestamp();
  }

  // Validation
  private validateProps(props: AudioFileProps): void {
    if (!props.filename || props.filename.trim().length === 0) {
      throw new Error('Filename is required');
    }
    if (!props.originalName || props.originalName.trim().length === 0) {
      throw new Error('Original name is required');
    }
    if (!props.path || props.path.trim().length === 0) {
      throw new Error('Path is required');
    }
    if (props.size < 0) {
      throw new Error('File size cannot be negative');
    }
    if (props.duration !== undefined && props.duration < 0) {
      throw new Error('Duration cannot be negative');
    }
    if (props.type === AudioFileType.TTS && !props.text) {
      throw new Error('TTS files must have text content');
    }
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // Business rules
  isReady(): boolean {
    return this._status === AudioFileStatus.READY;
  }

  isProcessing(): boolean {
    return this._status === AudioFileStatus.PROCESSING;
  }

  isFailed(): boolean {
    return this._status === AudioFileStatus.FAILED;
  }

  isDeleted(): boolean {
    return this._status === AudioFileStatus.DELETED;
  }

  canBeUsed(): boolean {
    return this._status === AudioFileStatus.READY;
  }

  isTTS(): boolean {
    return this._type === AudioFileType.TTS;
  }

  isRecording(): boolean {
    return this._type === AudioFileType.RECORDING || 
           this._type === AudioFileType.CALL_RECORDING;
  }

  getFormattedDuration(): string {
    if (!this._duration) return '0:00';
    
    const minutes = Math.floor(this._duration / 60);
    const seconds = Math.floor(this._duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getFormattedSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this._size;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  isValidForBroadcast(): boolean {
    return this.isReady() && 
           (this._format === AudioFileFormat.MP3 || 
            this._format === AudioFileFormat.WAV || 
            this._format === AudioFileFormat.G711);
  }

  needsConversion(): boolean {
    // Check if format needs conversion for telephony
    return this._format === AudioFileFormat.OGG || 
           this._format === AudioFileFormat.OPUS;
  }

  // Factory method
  static create(props: AudioFileProps): AudioFile {
    return new AudioFile(props);
  }

  // Convert to plain object
  toObject(): AudioFileProps {
    return {
      id: this._id,
      filename: this._filename,
      originalName: this._originalName,
      path: this._path,
      url: this._url,
      type: this._type,
      format: this._format,
      status: this._status,
      size: this._size,
      duration: this._duration,
      sampleRate: this._sampleRate,
      bitRate: this._bitRate,
      channels: this._channels,
      text: this._text,
      language: this._language,
      voice: this._voice,
      broadcastId: this._broadcastId,
      callId: this._callId,
      uploadedBy: this._uploadedBy,
      transcription: this._transcription,
      metadata: this._metadata ? { ...this._metadata } : undefined,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}