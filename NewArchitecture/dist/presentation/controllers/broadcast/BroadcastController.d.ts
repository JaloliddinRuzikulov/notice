/**
 * Broadcast Controller
 * Handles HTTP requests for broadcast management
 */
import { Request, Response } from 'express';
import { BaseController } from '../base/BaseController';
import { StartBroadcastUseCase } from '@/application/usecases/broadcast/StartBroadcastUseCase';
import { StopBroadcastUseCase } from '@/application/usecases/broadcast/StopBroadcastUseCase';
import { GetBroadcastStatusUseCase } from '@/application/usecases/broadcast/GetBroadcastStatusUseCase';
import { GetBroadcastListUseCase } from '@/application/usecases/broadcast/GetBroadcastListUseCase';
import { BroadcastMapper } from '@/application/mappers/broadcast/BroadcastMapper';
export declare class BroadcastController extends BaseController {
    private startBroadcastUseCase;
    private stopBroadcastUseCase;
    private getBroadcastStatusUseCase;
    private getBroadcastListUseCase;
    private broadcastMapper;
    constructor(startBroadcastUseCase: StartBroadcastUseCase, stopBroadcastUseCase: StopBroadcastUseCase, getBroadcastStatusUseCase: GetBroadcastStatusUseCase, getBroadcastListUseCase: GetBroadcastListUseCase, broadcastMapper: BroadcastMapper);
    /**
     * Start new broadcast
     * POST /api/broadcasts
     */
    startBroadcast(req: Request, res: Response): Promise<Response>;
    /**
     * Stop active broadcast
     * POST /api/broadcasts/:id/stop
     */
    stopBroadcast(req: Request, res: Response): Promise<Response>;
    /**
     * Get broadcast status and progress
     * GET /api/broadcasts/:id/status
     */
    getBroadcastStatus(req: Request, res: Response): Promise<Response>;
    /**
     * Get broadcast list with search and pagination
     * GET /api/broadcasts
     */
    getBroadcasts(req: Request, res: Response): Promise<Response>;
    /**
     * Get broadcast by ID
     * GET /api/broadcasts/:id
     */
    getBroadcastById(req: Request, res: Response): Promise<Response>;
    /**
     * Get active broadcasts
     * GET /api/broadcasts/active
     */
    getActiveBroadcasts(req: Request, res: Response): Promise<Response>;
    /**
     * Get user's broadcasts
     * GET /api/broadcasts/my
     */
    getUserBroadcasts(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=BroadcastController.d.ts.map