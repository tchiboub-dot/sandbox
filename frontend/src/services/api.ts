import axios, { AxiosError } from 'axios';
import { DeviceConfig, Session } from '../store/sessionStore';
import { API_BASE_URL, API_HEALTH_URL, API_TIMEOUT_MS, isDevMode, getDeploymentInfo } from '../config/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for development logging
if (isDevMode()) {
  client.interceptors.request.use((config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.info('[API] Request:', {
      method: config.method?.toUpperCase(),
      url: fullUrl,
      data: config.data ? { type: (config.data as any)?.type } : undefined,
    });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      console.info('[API] Response OK:', {
        status: response.status,
        url: response.config.url,
      });
      return response;
    },
    (error) => {
      const axiosError = error as AxiosError;
      console.error('[API] Response Error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        url: axiosError.config?.url,
        message: axiosError.message,
        code: axiosError.code,
      });
      return Promise.reject(error);
    }
  );
}

function ensureSessionIdResponse(data: unknown): { sessionId: string } {
  if (!data || typeof data !== 'object' || !('sessionId' in data)) {
    throw new Error('Invalid API response while creating session');
  }

  const response = data as { sessionId?: unknown };
  if (typeof response.sessionId !== 'string' || response.sessionId.length === 0) {
    throw new Error('Invalid session identifier returned by API');
  }

  return { sessionId: response.sessionId };
}

/**
 * Helper to format error messages for user display
 */
function formatErrorMessage(error: unknown, context: string): string {
  if (isDevMode()) {
    console.error(`[API] Error in ${context}:`, error);
  }

  if (axios.isAxiosError(error)) {
    // Network error (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return `${context} timed out. Server may be overloaded or unreachable.`;
      }
      if (error.message.includes('CORS')) {
        return `${context} blocked by CORS policy. Backend configuration issue.`;
      }
      return `${context} failed. Backend service unreachable. Verify API configuration.`;
    }

    // Specific HTTP error status
    if (error.response.status === 503) {
      return `${context} unavailable. Backend service is temporarily down.`;
    }
    if (error.response.status === 502 || error.response.status === 504) {
      return `${context} timeout. Backend service temporarily unavailable.`;
    }
    if (error.response.status === 401 || error.response.status === 403) {
      return `${context} denied. Authentication or permission issue.`;
    }

    // Use server's error message if available
    const serverMessage = (error.response.data as any)?.message || (error.response.data as any)?.error;
    return serverMessage || `${context} failed (${error.response.status})`;
  }

  if (error instanceof Error) {
    return `${context} failed: ${error.message}`;
  }

  return `${context} failed: Unknown error`;
}

export const apiClient = {
  /**
   * Check if backend is healthy and reachable
   */
  async checkBackendHealth(): Promise<{
    isHealthy: boolean;
    isConfigured: boolean;
    deploymentInfo: ReturnType<typeof getDeploymentInfo>;
  }> {
    const deploymentInfo = getDeploymentInfo();
    
    try {
      const response = await axios.get(API_HEALTH_URL, { timeout: 5000 });
      return {
        isHealthy: response.status >= 200 && response.status < 300,
        isConfigured: true,
        deploymentInfo,
      };
    } catch (error) {
      if (isDevMode()) {
        console.warn('[API] Backend health check failed:', error);
      }
      return {
        isHealthy: false,
        isConfigured: !!deploymentInfo.customBackend || API_HEALTH_URL.startsWith('http'),
        deploymentInfo,
      };
    }
  },

  // Session Management
  async createSession(config: DeviceConfig): Promise<{ sessionId: string }> {
    if (isDevMode()) {
      console.info('[API] Creating session:', {
        endpoint: `/sessions`,
        deviceType: config.type,
      });
    }

    try {
      const response = await client.post('/sessions', config);

      if (isDevMode()) {
        console.info('[API] Session created:', {
          status: response.status,
          sessionId: response.data?.sessionId,
        });
      }

      return ensureSessionIdResponse(response.data);
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Session creation'));
    }
  },

  async getSession(sessionId: string): Promise<Session> {
    try {
      const response = await client.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Get session'));
    }
  },

  async restartSession(sessionId: string): Promise<void> {
    try {
      await client.post(`/sessions/${sessionId}/restart`);
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Restart session'));
    }
  },

  async resetSession(sessionId: string): Promise<void> {
    try {
      await client.post(`/sessions/${sessionId}/reset`);
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Reset session'));
    }
  },

  async extendSession(sessionId: string, minutes: number): Promise<string> {
    try {
      const response = await client.post(`/sessions/${sessionId}/extend`, { minutes });
      return response.data.expiresAt;
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Extend session'));
    }
  },

  async takeScreenshot(sessionId: string): Promise<Blob> {
    try {
      const response = await client.get(`/sessions/${sessionId}/screenshot`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Screenshot'));
    }
  },

  async endSession(sessionId: string): Promise<void> {
    try {
      await client.delete(`/sessions/${sessionId}`);
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'End session'));
    }
  },

  // Android-specific controls
  async simulatePhoneAction(
    sessionId: string,
    action: 'call' | 'sms',
    data: { phoneNumber: string; message?: string }
  ): Promise<void> {
    try {
      await client.post(`/sessions/${sessionId}/phone`, { action, ...data });
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Phone action'));
    }
  },

  async setLocation(sessionId: string, latitude: number, longitude: number): Promise<void> {
    try {
      await client.post(`/sessions/${sessionId}/location`, { latitude, longitude });
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Set location'));
    }
  },

  async rotateScreen(sessionId: string): Promise<void> {
    try {
      await client.post(`/sessions/${sessionId}/rotate`);
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Rotate screen'));
    }
  },

  // Admin APIs
  async getActiveSessions(): Promise<Session[]> {
    try {
      const response = await client.get('/admin/sessions');
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Get sessions'));
    }
  },

  async getSystemStats(): Promise<any> {
    try {
      const response = await client.get('/admin/stats');
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Get stats'));
    }
  },

  async getSystemLogs(limit?: number): Promise<any[]> {
    try {
      const response = await client.get('/admin/logs', { params: { limit } });
      return response.data;
    } catch (error) {
      throw new Error(formatErrorMessage(error, 'Get logs'));
    }
  },
};
