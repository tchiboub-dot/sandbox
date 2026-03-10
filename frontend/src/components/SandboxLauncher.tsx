/**
 * React component for launching and managing Android emulator sessions
 */

import React, { useState, useCallback } from 'react';
import {
  launchEmulator,
  pollSessionStatus,
  SessionStatus,
} from '../services/sandboxService';
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

  const handleLaunch = useCallback(async () => {
    setState({ isLoading: true, error: null, sessionId: null, sessionStatus: null, timeRemaining: null });

    try {
      // Launch emulator
      const launchResult = await launchEmulator({
        emulatorName: 'default',
        timeout: 300000,
      });

      if (!launchResult.success) {
        throw new Error('Failed to launch emulator');
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
          return {
            ...prev,
            timeRemaining: Math.max(0, prev.timeRemaining - 1),
          };
        });
      }, 1000);

      try {
        const sessionStatus = await pollSessionStatus(sessionId, {
          pollInterval: 15000, // 15 seconds
          maxDuration: 300000, // 5 minutes
          onStatusChange: (status) => {
            setState((prev) => ({
              ...prev,
              sessionStatus: status,
            }));
          },
        });

        clearInterval(countdownInterval);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          sessionStatus,
          timeRemaining: null,
        }));
      } catch (pollError) {
        clearInterval(countdownInterval);
        throw pollError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        isLoading: false,
        error: errorMessage,
        sessionId: null,
        sessionStatus: null,
        timeRemaining: null,
      });
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sandbox-launcher">
      <div className="launcher-card">
        <h2>Android Emulator Launcher</h2>

        {!state.sessionId && (
          <button
            className="launch-button"
            onClick={handleLaunch}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Launching...' : 'Launch Emulator'}
          </button>
        )}

        {state.error && (
          <div className="error-message">
            <strong>Error:</strong> {state.error}
          </div>
        )}

        {state.sessionId && (
          <div className="session-info">
            <p>
              <strong>Session ID:</strong> <code>{state.sessionId}</code>
            </p>

            {state.sessionStatus && (
              <>
                <p>
                  <strong>Status:</strong>{' '}
                  <span className={`status ${state.sessionStatus.status}`}>
                    {state.sessionStatus.status.toUpperCase()}
                  </span>
                </p>
                <p>
                  <strong>Port:</strong> {state.sessionStatus.port}
                </p>
                {state.sessionStatus.uptime && (
                  <p>
                    <strong>Uptime:</strong> {state.sessionStatus.uptime}
                  </p>
                )}
              </>
            )}

            {state.isLoading && state.timeRemaining !== null && (
              <div className="countdown">
                <p>Estimated wait time: {formatTime(state.timeRemaining)}</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${((120 - state.timeRemaining) / 120) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SandboxLauncher;
