/**
 * Broadcast Controller
 * Handles HTTP requests for broadcast management
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { BaseController } from '../base/BaseController';
import { StartBroadcastUseCase } from '@/application/usecases/broadcast/StartBroadcastUseCase';
import { StopBroadcastUseCase } from '@/application/usecases/broadcast/StopBroadcastUseCase';
import { GetBroadcastStatusUseCase } from '@/application/usecases/broadcast/GetBroadcastStatusUseCase';
import { GetBroadcastListUseCase } from '@/application/usecases/broadcast/GetBroadcastListUseCase';
import { BroadcastMapper } from '@/application/mappers/broadcast/BroadcastMapper';
import { CreateBroadcastDTO, BroadcastSearchDTO, StopBroadcastDTO } from '@/application/dto/broadcast/BroadcastDTO';
import { BroadcastType, BroadcastStatus } from '@/core/domain/entities/Broadcast';

@injectable()
export class BroadcastController extends BaseController {
  constructor(
    @inject(StartBroadcastUseCase)
    private startBroadcastUseCase: StartBroadcastUseCase,
    @inject(StopBroadcastUseCase)
    private stopBroadcastUseCase: StopBroadcastUseCase,
    @inject(GetBroadcastStatusUseCase)
    private getBroadcastStatusUseCase: GetBroadcastStatusUseCase,
    @inject(GetBroadcastListUseCase)
    private getBroadcastListUseCase: GetBroadcastListUseCase,
    @inject(BroadcastMapper)
    private broadcastMapper: BroadcastMapper
  ) {
    super();
  }

  /**
   * Start new broadcast
   * POST /api/broadcasts
   */
  async startBroadcast(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      const validation = this.validateRequestBody(req, ['name', 'type']);

      if (!validation.isValid) {
        return this.badRequest(res, 'Validation failed', validation.errors);
      }

      // Validate broadcast type
      if (!Object.values(BroadcastType).includes(req.body.type)) {
        return this.badRequest(res, 'Invalid broadcast type');
      }

      // Validate required fields based on type
      if (req.body.type === BroadcastType.VOICE && !req.body.audioFileId) {
        return this.badRequest(res, 'Audio file ID is required for voice broadcast');
      }

      if (req.body.type === BroadcastType.SMS && !req.body.message) {
        return this.badRequest(res, 'Message is required for SMS broadcast');
      }

      const createDTO: CreateBroadcastDTO = this.sanitizeInput({
        name: req.body.name,
        type: req.body.type,
        audioFileId: req.body.audioFileId,
        message: req.body.message,
        targetEmployees: req.body.targetEmployees || [],
        targetDepartments: req.body.targetDepartments || [],
        targetDistricts: req.body.targetDistricts || [],
        scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined
      });

      const result = await this.startBroadcastUseCase.execute({
        ...createDTO,
        createdBy: user.id
      });

      if (result.success && result.data) {
        const responseDTO = this.broadcastMapper.toStartResponseDTO(result.data.broadcast);
        return this.created(res, responseDTO, 'Broadcast started successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error starting broadcast:', error);
      return this.internalError(res, 'Failed to start broadcast');
    }
  }

  /**
   * Stop active broadcast
   * POST /api/broadcasts/:id/stop
   */
  async stopBroadcast(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const { id } = req.params;

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      if (!id) {
        return this.badRequest(res, 'Broadcast ID is required');
      }

      const stopDTO: StopBroadcastDTO = {
        reason: this.sanitizeInput(req.body.reason)
      };

      const result = await this.stopBroadcastUseCase.execute({
        broadcastId: id,
        stoppedBy: user.id,
        reason: stopDTO.reason
      });

      if (result.success) {
        return this.noContent(res, 'Broadcast stopped successfully');
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error stopping broadcast:', error);
      return this.internalError(res, 'Failed to stop broadcast');
    }
  }

  /**
   * Get broadcast status and progress
   * GET /api/broadcasts/:id/status
   */
  async getBroadcastStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.badRequest(res, 'Broadcast ID is required');
      }

      const result = await this.getBroadcastStatusUseCase.execute({
        broadcastId: id
      });

      if (result.success && result.data) {
        const statusDTO = this.broadcastMapper.toStatusDTO(
          result.data.broadcast,
          result.data.progress,
          result.data.callHistory
        );
        return this.success(res, statusDTO);
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting broadcast status:', error);
      return this.internalError(res, 'Failed to retrieve broadcast status');
    }
  }

  /**
   * Get broadcast list with search and pagination
   * GET /api/broadcasts
   */
  async getBroadcasts(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.getPaginationFromQuery(req);
      
      const search: BroadcastSearchDTO = {
        name: req.query.name as string,
        type: req.query.type as BroadcastType,
        status: req.query.status as BroadcastStatus,
        createdBy: req.query.createdBy as string
      };

      // Handle date range
      if (req.query.startDate && req.query.endDate) {
        search.dateRange = {
          startDate: new Date(req.query.startDate as string),
          endDate: new Date(req.query.endDate as string)
        };
      }

      // Remove undefined values
      Object.keys(search).forEach(key => 
        search[key as keyof BroadcastSearchDTO] === undefined && delete search[key as keyof BroadcastSearchDTO]
      );

      const result = await this.getBroadcastListUseCase.execute({
        search: Object.keys(search).length > 0 ? search : undefined,
        pagination
      });

      if (result.success && result.data) {
        const broadcastDTOs = result.data.broadcasts.map(broadcast => 
          this.broadcastMapper.toDTO(broadcast)
        );
        
        if (result.data.pagination) {
          return this.paginated(res, broadcastDTOs, result.data.pagination);
        } else {
          return this.success(res, broadcastDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting broadcasts:', error);
      return this.internalError(res, 'Failed to retrieve broadcasts');
    }
  }

  /**
   * Get broadcast by ID
   * GET /api/broadcasts/:id
   */
  async getBroadcastById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return this.badRequest(res, 'Broadcast ID is required');
      }

      // Use the status endpoint which includes full broadcast details
      const result = await this.getBroadcastStatusUseCase.execute({
        broadcastId: id
      });

      if (result.success && result.data) {
        const broadcastDTO = this.broadcastMapper.toDTO(result.data.broadcast);
        return this.success(res, broadcastDTO);
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting broadcast by ID:', error);
      return this.internalError(res, 'Failed to retrieve broadcast');
    }
  }

  /**
   * Get active broadcasts
   * GET /api/broadcasts/active
   */
  async getActiveBroadcasts(req: Request, res: Response): Promise<Response> {
    try {
      const pagination = this.getPaginationFromQuery(req);

      const result = await this.getBroadcastListUseCase.execute({
        search: { status: BroadcastStatus.IN_PROGRESS },
        pagination
      });

      if (result.success && result.data) {
        const broadcastDTOs = result.data.broadcasts.map(broadcast => 
          this.broadcastMapper.toSummaryDTO(broadcast)
        );
        
        if (result.data.pagination) {
          return this.paginated(res, broadcastDTOs, result.data.pagination);
        } else {
          return this.success(res, broadcastDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting active broadcasts:', error);
      return this.internalError(res, 'Failed to retrieve active broadcasts');
    }
  }

  /**
   * Get user's broadcasts
   * GET /api/broadcasts/my
   */
  async getUserBroadcasts(req: Request, res: Response): Promise<Response> {
    try {
      const user = this.getUserFromRequest(req);
      const pagination = this.getPaginationFromQuery(req);

      if (!user.id) {
        return this.unauthorized(res, 'User not authenticated');
      }

      const result = await this.getBroadcastListUseCase.execute({
        search: { createdBy: user.id },
        pagination
      });

      if (result.success && result.data) {
        const broadcastDTOs = result.data.broadcasts.map(broadcast => 
          this.broadcastMapper.toSummaryDTO(broadcast)
        );
        
        if (result.data.pagination) {
          return this.paginated(res, broadcastDTOs, result.data.pagination);
        } else {
          return this.success(res, broadcastDTOs);
        }
      }

      return this.handleUseCaseResult(res, result);

    } catch (error) {
      console.error('Error getting user broadcasts:', error);
      return this.internalError(res, 'Failed to retrieve user broadcasts');
    }
  }
}