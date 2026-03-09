import axios from 'axios';
import { DeviceConfig, Session } from '../store/sessionStore';
import { API_BASE_URL, API_HEALTH_URL, API_TIMEOUT_MS, isDevMode } from '../config/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (isDevMode()) {
  client.interceptors.request.use((config) => {
    console.info('[CloudDeviceLab] API request:', config.method?.toUpperCase(), `${config.baseURL}${config.url}`);
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      console.info('[CloudDeviceLab] API response:', response.status, response.config.url);
      return response;
    },
    (error) => {
      console.error('[CloudDeviceLab] API error:', error?.message || error);
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

export const apiClient = {
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await axios.get(API_HEALTH_URL, { timeout: 8000 });
      return response.status >= 200 && response.status < 300;
    } catch {
      return false;
    }
  },

  // Session Management
  async createSession(config: DeviceConfig): Promise<{ sessionId: string }> {
    if (isDevMode()) {
      console.info('[CloudDeviceLab] Launch endpoint:', `${API_BASE_URL}/sessions`, 'deviceType=', config.type);
    }

    const response = await client.post('/sessions', config);

    if (isDevMode()) {
      console.info('[CloudDeviceLab] Launch response status:', response.status, 'deviceType=', config.type);
    }

    return ensureSessionIdResponse(response.data);
  },

  async getSession(sessionId: string): Promise<Session> {
    const response = await client.get(`/sessions/${sessionId}`);
    return response.data;
  },

  async restartSession(sessionId: string): Promise<void> {
    await client.post(`/sessions/${sessionId}/restart`);
  },

  async resetSession(sessionId: string): Promise<void> {
    await client.post(`/sessions/${sessionId}/reset`);
  },

  async extendSession(sessionId: string, minutes: number): Promise<string> {
    const response = await client.post(`/sessions/${sessionId}/extend`, { minutes });
    return response.data.expiresAt;
  },

  async takeScreenshot(sessionId: string): Promise<Blob> {
    const response = await client.get(`/sessions/${sessionId}/screenshot`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async endSession(sessionId: string): Promise<void> {
    await client.delete(`/sessions/${sessionId}`);
  },

  // Android-specific controls
  async simulatePhoneAction(
    sessionId: string,
    action: 'call' | 'sms',
    data: { phoneNumber: string; message?: string }
  ): Promise<void> {
    await client.post(`/sessions/${sessionId}/phone`, { action, ...data });
  },

  async setLocation(sessionId: string, latitude: number, longitude: number): Promise<void> {
    await client.post(`/sessions/${sessionId}/location`, { latitude, longitude });
  },

  async rotateScreen(sessionId: string): Promise<void> {
    await client.post(`/sessions/${sessionId}/rotate`);
  },

  // Admin APIs
  async getActiveSessions(): Promise<Session[]> {
    const response = await client.get('/admin/sessions');
    return response.data;
  },

  async getSystemStats(): Promise<any> {
    const response = await client.get('/admin/stats');
    return response.data;
  },

  async getSystemLogs(limit?: number): Promise<any[]> {
    const response = await client.get('/admin/logs', { params: { limit } });
    return response.data;
  },
};
