/**
 * React component for launching and managing device sessions
 */

import React, { useState, useCallback } from 'react';
import {
  pollSessionStatus,
  SessionStatus,
} from '../services/sandboxService';
import { apiClient } from '../services/api';
import { DeviceConfig } from '../store/sessionStore';
import '../styles/SandboxLauncher.css';

interface LaunchState {
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sessionStatus: SessionStatus | null;
  timeRemaining: number | null;
}

export const SandboxLauncher: React.FC = () => {
  const [state, setState] = useState<LaunchState>({
    isLoading: false,
    error: null,
    sessionId: null,
    sessionStatus: null,
    timeRemaining: null,
  });

  const handleLaunch = useCallback(async (deviceType: 'android' | 'windows' = 'android') => {
    setState({ isLoading: true, error: null, sessionId: null, sessionStatus: null, timeRemaining: null });

    try {
      // Create device config
      const config: DeviceConfig = {
        type: deviceType,
        version: deviceType === 'android' ? '14.0' : '11',
        screenResolution: deviceType === 'android' ? '1080x2400' : '1920x1080',
        ram: deviceType === 'android' ? '4GB' : '8GB',
        cpu: deviceType === 'android' ? '4 cores' : '4 cores',
        language: 'English',
        sessionDuration: 60,
        orientation: deviceType === 'android' ? 'portrait' : 'landscape',
        deviceModel: deviceType === 'android' ? 'Pixel 6' : 'Standard Desktop',
        networkSpeed: '4G',
        performanceMode: 'balanced',
        resetSandboxState: true,
      };

      // Launch device using unified API
      const launchResult = await apiClient.createSession(config);

      if (!launchResult.sessionId) {
        throw new Error('Failed to launch: No session ID returned');
      }

      const { sessionId } = launchResult;

      // Start polling for status
      const estimatedTime = 120; // 2 minutes
      setState((prev) => ({
        ...prev,
        sessionId,
        isLoading: true,
        timeRemaining: estimatedTime,
      }));

      // Poll for status with countdown
      const countdownInterval = setInterval(() => {
        setState((prev) => {
          if (prev.timeRemaining === null) {
            clearInterval(countdownInterval);
            return prev;
          }

          const nextTime = prev.timeRemaining - 1;
          return {
            ...prev,
            timeRemaining: nextTime >= 0 ? nextTime : 0,
          };
        });
      }, 1000);

      // Start polling (this will eventually complete or timeout)
      try {
        const finalStatus = await pollSessionStatus(sessionId);
        clearInterval(countdownInterval);
        
        setState((prev) => ({
          ...prev,
          isLoading: false,
          sessionStatus: finalStatus,
          timeRemaining: null,
        }));
      } catch (pollError) {
        clearInterval(countdownInterval);
        throw pollError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to launch device';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  const handleRetry = useCallback(() => {
    handleLaunch();
  }, [handleLaunch]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render component
  return (
    <div className="sandbox-launcher">
      <div className="launcher-card">
        <h2>Device Launcher</h2>

        {!state.sessionId && !state.isLoading && !state.error && (
          <div className="controls">
            <button onClick={() => handleLaunch('android')}>Launch Android</button>
            <button onClick={() => handleLaunch('windows')}>Launch Windows</button>
          </div>
        )}

        {state.isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>
              {state.timeRemaining ? `Launching... ${formatTime(state.timeRemaining)}` : 'Launching device...'}
            </p>
          </div>
        )}

        {state.error && (
          <div className="error">
            <p>{state.error}</p>
            <button onClick={handleRetry}>Retry</button>
          </div>
        )}

        {state.sessionStatus && (
          <div className="session-info">
            <h3>Session Active</h3>
            <p><strong>ID:</strong> {state.sessionId}</p>
            <p><strong>Status:</strong> {state.sessionStatus.status}</p>
            {state.sessionStatus.port && (
              <p><strong>Port:</strong> {state.sessionStatus.port}</p>
            )}
            {state.sessionStatus.uptime && (
              <p><strong>Uptime:</strong> {state.sessionStatus.uptime}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SandboxLauncher;
