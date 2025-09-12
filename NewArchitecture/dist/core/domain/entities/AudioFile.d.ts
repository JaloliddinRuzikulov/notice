/**
 * AudioFile Domain Entity
 * Represents audio files used for broadcasts and recordings
 */
export declare enum AudioFileType {
    RECORDING = "recording",
    TTS = "tts",
    UPLOADED = "uploaded",
    SYSTEM = "system",
    CALL_RECORDING = "call_recording"
}
export declare enum AudioFileFormat {
    MP3 = "mp3",
    WAV = "wav",
    OGG = "ogg",
    OPUS = "opus",
    G711 = "g711",
    G729 = "g729"
}
export declare enum AudioFileStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    READY = "ready",
    FAILED = "failed",
    DELETED = "deleted"
}
export interface AudioFileProps {
    id?: string;
    filename: string;
    originalName: string;
    path: string;
    url?: string;
    type: AudioFileType;
    format: AudioFileFormat;
    status: AudioFileStatus;
    size: number;
    duration?: number;
    sampleRate?: number;
    bitRate?: number;
    channels?: number;
    text?: string;
    language?: string;
    voice?: string;
    broadcastId?: string;
    callId?: string;
    uploadedBy?: string;
    transcription?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class AudioFile {
    private readonly _id?;
    private _filename;
    private _originalName;
    private _path;
    private _url?;
    private _type;
    private _format;
    private _status;
    private _size;
    private _duration?;
    private _sampleRate?;
    private _bitRate?;
    private _channels?;
    private _text?;
    private _language?;
    private _voice?;
    private _broadcastId?;
    private _callId?;
    private _uploadedBy?;
    private _transcription?;
    private _metadata?;
    private readonly _createdAt;
    private _updatedAt;
    constructor(props: AudioFileProps);
    get id(): string | undefined;
    get filename(): string;
    get originalName(): string;
    get path(): string;
    get url(): string | undefined;
    get type(): AudioFileType;
    get format(): AudioFileFormat;
    get status(): AudioFileStatus;
    get size(): number;
    get duration(): number | undefined;
    get sampleRate(): number | undefined;
    get bitRate(): number | undefined;
    get channels(): number | undefined;
    get text(): string | undefined;
    get language(): string | undefined;
    get voice(): string | undefined;
    get broadcastId(): string | undefined;
    get callId(): string | undefined;
    get uploadedBy(): string | undefined;
    get transcription(): string | undefined;
    get metadata(): Record<string, any> | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    startProcessing(): void;
    markAsReady(): void;
    markAsFailed(reason?: string): void;
    markAsDeleted(): void;
    updateUrl(url: string): void;
    updatePath(path: string): void;
    updateDuration(duration: number): void;
    updateAudioProperties(props: {
        duration?: number;
        sampleRate?: number;
        bitRate?: number;
        channels?: number;
    }): void;
    setTranscription(transcription: string): void;
    associateWithBroadcast(broadcastId: string): void;
    associateWithCall(callId: string): void;
    updateMetadata(key: string, value: any): void;
    private validateProps;
    private updateTimestamp;
    isReady(): boolean;
    isProcessing(): boolean;
    isFailed(): boolean;
    isDeleted(): boolean;
    canBeUsed(): boolean;
    isTTS(): boolean;
    isRecording(): boolean;
    getFormattedDuration(): string;
    getFormattedSize(): string;
    isValidForBroadcast(): boolean;
    needsConversion(): boolean;
    static create(props: AudioFileProps): AudioFile;
    toObject(): AudioFileProps;
}
//# sourceMappingURL=AudioFile.d.ts.map