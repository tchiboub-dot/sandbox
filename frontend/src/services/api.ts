import axios from 'axios';
import { DeviceConfig, Session } from '../store/sessionStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  // Session Management
  async createSession(config: DeviceConfig): Promise<{ sessionId: string }> {
    const response = await client.post('/sessions', config);
    return response.data;
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
