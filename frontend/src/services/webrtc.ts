import io, { Socket } from 'socket.io-client';

const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_URL || 'http://localhost:5001';

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();

  constructor() {
    this.socket = io(SIGNALING_SERVER_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });
  }

  async connect(sessionId: string, streamUrl: string): Promise<RTCPeerConnection> {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    // Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    this.peerConnections.set(sessionId, pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    // Request offer from signaling server
    this.socket.emit('join-session', { sessionId });

    // Handle offer from server
    this.socket.on('offer', async (data: { offer: RTCSessionDescriptionInit }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (this.socket) {
          this.socket.emit('answer', {
            sessionId,
            answer: pc.localDescription,
          });
        }
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Handle ICE candidates from server
    this.socket.on('ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    return pc;
  }

  sendInput(sessionId: string, input: any): void {
    if (this.socket) {
      this.socket.emit('input', { sessionId, input });
    }
  }

  disconnect(sessionId: string): void {
    const pc = this.peerConnections.get(sessionId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(sessionId);
    }

    if (this.socket) {
      this.socket.emit('leave-session', { sessionId });
    }
  }

  disconnectAll(): void {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const webrtcService = new WebRTCService();
