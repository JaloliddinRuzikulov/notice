/**
 * Call Event Handler for WebSocket
 * Handles real-time call events and notifications
 */

import { Socket } from 'socket.io';
import { injectable, inject } from 'tsyringe';
import { IWebSocketService } from '@/infrastructure/services/WebSocketService';
import { ICallRepository } from '@/core/domain/repositories/ICallRepository';
import { IBroadcastRepository } from '@/core/domain/repositories/IBroadcastRepository';
import { CallStatus } from '@/core/domain/entities/Call';
import { BroadcastStatus } from '@/core/domain/entities/Broadcast';

@injectable()
export class CallEventHandler {
  constructor(
    @inject('IWebSocketService') private wsService: IWebSocketService,
    @inject('ICallRepository') private callRepository: ICallRepository,
    @inject('IBroadcastRepository') private broadcastRepository: IBroadcastRepository
  ) {}

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: Socket): void {
    console.log(`New WebSocket connection: ${socket.id}`);

    // Set up event listeners for this socket
    this.setupSocketEventListeners(socket);

    // Send initial connection confirmation
    socket.emit('connection-confirmed', {
      socketId: socket.id,
      timestamp: new Date(),
      message: 'WebSocket connection established'
    });
  }

  /**
   * Setup event listeners for a socket
   */
  private setupSocketEventListeners(socket: Socket): void {
    // Authentication events
    socket.on('authenticate', (data) => {
      this.handleAuthentication(socket, data);
    });

    // Room management
    socket.on('join-room', (room: string) => {
      this.handleJoinRoom(socket, room);
    });

    socket.on('leave-room', (room: string) => {
      this.handleLeaveRoom(socket, room);
    });

    // Call events
    socket.on('call-status-update', (data) => {
      this.handleCallStatusUpdate(socket, data);
    });

    socket.on('call-progress-update', (data) => {
      this.handleCallProgressUpdate(socket, data);
    });

    // DTMF events
    socket.on('dtmf-input', (data) => {
      this.handleDTMFInput(socket, data);
    });

    // Broadcast events
    socket.on('broadcast-update', (data) => {
      this.handleBroadcastUpdate(socket, data);
    });

    socket.on('broadcast-progress', (data) => {
      this.handleBroadcastProgress(socket, data);
    });

    // SIP phone events
    socket.on('sip-phone-event', (data) => {
      this.handleSipPhoneEvent(socket, data);
    });

    // Audio events
    socket.on('audio-event', (data) => {
      this.handleAudioEvent(socket, data);
    });

    // Dashboard events
    socket.on('dashboard-refresh', () => {
      this.handleDashboardRefresh(socket);
    });

    // System events
    socket.on('ping', () => {
      this.handlePing(socket);
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Error handling
    socket.on('error', (error) => {
      this.handleSocketError(socket, error);
    });
  }

  /**
   * Handle user authentication
   */
  private handleAuthentication(socket: Socket, data: { userId: string; token?: string }): void {
    try {
      // TODO: Implement actual token validation
      const { userId, token } = data;

      if (!userId) {
        socket.emit('authentication-failed', { error: 'User ID is required' });
        return;
      }

      // Store user info in socket
      (socket as any).userId = userId;
      (socket as any).authenticated = true;

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Join general rooms based on user role/permissions
      socket.join('dashboard-updates');
      socket.join('call-notifications');
      socket.join('broadcast-notifications');

      socket.emit('authenticated', {
        success: true,
        userId,
        socketId: socket.id,
        timestamp: new Date()
      });

      console.log(`User ${userId} authenticated on socket ${socket.id}`);

    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authentication-failed', {
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  }

  /**
   * Handle joining a room
   */
  private handleJoinRoom(socket: Socket, room: string): void {
    socket.join(room);
    socket.emit('room-joined', { room, timestamp: new Date() });
    console.log(`Socket ${socket.id} joined room: ${room}`);
  }

  /**
   * Handle leaving a room
   */
  private handleLeaveRoom(socket: Socket, room: string): void {
    socket.leave(room);
    socket.emit('room-left', { room, timestamp: new Date() });
    console.log(`Socket ${socket.id} left room: ${room}`);
  }

  /**
   * Handle call status updates from clients
   */
  private async handleCallStatusUpdate(socket: Socket, data: any): Promise<void> {
    try {
      const { callId, status, metadata } = data;
      
      if (!callId || !status) {
        socket.emit('error', { message: 'Call ID and status are required' });
        return;
      }

      // Update call in database
      const calls = await this.callRepository.search({ callId });
      if (calls.length > 0) {
        const call = calls[0];
        call.updateStatus(status as CallStatus);
        
        if (metadata) {
          Object.keys(metadata).forEach(key => {
            call.updateMetadata(key, metadata[key]);
          });
        }

        await this.callRepository.update(call.toObject().id!, call);

        // Broadcast to all interested parties
        this.wsService.broadcastCallStatus(callId, status as CallStatus, {
          ...data,
          updatedBy: (socket as any).userId,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Call status update error:', error);
      socket.emit('error', { message: 'Failed to update call status' });
    }
  }

  /**
   * Handle call progress updates
   */
  private handleCallProgressUpdate(socket: Socket, data: any): void {
    const { callId, progress, stage } = data;
    
    // Broadcast progress to interested parties
    socket.to('call-notifications').emit('call-progress-update', {
      callId,
      progress,
      stage,
      timestamp: new Date(),
      updatedBy: (socket as any).userId
    });
  }

  /**
   * Handle DTMF input from clients
   */
  private handleDTMFInput(socket: Socket, data: { callId: string; dtmf: string }): void {
    const { callId, dtmf } = data;
    
    if (!callId || !dtmf) {
      socket.emit('error', { message: 'Call ID and DTMF are required' });
      return;
    }

    // Broadcast DTMF input to relevant subscribers
    socket.to('call-notifications').emit('dtmf-received', {
      callId,
      dtmf,
      timestamp: new Date(),
      fromUser: (socket as any).userId
    });

    console.log(`DTMF received: ${dtmf} for call ${callId}`);
  }

  /**
   * Handle broadcast updates
   */
  private async handleBroadcastUpdate(socket: Socket, data: any): Promise<void> {
    try {
      const { broadcastId, status, metadata } = data;
      
      if (!broadcastId || !status) {
        socket.emit('error', { message: 'Broadcast ID and status are required' });
        return;
      }

      // Update broadcast in database
      await this.broadcastRepository.updateStatus(broadcastId, status as BroadcastStatus);

      // Broadcast to all interested parties
      this.wsService.broadcastBroadcastStatus(broadcastId, status as BroadcastStatus, {
        ...data,
        updatedBy: (socket as any).userId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Broadcast update error:', error);
      socket.emit('error', { message: 'Failed to update broadcast status' });
    }
  }

  /**
   * Handle broadcast progress updates
   */
  private handleBroadcastProgress(socket: Socket, data: any): void {
    const { broadcastId, progress, completedCalls, totalCalls, currentRecipient } = data;
    
    // Broadcast progress to interested parties
    socket.to('broadcast-notifications').emit('broadcast-progress-update', {
      broadcastId,
      progress,
      completedCalls,
      totalCalls,
      currentRecipient,
      timestamp: new Date(),
      updatedBy: (socket as any).userId
    });
  }

  /**
   * Handle SIP phone events
   */
  private handleSipPhoneEvent(socket: Socket, data: any): void {
    const { eventType, callId, payload } = data;
    
    // Route SIP phone events appropriately
    switch (eventType) {
      case 'connection-status':
        socket.emit('sip-connection-status', {
          connected: payload.connected,
          account: payload.account,
          timestamp: new Date()
        });
        break;
        
      case 'incoming-call':
        socket.emit('incoming-call', {
          callId: payload.callId,
          from: payload.from,
          to: payload.to,
          timestamp: new Date()
        });
        break;
        
      case 'call-media-status':
        socket.to('call-notifications').emit('call-media-update', {
          callId,
          mediaStatus: payload,
          timestamp: new Date()
        });
        break;
        
      default:
        console.warn(`Unknown SIP phone event: ${eventType}`);
    }
  }

  /**
   * Handle audio events
   */
  private handleAudioEvent(socket: Socket, data: any): void {
    const { eventType, payload } = data;
    
    // Route audio events
    switch (eventType) {
      case 'recording-started':
        socket.to('call-notifications').emit('recording-started', {
          callId: payload.callId,
          timestamp: new Date(),
          userId: (socket as any).userId
        });
        break;
        
      case 'recording-stopped':
        socket.to('call-notifications').emit('recording-stopped', {
          callId: payload.callId,
          duration: payload.duration,
          fileUrl: payload.fileUrl,
          timestamp: new Date(),
          userId: (socket as any).userId
        });
        break;
        
      case 'playback-started':
        socket.to('call-notifications').emit('playback-started', {
          audioUrl: payload.audioUrl,
          timestamp: new Date(),
          userId: (socket as any).userId
        });
        break;
        
      default:
        console.warn(`Unknown audio event: ${eventType}`);
    }
  }

  /**
   * Handle dashboard refresh requests
   */
  private async handleDashboardRefresh(socket: Socket): Promise<void> {
    try {
      // Emit current statistics to the requesting socket
      socket.emit('dashboard-data-refresh', {
        timestamp: new Date(),
        message: 'Dashboard data refresh initiated'
      });
      
      console.log(`Dashboard refresh requested by socket ${socket.id}`);
    } catch (error) {
      console.error('Dashboard refresh error:', error);
      socket.emit('error', { message: 'Failed to refresh dashboard data' });
    }
  }

  /**
   * Handle ping requests for connection health
   */
  private handlePing(socket: Socket): void {
    socket.emit('pong', {
      timestamp: new Date(),
      latency: Date.now()
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: Socket, reason: string): void {
    const userId = (socket as any).userId;
    const socketId = socket.id;
    
    console.log(`Socket disconnected: ${socketId} (User: ${userId}, Reason: ${reason})`);
    
    // Clean up any ongoing operations for this user
    this.cleanupUserOperations(userId);
    
    // Broadcast user disconnection if needed
    if (userId) {
      socket.to('dashboard-updates').emit('user-disconnected', {
        userId,
        socketId,
        reason,
        timestamp: new Date()
      });
    }
  }

  /**
   * Handle socket errors
   */
  private handleSocketError(socket: Socket, error: any): void {
    console.error(`Socket error for ${socket.id}:`, error);
    
    // Emit error back to client
    socket.emit('socket-error', {
      error: error.message || 'Socket error occurred',
      timestamp: new Date()
    });
  }

  /**
   * Clean up operations for disconnected user
   */
  private cleanupUserOperations(userId: string): void {
    // TODO: Implement cleanup logic
    // - Cancel ongoing calls
    // - Stop broadcasts if user was managing them
    // - Clean up any temporary data
    console.log(`Cleaning up operations for user: ${userId}`);
  }

  /**
   * Broadcast system-wide notification
   */
  broadcastSystemNotification(type: string, message: string, data?: any): void {
    this.wsService.broadcastSystemNotification(type, message, data);
  }

  /**
   * Get current connection statistics
   */
  getConnectionStats(): any {
    return this.wsService.getServerStats();
  }
}