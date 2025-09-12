"use strict";
/**
 * AudioFile Domain Entity
 * Represents audio files used for broadcasts and recordings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFile = exports.AudioFileStatus = exports.AudioFileFormat = exports.AudioFileType = void 0;
var AudioFileType;
(function (AudioFileType) {
    AudioFileType["RECORDING"] = "recording";
    AudioFileType["TTS"] = "tts";
    AudioFileType["UPLOADED"] = "uploaded";
    AudioFileType["SYSTEM"] = "system";
    AudioFileType["CALL_RECORDING"] = "call_recording";
})(AudioFileType || (exports.AudioFileType = AudioFileType = {}));
var AudioFileFormat;
(function (AudioFileFormat) {
    AudioFileFormat["MP3"] = "mp3";
    AudioFileFormat["WAV"] = "wav";
    AudioFileFormat["OGG"] = "ogg";
    AudioFileFormat["OPUS"] = "opus";
    AudioFileFormat["G711"] = "g711";
    AudioFileFormat["G729"] = "g729";
})(AudioFileFormat || (exports.AudioFileFormat = AudioFileFormat = {}));
var AudioFileStatus;
(function (AudioFileStatus) {
    AudioFileStatus["PENDING"] = "pending";
    AudioFileStatus["PROCESSING"] = "processing";
    AudioFileStatus["READY"] = "ready";
    AudioFileStatus["FAILED"] = "failed";
    AudioFileStatus["DELETED"] = "deleted";
})(AudioFileStatus || (exports.AudioFileStatus = AudioFileStatus = {}));
class AudioFile {
    _id;
    _filename;
    _originalName;
    _path;
    _url;
    _type;
    _format;
    _status;
    _size;
    _duration;
    _sampleRate;
    _bitRate;
    _channels;
    _text;
    _language;
    _voice;
    _broadcastId;
    _callId;
    _uploadedBy;
    _transcription;
    _metadata;
    _createdAt;
    _updatedAt;
    constructor(props) {
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
    get id() {
        return this._id;
    }
    get filename() {
        return this._filename;
    }
    get originalName() {
        return this._originalName;
    }
    get path() {
        return this._path;
    }
    get url() {
        return this._url;
    }
    get type() {
        return this._type;
    }
    get format() {
        return this._format;
    }
    get status() {
        return this._status;
    }
    get size() {
        return this._size;
    }
    get duration() {
        return this._duration;
    }
    get sampleRate() {
        return this._sampleRate;
    }
    get bitRate() {
        return this._bitRate;
    }
    get channels() {
        return this._channels;
    }
    get text() {
        return this._text;
    }
    get language() {
        return this._language;
    }
    get voice() {
        return this._voice;
    }
    get broadcastId() {
        return this._broadcastId;
    }
    get callId() {
        return this._callId;
    }
    get uploadedBy() {
        return this._uploadedBy;
    }
    get transcription() {
        return this._transcription;
    }
    get metadata() {
        return this._metadata;
    }
    get createdAt() {
        return this._createdAt;
    }
    get updatedAt() {
        return this._updatedAt;
    }
    // Business methods
    startProcessing() {
        if (this._status !== AudioFileStatus.PENDING) {
            throw new Error('Can only process pending files');
        }
        this._status = AudioFileStatus.PROCESSING;
        this.updateTimestamp();
    }
    markAsReady() {
        if (this._status !== AudioFileStatus.PROCESSING) {
            throw new Error('Can only mark processing files as ready');
        }
        this._status = AudioFileStatus.READY;
        this.updateTimestamp();
    }
    markAsFailed(reason) {
        this._status = AudioFileStatus.FAILED;
        if (reason && this._metadata) {
            this._metadata.failureReason = reason;
        }
        this.updateTimestamp();
    }
    markAsDeleted() {
        this._status = AudioFileStatus.DELETED;
        this.updateTimestamp();
    }
    updateUrl(url) {
        this._url = url;
        this.updateTimestamp();
    }
    updatePath(path) {
        this._path = path;
        this.updateTimestamp();
    }
    updateDuration(duration) {
        if (duration < 0) {
            throw new Error('Duration cannot be negative');
        }
        this._duration = duration;
        this.updateTimestamp();
    }
    updateAudioProperties(props) {
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
    setTranscription(transcription) {
        this._transcription = transcription;
        this.updateTimestamp();
    }
    associateWithBroadcast(broadcastId) {
        this._broadcastId = broadcastId;
        this.updateTimestamp();
    }
    associateWithCall(callId) {
        this._callId = callId;
        this.updateTimestamp();
    }
    updateMetadata(key, value) {
        if (!this._metadata) {
            this._metadata = {};
        }
        this._metadata[key] = value;
        this.updateTimestamp();
    }
    // Validation
    validateProps(props) {
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
    updateTimestamp() {
        this._updatedAt = new Date();
    }
    // Business rules
    isReady() {
        return this._status === AudioFileStatus.READY;
    }
    isProcessing() {
        return this._status === AudioFileStatus.PROCESSING;
    }
    isFailed() {
        return this._status === AudioFileStatus.FAILED;
    }
    isDeleted() {
        return this._status === AudioFileStatus.DELETED;
    }
    canBeUsed() {
        return this._status === AudioFileStatus.READY;
    }
    isTTS() {
        return this._type === AudioFileType.TTS;
    }
    isRecording() {
        return this._type === AudioFileType.RECORDING ||
            this._type === AudioFileType.CALL_RECORDING;
    }
    getFormattedDuration() {
        if (!this._duration)
            return '0:00';
        const minutes = Math.floor(this._duration / 60);
        const seconds = Math.floor(this._duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    getFormattedSize() {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = this._size;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    isValidForBroadcast() {
        return this.isReady() &&
            (this._format === AudioFileFormat.MP3 ||
                this._format === AudioFileFormat.WAV ||
                this._format === AudioFileFormat.G711);
    }
    needsConversion() {
        // Check if format needs conversion for telephony
        return this._format === AudioFileFormat.OGG ||
            this._format === AudioFileFormat.OPUS;
    }
    // Factory method
    static create(props) {
        return new AudioFile(props);
    }
    // Convert to plain object
    toObject() {
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
exports.AudioFile = AudioFile;
//# sourceMappingURL=AudioFile.js.map