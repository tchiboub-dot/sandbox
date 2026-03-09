import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Power, Clock, Camera, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { useSessionStore } from '../store/sessionStore';
import { apiClient } from '../services/api';
import WebRTCViewer from '../components/WebRTCViewer';
import SessionControls from '../components/SessionControls';

export default function DeviceSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { activeSession, setActiveSession, updateSession } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Fetch session details
    const fetchSession = async () => {
      try {
        const session = await apiClient.getSession(sessionId);
        setActiveSession(session);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        alert('Session not found');
        navigate('/');
      }
    };

    fetchSession();

    // Cleanup on unmount
    return () => {
      setActiveSession(null);
    };
  }, [sessionId, navigate, setActiveSession]);

  useEffect(() => {
    if (!activeSession) return;

    // Update time remaining every second
    const interval = setInterval(() => {
      const now = Date.now();
      const expiresAt = new Date(activeSession.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleEndSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = async () => {
    if (!sessionId) return;
    try {
      await apiClient.restartSession(sessionId);
      updateSession(sessionId, { status: 'starting' });
    } catch (error) {
      console.error('Failed to restart session:', error);
      alert('Failed to restart session');
    }
  };

  const handleReset = async () => {
    if (!sessionId) return;
    if (!confirm('Are you sure you want to reset the environment? All data will be lost.')) {
      return;
    }
    try {
      await apiClient.resetSession(sessionId);
      updateSession(sessionId, { status: 'starting' });
    } catch (error) {
      console.error('Failed to reset session:', error);
      alert('Failed to reset session');
    }
  };

  const handleExtend = async () => {
    if (!sessionId) return;
    try {
      const newExpiresAt = await apiClient.extendSession(sessionId, 30);
      updateSession(sessionId, { expiresAt: new Date(newExpiresAt) });
    } catch (error) {
      console.error('Failed to extend session:', error);
      alert('Failed to extend session');
    }
  };

  const handleScreenshot = async () => {
    if (!sessionId) return;
    try {
      const blob = await apiClient.takeScreenshot(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      alert('Failed to take screenshot');
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    if (!confirm('Are you sure you want to end this session?')) {
      return;
    }
    try {
      await apiClient.endSession(sessionId);
      navigate('/');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleFullscreen = () => {
    const element = document.getElementById('webrtc-container');
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        element.requestFullscreen();
      }
    }
  };

  if (isLoading || !activeSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading device session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-slate-950/80 border-b border-white/10 px-4 py-3 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-sm text-gray-400">Device:</span>
              <span className="ml-2 font-medium">
                {activeSession.deviceConfig.type === 'android' ? 'Android' : 'Windows'} -{' '}
                {activeSession.deviceConfig.version}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : 'text-green-500'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  activeSession.status === 'running'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}
              >
                {activeSession.status}
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleRestart}
              className="px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors border border-white/10 inline-flex items-center gap-2 text-sm"
              title="Restart Device"
            >
              <RefreshCw className="w-5 h-5" />
              Restart Device
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors border border-white/10 inline-flex items-center gap-2 text-sm"
              title="Reset Environment"
            >
              <RefreshCw className="w-5 h-5" />
              Reset Device
            </button>
            <button
              onClick={handleScreenshot}
              className="px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors border border-white/10 inline-flex items-center gap-2 text-sm"
              title="Take Screenshot"
            >
              <Camera className="w-5 h-5" />
              Take Screenshot
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleExtend}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors text-sm font-medium"
            >
              Extend +30min
            </button>
            <button
              onClick={handleEndSession}
              className="px-3 py-2 hover:bg-red-600 rounded-lg transition-colors border border-red-400/50 inline-flex items-center gap-2 text-sm"
              title="End Session"
            >
              <Power className="w-5 h-5" />
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* WebRTC Viewer */}
      <div id="webrtc-container" className="flex items-center justify-center p-4">
        {activeSession.status === 'running' && activeSession.streamUrl ? (
          <WebRTCViewer
            sessionId={activeSession.id}
            streamUrl={activeSession.streamUrl}
            deviceType={activeSession.deviceConfig.type}
            isMuted={isMuted}
          />
        ) : (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Starting Android device...</p>
            <p className="text-sm text-gray-500 mt-2">Preparing cloud environment...</p>
            <p className="text-sm text-gray-500 mt-1">Connecting to stream...</p>
          </div>
        )}
      </div>

      {/* Session Controls */}
      {activeSession.deviceConfig.type === 'android' && (
        <SessionControls sessionId={activeSession.id} />
      )}
    </div>
  );
}
