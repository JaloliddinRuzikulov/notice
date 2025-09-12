/**
 * SIP Controller
 * Handles SIP phone related HTTP requests
 */

import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { MakeCallUseCase } from '@/application/usecases/sip/MakeCallUseCase';
import { AnswerCallUseCase } from '@/application/usecases/sip/AnswerCallUseCase';
import { HangupCallUseCase } from '@/application/usecases/sip/HangupCallUseCase';
import { ExecuteBroadcastUseCase } from '@/application/usecases/broadcast/ExecuteBroadcastUseCase';
import { GetCallHistoryUseCase } from '@/application/usecases/call/GetCallHistoryUseCase';
import { CallType } from '@/core/domain/entities/Call';

@injectable()
export class SipController {
  constructor(
    @inject(MakeCallUseCase) private makeCallUseCase: MakeCallUseCase,
    @inject(AnswerCallUseCase) private answerCallUseCase: AnswerCallUseCase,
    @inject(HangupCallUseCase) private hangupCallUseCase: HangupCallUseCase,
    @inject(ExecuteBroadcastUseCase) private executeBroadcastUseCase: ExecuteBroadcastUseCase,
    @inject(GetCallHistoryUseCase) private getCallHistoryUseCase: GetCallHistoryUseCase
  ) {}

  /**
   * Make a new call
   * POST /api/sip/call
   */
  async makeCall(req: Request, res: Response): Promise<void> {
    try {
      const { fromNumber, toNumber, callType, employeeId, broadcastId } = req.body;

      // Validation
      if (!fromNumber || !toNumber) {
        res.status(400).json({
          success: false,
          error: 'From and To numbers are required'
        });
        return;
      }

      const result = await this.makeCallUseCase.execute({
        fromNumber,
        toNumber,
        callType: callType || CallType.DIRECT,
        employeeId,
        broadcastId,
        metadata: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          timestamp: new Date()
        }
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            call: result.data.call.toObject(),
            sessionInfo: result.data.sessionInfo
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          details: result.errors
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Answer an incoming call
   * POST /api/sip/answer/:callId
   */
  async answerCall(req: Request, res: Response): Promise<void> {
    try {
      const { callId } = req.params;
      const { answeredBy } = req.body;

      if (!callId) {
        res.status(400).json({
          success: false,
          error: 'Call ID is required'
        });
        return;
      }

      const result = await this.answerCallUseCase.execute({
        callId,
        answeredBy
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            call: result.data.call.toObject(),
            answerTime: result.data.answerTime
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          details: result.errors
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Hangup/end a call
   * POST /api/sip/hangup/:callId
   */
  async hangupCall(req: Request, res: Response): Promise<void> {
    try {
      const { callId } = req.params;
      const { reason, endedBy } = req.body;

      if (!callId) {
        res.status(400).json({
          success: false,
          error: 'Call ID is required'
        });
        return;
      }

      const result = await this.hangupCallUseCase.execute({
        callId,
        reason,
        endedBy
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            call: result.data.call.toObject(),
            endTime: result.data.endTime,
            duration: result.data.duration,
            finalStatus: result.data.finalStatus
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          details: result.errors
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute broadcast
   * POST /api/sip/broadcast/:broadcastId/execute
   */
  async executeBroadcast(req: Request, res: Response): Promise<void> {
    try {
      const { broadcastId } = req.params;
      const { maxConcurrentCalls, callTimeout, retryFailedCalls, maxRetries } = req.body;

      if (!broadcastId) {
        res.status(400).json({
          success: false,
          error: 'Broadcast ID is required'
        });
        return;
      }

      const result = await this.executeBroadcastUseCase.execute({
        broadcastId,
        maxConcurrentCalls: maxConcurrentCalls || 1,
        callTimeout: callTimeout || 30,
        retryFailedCalls: retryFailedCalls || false,
        maxRetries: maxRetries || 1
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            broadcast: result.data.broadcast.toObject(),
            totalCalls: result.data.totalCalls,
            completedCalls: result.data.completedCalls,
            failedCalls: result.data.failedCalls,
            executionTime: result.data.executionTime,
            statistics: result.data.statistics
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          details: result.errors
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get call history
   * GET /api/sip/calls
   */
  async getCallHistory(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 50, status, type, dateFrom, dateTo } = req.query;

      const result = await this.getCallHistoryUseCase.execute({
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        },
        search: {
          status: status as any,
          dateRange: dateFrom && dateTo ? {
            startDate: new Date(dateFrom as string),
            endDate: new Date(dateTo as string)
          } : undefined
        }
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            calls: result.data.calls.map(call => call.toObject()),
            pagination: result.data.pagination,
            statistics: result.data.statistics
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          details: result.errors
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get call statistics
   * GET /api/sip/stats
   */
  async getCallStats(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'today' } = req.query;

      // Calculate date range based on period
      let dateFrom: Date;
      let dateTo: Date = new Date();

      switch (period) {
        case 'today':
          dateFrom = new Date();
          dateFrom.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case 'month':
          dateFrom = new Date();
          dateFrom.setMonth(dateFrom.getMonth() - 1);
          break;
        default:
          dateFrom = new Date();
          dateFrom.setHours(0, 0, 0, 0);
      }

      const result = await this.getCallHistoryUseCase.execute({
        pagination: {
          page: 1,
          limit: 1000 // Get enough for statistics
        },
        search: {
          dateRange: {
            startDate: dateFrom,
            endDate: dateTo
          }
        }
      });

      if (result.success) {
        res.status(200).json({
          success: true,
          data: {
            period,
            dateRange: { from: dateFrom, to: dateTo },
            statistics: result.data.statistics,
            totalCalls: result.data.pagination.total
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          details: result.errors
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Health check for SIP service
   * GET /api/sip/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // For now, return basic health info
      // In real implementation, check SIP service connection status
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date(),
          services: {
            sip: 'connected', // This would be dynamic
            database: 'connected',
            websocket: 'connected'
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}