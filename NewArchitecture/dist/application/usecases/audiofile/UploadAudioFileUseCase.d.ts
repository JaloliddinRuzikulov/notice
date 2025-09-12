/**
 * Upload Audio File Use Case
 * Handles audio file upload and validation
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IAudioFileRepository } from '@/core/domain/repositories/IAudioFileRepository';
import { AudioFile } from '@/core/domain/entities/AudioFile';
export interface UploadAudioFileRequest {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    uploadedBy: string;
    description?: string;
}
export interface UploadAudioFileResponse {
    audioFile: AudioFile;
}
export declare class UploadAudioFileUseCase implements IUseCase<UploadAudioFileRequest, UseCaseResult<UploadAudioFileResponse>> {
    private audioFileRepository;
    constructor(audioFileRepository: IAudioFileRepository);
    private readonly ALLOWED_MIME_TYPES;
    private readonly MAX_FILE_SIZE;
    execute(request: UploadAudioFileRequest): Promise<UseCaseResult<UploadAudioFileResponse>>;
    private validateRequest;
    private calculateAudioDuration;
}
//# sourceMappingURL=UploadAudioFileUseCase.d.ts.map