import { useEffect, useRef, useState } from 'react';
import { webrtcService } from '../services/webrtc';

interface WebRTCViewerProps {
  sessionId: string;
  streamUrl: string;
  deviceType: 'android' | 'windows';
  isMuted: boolean;
}

export default function WebRTCViewer({ sessionId, streamUrl, deviceType, isMuted }: WebRTCViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let peerConnection: RTCPeerConnection | null = null;

    const connectWebRTC = async () => {
      try {
        // Initialize WebRTC connection
        peerConnection = await webrtcService.connect(sessionId, streamUrl);

        // Handle incoming stream
        peerConnection.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setIsConnected(true);
          }
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          if (peerConnection) {
            console.log('Connection state:', peerConnection.connectionState);
            if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
              setError('Connection lost. Attempting to reconnect...');
              setTimeout(connectWebRTC, 2000);
            }
          }
        };

        // Handle mouse and keyboard events
        if (containerRef.current && videoRef.current) {
          setupInputHandlers(containerRef.current, videoRef.current, sessionId);
        }
      } catch (err) {
        console.error('WebRTC connection error:', err);
        setError('Failed to connect to device stream');
      }
    };

    connectWebRTC();

    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      webrtcService.disconnect(sessionId);
    };
  }, [sessionId, streamUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const setupInputHandlers = (container: HTMLDivElement, video: HTMLVideoElement, sessionId: string) => {
    // Mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = video.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      webrtcService.sendInput(sessionId, { type: 'mousemove', x, y });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = video.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      webrtcService.sendInput(sessionId, { type: 'mousedown', x, y, button: e.button });
    };

    const handleMouseUp = (e: MouseEvent) => {
      const rect = video.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      webrtcService.sendInput(sessionId, { type: 'mouseup', x, y, button: e.button });
    };

    // Touch events for Android
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = video.getBoundingClientRect();
      const touch = e.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      webrtcService.sendInput(sessionId, { type: 'touchdown', x, y });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = video.getBoundingClientRect();
      const touch = e.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      webrtcService.sendInput(sessionId, { type: 'touchmove', x, y });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      webrtcService.sendInput(sessionId, { type: 'touchup' });
    };

    // Keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      webrtcService.sendInput(sessionId, { type: 'keydown', key: e.key, code: e.code });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      webrtcService.sendInput(sessionId, { type: 'keyup', key: e.key, code: e.code });
    };

    // Add event listeners
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keyup', handleKeyUp);

    // Focus the container
    container.tabIndex = 0;
    container.focus();
  };

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Reload
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden shadow-2xl max-w-6xl mx-auto">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full ${deviceType === 'android' ? 'max-h-[800px]' : 'aspect-video'}`}
        style={{ objectFit: 'contain' }}
      />
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Connecting to stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}
