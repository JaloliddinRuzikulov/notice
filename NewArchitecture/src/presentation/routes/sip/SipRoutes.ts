/**
 * SIP Routes
 * Defines API routes for SIP functionality
 */

import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { BaseRouter } from '../base/BaseRouter';
import { SipController } from '@/presentation/controllers/sip/SipController';

export class SipRoutes extends BaseRouter {
  private sipController: SipController;

  constructor() {
    super();
    this.sipController = container.resolve(SipController);
    this.setupRoutes();
  }

  protected setupRoutes(): void {
    // SIP Call Management Routes
    this.router.post('/call', this.handleMakeCall.bind(this));
    this.router.post('/answer/:callId', this.handleAnswerCall.bind(this));
    this.router.post('/hangup/:callId', this.handleHangupCall.bind(this));
    
    // Broadcast Routes
    this.router.post('/broadcast/:broadcastId/execute', this.handleExecuteBroadcast.bind(this));
    
    // Call History and Statistics
    this.router.get('/calls', this.handleGetCallHistory.bind(this));
    this.router.get('/stats', this.handleGetCallStats.bind(this));
    
    // Health Check
    this.router.get('/health', this.handleHealthCheck.bind(this));
  }

  private async handleMakeCall(req: Request, res: Response): Promise<void> {
    await this.sipController.makeCall(req, res);
  }

  private async handleAnswerCall(req: Request, res: Response): Promise<void> {
    await this.sipController.answerCall(req, res);
  }

  private async handleHangupCall(req: Request, res: Response): Promise<void> {
    await this.sipController.hangupCall(req, res);
  }

  private async handleExecuteBroadcast(req: Request, res: Response): Promise<void> {
    await this.sipController.executeBroadcast(req, res);
  }

  private async handleGetCallHistory(req: Request, res: Response): Promise<void> {
    await this.sipController.getCallHistory(req, res);
  }

  private async handleGetCallStats(req: Request, res: Response): Promise<void> {
    await this.sipController.getCallStats(req, res);
  }

  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    await this.sipController.healthCheck(req, res);
  }
}