/**
 * AudioFile Entity for TypeORM
 */
export declare enum AudioFileTypeDB {
    RECORDING = "recording",
    TTS = "tts",
    UPLOADED = "uploaded",
    SYSTEM = "system",
    CALL_RECORDING = "call_recording"
}
export declare enum AudioFileFormatDB {
    MP3 = "mp3",
    WAV = "wav",
    OGG = "ogg",
    OPUS = "opus",
    G711 = "g711",
    G729 = "g729"
}
export declare enum AudioFileStatusDB {
    PENDING = "pending",
    PROCESSING = "processing",
    READY = "ready",
    FAILED = "failed",
    DELETED = "deleted"
}
export declare class AudioFileEntity {
    id: string;
    filename: string;
    originalName: string;
    path: string;
    url?: string;
    type: AudioFileTypeDB;
    format: AudioFileFormatDB;
    status: AudioFileStatusDB;
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
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=AudioFileEntity.d.ts.map