import axios from 'axios';
import { getPool } from '../database';
import { logger } from '../utils/logger';

interface DeviceConfig {
  type: 'android' | 'windows';
  version: string;
  screenResolution: string;
  ram: string;
  cpu: string;
  language: string;
  sessionDuration: number;
  startUrl?: string;
}

export class VMOrchestrator {
  private vmHosts: string[];

  constructor() {
    // Load VM host pool from environment
    this.vmHosts = (process.env.VM_HOST_POOL || 'localhost:8080').split(',');
  }

  async createVM(sessionId: string, config: DeviceConfig): Promise<void> {
    try {
      logger.info(`Creating VM for session ${sessionId}`);

      // Update session status
      await this.updateSessionStatus(sessionId, 'starting');

      // Select available VM host
      const vmHost = await this.selectVMHost();

      // Create VM based on device type
      let vmId: string;
      let streamUrl: string;

      if (config.type === 'android') {
        const result = await this.createAndroidEmulator(vmHost, sessionId, config);
        vmId = result.vmId;
        streamUrl = result.streamUrl;
      } else {
        const result = await this.createWindowsVM(vmHost, sessionId, config);
        vmId = result.vmId;
        streamUrl = result.streamUrl;
      }

      // Update session with VM details
      const pool = getPool();
      await pool.query(
        `UPDATE sessions 
         SET status = $1, vm_id = $2, stream_url = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        ['running', vmId, streamUrl, sessionId]
      );

      logger.info(`VM created for session ${sessionId}: ${vmId}`);
    } catch (error) {
      logger.error(`Failed to create VM for session ${sessionId}:`, error);
      await this.updateSessionStatus(sessionId, 'stopped');
      throw error;
    }
  }

  private async createAndroidEmulator(
    vmHost: string,
    sessionId: string,
    config: DeviceConfig
  ): Promise<{ vmId: string; streamUrl: string }> {
    try {
      const response = await axios.post(`http://${vmHost}/api/android/create`, {
        sessionId,
        version: config.version,
        resolution: config.screenResolution,
        ram: config.ram,
        cpu: config.cpu,
        language: config.language,
        startUrl: config.startUrl,
      });

      return {
        vmId: response.data.vmId,
        streamUrl: response.data.streamUrl,
      };
    } catch (error) {
      logger.error('Failed to create Android emulator:', error);
      throw new Error('Failed to create Android emulator');
    }
  }

  private async createWindowsVM(
    vmHost: string,
    sessionId: string,
    config: DeviceConfig
  ): Promise<{ vmId: string; streamUrl: string }> {
    try {
      const response = await axios.post(`http://${vmHost}/api/windows/create`, {
        sessionId,
        version: config.version,
        resolution: config.screenResolution,
        ram: config.ram,
        cpu: config.cpu,
        language: config.language,
        startUrl: config.startUrl,
      });

      return {
        vmId: response.data.vmId,
        streamUrl: response.data.streamUrl,
      };
    } catch (error) {
      logger.error('Failed to create Windows VM:', error);
      throw new Error('Failed to create Windows VM');
    }
  }

  async restartVM(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    const vmHost = await this.getVMHost(session.vm_id);
    await axios.post(`http://${vmHost}/api/vm/${session.vm_id}/restart`);

    await this.updateSessionStatus(sessionId, 'starting');
    logger.info(`VM restarted: ${session.vm_id}`);
  }

  async resetVM(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    const vmHost = await this.getVMHost(session.vm_id);
    await axios.post(`http://${vmHost}/api/vm/${session.vm_id}/reset`);

    await this.updateSessionStatus(sessionId, 'starting');
    logger.info(`VM reset: ${session.vm_id}`);
  }

  async deleteVM(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      logger.warn(`No VM found for session ${sessionId}`);
      return;
    }

    const vmHost = await this.getVMHost(session.vm_id);
    await axios.delete(`http://${vmHost}/api/vm/${session.vm_id}`);

    logger.info(`VM deleted: ${session.vm_id}`);
  }

  async takeScreenshot(sessionId: string): Promise<Buffer> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    const vmHost = await this.getVMHost(session.vm_id);
    const response = await axios.get(`http://${vmHost}/api/vm/${session.vm_id}/screenshot`, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }

  async sendPhoneAction(
    sessionId: string,
    action: string,
    data: { phoneNumber: string; message?: string }
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    const vmHost = await this.getVMHost(session.vm_id);
    await axios.post(`http://${vmHost}/api/vm/${session.vm_id}/phone`, {
      action,
      ...data,
    });
  }

  async setLocation(sessionId: string, latitude: number, longitude: number): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    const vmHost = await this.getVMHost(session.vm_id);
    await axios.post(`http://${vmHost}/api/vm/${session.vm_id}/location`, {
      latitude,
      longitude,
    });
  }

  async rotateScreen(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    const vmHost = await this.getVMHost(session.vm_id);
    await axios.post(`http://${vmHost}/api/vm/${session.vm_id}/rotate`);
  }

  private async selectVMHost(): Promise<string> {
    // Simple round-robin selection (would be more sophisticated in production)
    // Check VM host availability and load
    for (const host of this.vmHosts) {
      try {
        const response = await axios.get(`http://${host}/health`, { timeout: 2000 });
        if (response.data.status === 'ok' && response.data.availableSlots > 0) {
          return host;
        }
      } catch (error) {
        logger.warn(`VM host ${host} is unavailable`);
      }
    }

    throw new Error('No available VM hosts');
  }

  private async getVMHost(vmId: string): Promise<string> {
    // In production, store VM->Host mapping in Redis
    // For now, return first available host
    return this.vmHosts[0];
  }

  private async updateSessionStatus(sessionId: string, status: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      `UPDATE sessions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [status, sessionId]
    );
  }

  private async getSession(sessionId: string): Promise<any> {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);

    if (result.rows.length === 0) {
      throw new Error('Session not found');
    }

    return result.rows[0];
  }
}
