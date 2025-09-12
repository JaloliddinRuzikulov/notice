/**
 * Call Controller
 * Handles HTTP requests for call history and management
 */
import { Request, Response } from 'express';
import { BaseController } from '../base/BaseController';
import { CreateCallRecordUseCase } from '@/application/usecases/call/CreateCallRecordUseCase';
import { GetCallHistoryUseCase } from '@/application/usecases/call/GetCallHistoryUseCase';
import { UpdateCallStatusUseCase } from '@/application/usecases/call/UpdateCallStatusUseCase';
import { CallMapper } from '@/application/mappers/call/CallMapper';
export declare class CallController extends BaseController {
    private createCallRecordUseCase;
    private getCallHistoryUseCase;
    private updateCallStatusUseCase;
    private callMapper;
    constructor(createCallRecordUseCase: CreateCallRecordUseCase, getCallHistoryUseCase: GetCallHistoryUseCase, updateCallStatusUseCase: UpdateCallStatusUseCase, callMapper: CallMapper);
    /**
     * Create call record
     * POST /api/calls
     */
    createCallRecord(req: Request, res: Response): Promise<Response>;
    /**
     * Get call history with search and pagination
     * GET /api/calls
     */
    getCallHistory(req: Request, res: Response): Promise<Response>;
    /**
     * Update call status
     * PUT /api/calls/:id/status
     */
    updateCallStatus(req: Request, res: Response): Promise<Response>;
    /**
     * Get call by ID
     * GET /api/calls/:id
     */
    getCallById(req: Request, res: Response): Promise<Response>;
    /**
     * Get calls by employee ID
     * GET /api/calls/employee/:employeeId
     */
    getCallsByEmployee(req: Request, res: Response): Promise<Response>;
    /**
     * Get calls by broadcast ID
     * GET /api/calls/broadcast/:broadcastId
     */
    getCallsByBroadcast(req: Request, res: Response): Promise<Response>;
    /**
     * Get call statistics
     * GET /api/calls/statistics
     */
    getCallStatistics(req: Request, res: Response): Promise<Response>;
    /**
     * Get call report
     * GET /api/calls/report
     */
    getCallReport(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=CallController.d.ts.map