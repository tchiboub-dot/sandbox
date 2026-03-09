import { Server, Socket } from 'socket.io';
import { logger } from './utils/logger';
import axios from 'axios';

interface SessionData {
  sessionId: string;
  clientSocket: Socket;
  vmSocket?: Socket;
}

export class SignalingHandler {
  private sessions: Map<string, SessionData> = new Map();
  private vmHosts: string[];

  constructor(private io: Server) {
    this.vmHosts = (process.env.VM_HOST_POOL || 'localhost:8080').split(',');
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join-session', async (data: { sessionId: string }) => {
        try {
          await this.handleJoinSession(socket, data.sessionId);
        } catch (error) {
          logger.error('Error joining session:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      socket.on('answer', (data: { sessionId: string; answer: RTCSessionDescriptionInit }) => {
        this.handleAnswer(socket, data);
      });

      socket.on('ice-candidate', (data: { sessionId: string; candidate: RTCIceCandidateInit }) => {
        this.handleIceCandidate(socket, data);
      });

      socket.on('input', (data: { sessionId: string; input: any }) => {
        this.handleInput(socket, data);
      });

      socket.on('leave-session', (data: { sessionId: string }) => {
        this.handleLeaveSession(socket, data.sessionId);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinSession(socket: Socket, sessionId: string): Promise<void> {
    logger.info(`Client joining session: ${sessionId}`);

    // Get session from API server
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    const response = await axios.get(`${apiUrl}/api/sessions/${sessionId}`);
    const session = response.data;

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'running') {
      throw new Error('Session not ready');
    }

    // Store session data
    this.sessions.set(sessionId, {
      sessionId,
      clientSocket: socket,
    });

    // Join socket room
    socket.join(sessionId);

    // Get WebRTC offer from VM host
    const vmHost = await this.getVMHost(session.vmId);
    const offerResponse = await axios.post(`http://${vmHost}/api/webrtc/offer`, {
      sessionId,
      vmId: session.vmId,
    });

    // Send offer to client
    socket.emit('offer', { offer: offerResponse.data.offer });

    logger.info(`Session joined: ${sessionId}`);
  }

  private handleAnswer(socket: Socket, data: { sessionId: string; answer: RTCSessionDescriptionInit }): void {
    logger.info(`Received answer for session: ${data.sessionId}`);

    // Forward answer to VM host
    const session = this.sessions.get(data.sessionId);
    if (session) {
      // Send answer to VM host via HTTP
      this.sendToVMHost(data.sessionId, 'answer', data.answer);
    }
  }

  private handleIceCandidate(
    socket: Socket,
    data: { sessionId: string; candidate: RTCIceCandidateInit }
  ): void {
    logger.info(`Received ICE candidate for session: ${data.sessionId}`);

    // Forward ICE candidate to VM host
    this.sendToVMHost(data.sessionId, 'ice-candidate', data.candidate);
  }

  private handleInput(socket: Socket, data: { sessionId: string; input: any }): void {
    // Forward input to VM host
    this.sendToVMHost(data.sessionId, 'input', data.input);
  }

  private handleLeaveSession(socket: Socket, sessionId: string): void {
    logger.info(`Client leaving session: ${sessionId}`);

    socket.leave(sessionId);
    this.sessions.delete(sessionId);
  }

  private handleDisconnect(socket: Socket): void {
    // Find and cleanup any sessions for this socket
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.clientSocket.id === socket.id) {
        this.sessions.delete(sessionId);
        logger.info(`Cleaned up session: ${sessionId}`);
      }
    }
  }

  private async sendToVMHost(sessionId: string, event: string, data: any): Promise<void> {
    try {
      // Get VM host for this session
      const vmHost = this.vmHosts[0]; // Simplified - would lookup actual host

      await axios.post(`http://${vmHost}/api/webrtc/${event}`, {
        sessionId,
        data,
      });
    } catch (error) {
      logger.error(`Failed to send ${event} to VM host:`, error);
    }
  }

  private async getVMHost(vmId: string): Promise<string> {
    // In production, lookup VM host from Redis/database
    return this.vmHosts[0];
  }
}
