/**
 * Delete Audio File Use Case
 * Handles audio file deletion with validation
 */
import { IUseCase, UseCaseResult } from '../base/IUseCase';
import { IAudioFileRepository } from '@/core/domain/repositories/IAudioFileRepository';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
export interface DeleteAudioFileRequest {
    audioFileId: string;
    deletedBy: string;
    deleteFromDisk?: boolean;
    force?: boolean;
}
export interface DeleteAudioFileResponse {
    success: boolean;
    message: string;
}
export declare class DeleteAudioFileUseCase implements IUseCase<DeleteAudioFileRequest, UseCaseResult<DeleteAudioFileResponse>> {
    private audioFileRepository;
    private broadcastRepository;
    constructor(audioFileRepository: IAudioFileRepository, broadcastRepository: IBroadcastRepository);
    execute(request: DeleteAudioFileRequest): Promise<UseCaseResult<DeleteAudioFileResponse>>;
}
//# sourceMappingURL=DeleteAudioFileUseCase.d.ts.map