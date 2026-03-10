/**
 * API client service for interacting with the Sandbox emulator API
 */

import { API_BASE_URL } from '../config/api';

export interface LaunchResponse {
  success: boolean;
  sessionId: string;
  message: string;
  estimatedWaitTime: string;
}

export interface SessionStatus {
  id: string;
  status: 'launching' | 'running' | 'stopped' | 'error';
  emulatorName: string;
  port: number;
  createdAt: string;
  startedAt?: string;
  uptime?: string;
  error?: string;
}

export interface SessionResponse {
  success: boolean;
  session: SessionStatus;
}

/**
 * Launch an Android emulator session
 */
export async function launchEmulator(options?: {
  emulatorName?: string;
  timeout?: number;
}): Promise<LaunchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sandbox/launch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });

  if (!response.ok) {
    throw new Error(`Failed to launch emulator: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the status of a sandbox session
 */
export async function getSessionStatus(sessionId: string): Promise<SessionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/sandbox/session/${encodeURIComponent(sessionId)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get session status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Poll for session status with timeout
 */
export async function pollSessionStatus(
  sessionId: string,
  options?: {
    pollInterval?: number;
    maxDuration?: number;
    onStatusChange?: (status: SessionStatus) => void;
  }
): Promise<SessionStatus> {
  const pollInterval = options?.pollInterval || 15000; // 15 seconds
  const maxDuration = options?.maxDuration || 300000; // 5 minutes
  const startTime = Date.now();

  let lastStatus: SessionStatus | null = null;

  while (Date.now() - startTime < maxDuration) {
    try {
      const result = await getSessionStatus(sessionId);

      if (result.session) {
        const { session } = result;

        // Notify if status changed
        if (lastStatus?.status !== session.status) {
          options?.onStatusChange?.(session);
        }

        lastStatus = session;

        // Return when running
        if (session.status === 'running') {
          return session;
        }

        // Return immediately on error
        if (session.status === 'error') {
          return session;
        }
      }
    } catch (error) {
      console.error('Error polling session status:', error);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Session launch timeout exceeded');
}
