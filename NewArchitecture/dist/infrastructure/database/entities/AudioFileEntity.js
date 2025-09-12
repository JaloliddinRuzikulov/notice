"use strict";
/**
 * AudioFile Entity for TypeORM
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFileEntity = exports.AudioFileStatusDB = exports.AudioFileFormatDB = exports.AudioFileTypeDB = void 0;
const typeorm_1 = require("typeorm");
var AudioFileTypeDB;
(function (AudioFileTypeDB) {
    AudioFileTypeDB["RECORDING"] = "recording";
    AudioFileTypeDB["TTS"] = "tts";
    AudioFileTypeDB["UPLOADED"] = "uploaded";
    AudioFileTypeDB["SYSTEM"] = "system";
    AudioFileTypeDB["CALL_RECORDING"] = "call_recording";
})(AudioFileTypeDB || (exports.AudioFileTypeDB = AudioFileTypeDB = {}));
var AudioFileFormatDB;
(function (AudioFileFormatDB) {
    AudioFileFormatDB["MP3"] = "mp3";
    AudioFileFormatDB["WAV"] = "wav";
    AudioFileFormatDB["OGG"] = "ogg";
    AudioFileFormatDB["OPUS"] = "opus";
    AudioFileFormatDB["G711"] = "g711";
    AudioFileFormatDB["G729"] = "g729";
})(AudioFileFormatDB || (exports.AudioFileFormatDB = AudioFileFormatDB = {}));
var AudioFileStatusDB;
(function (AudioFileStatusDB) {
    AudioFileStatusDB["PENDING"] = "pending";
    AudioFileStatusDB["PROCESSING"] = "processing";
    AudioFileStatusDB["READY"] = "ready";
    AudioFileStatusDB["FAILED"] = "failed";
    AudioFileStatusDB["DELETED"] = "deleted";
})(AudioFileStatusDB || (exports.AudioFileStatusDB = AudioFileStatusDB = {}));
let AudioFileEntity = class AudioFileEntity {
    id;
    filename;
    originalName;
    path;
    url;
    type;
    format;
    status;
    size; // bytes
    duration; // seconds
    sampleRate;
    bitRate;
    channels;
    text; // For TTS
    language;
    voice;
    broadcastId;
    callId;
    uploadedBy;
    transcription;
    metadata;
    createdAt;
    updatedAt;
};
exports.AudioFileEntity = AudioFileEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AudioFileTypeDB,
        default: AudioFileTypeDB.UPLOADED
    }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AudioFileFormatDB,
        default: AudioFileFormatDB.MP3
    }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AudioFileStatusDB,
        default: AudioFileStatusDB.PENDING
    }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], AudioFileEntity.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], AudioFileEntity.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], AudioFileEntity.prototype, "sampleRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], AudioFileEntity.prototype, "bitRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], AudioFileEntity.prototype, "channels", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "voice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "broadcastId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "callId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AudioFileEntity.prototype, "transcription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AudioFileEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AudioFileEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AudioFileEntity.prototype, "updatedAt", void 0);
exports.AudioFileEntity = AudioFileEntity = __decorate([
    (0, typeorm_1.Entity)('audio_files'),
    (0, typeorm_1.Index)(['filename']),
    (0, typeorm_1.Index)(['type']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['broadcastId'])
], AudioFileEntity);
//# sourceMappingURL=AudioFileEntity.js.map