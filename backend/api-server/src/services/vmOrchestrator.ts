import axios from 'axios';
import { getPool } from '../database';
import { logger } from '../utils/logger';
import { mockSandbox } from './mockSandbox';

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
  private useMockMode: boolean;

  constructor() {
    // Load VM host pool from environment
    this.vmHosts = (process.env.VM_HOST_POOL || 'localhost:8080').split(',');
    
    // Enable mock mode for demo/development (default: true)
    this.useMockMode = process.env.MOCK_SANDBOX !== 'false';
    
    if (this.useMockMode) {
      logger.info('[VMOrchestrator] Mock sandbox mode enabled - sessions will be simulated');
    } else {
      logger.info(`[VMOrchestrator] Production mode - using VM hosts: ${this.vmHosts.join(', ')}`);
    }
  }

  async createVM(sessionId: string, config: DeviceConfig): Promise<void> {
    try {
      logger.info(`[VMOrchestrator] Creating VM for session ${sessionId} (type: ${config.type})`);

      // Update session status
      await this.updateSessionStatus(sessionId, 'starting');

      let vmId: string;
      let streamUrl: string;

      if (this.useMockMode) {
        // Use mock sandbox engine
        logger.info(`[VMOrchestrator] Using mock sandbox for session ${sessionId}`);
        const result = await mockSandbox.createMockVM(sessionId, config);
        vmId = result.vmId;
        streamUrl = result.streamUrl;
      } else {
        // Use real VM infrastructure
        logger.info(`[VMOrchestrator] Using production VM hosts for session ${sessionId}`);
        
        // Select available VM host
        const vmHost = await this.selectVMHost();
        logger.info(`[VMOrchestrator] Selected VM host: ${vmHost}`);

        // Create VM based on device type
        if (config.type === 'android') {
          const result = await this.createAndroidEmulator(vmHost, sessionId, config);
          vmId = result.vmId;
          streamUrl = result.streamUrl;
        } else {
          const result = await this.createWindowsVM(vmHost, sessionId, config);
          vmId = result.vmId;
          streamUrl = result.streamUrl;
        }
      }

      // Update session with VM details
      const pool = getPool();
      await pool.query(
        `UPDATE sessions 
         SET status = $1, vm_id = $2, stream_url = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        ['running', vmId, streamUrl, sessionId]
      );

      logger.info(`[VMOrchestrator] VM created successfully for session ${sessionId}: ${vmId}`);
      logger.info(`[VMOrchestrator] Stream URL: ${streamUrl}`);
    } catch (error) {
      logger.error(`[VMOrchestrator] Failed to create VM for session ${sessionId}:`, error);
      await this.updateSessionStatus(sessionId, 'stopped');
      
      // Provide more detailed error message
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw new Error('Unable to connect to VM infrastructure. Please try again or contact support.');
        }
        throw new Error(`VM creation failed: ${error.message}`);
      }
      
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

    logger.info(`[VMOrchestrator] Restarting VM for session ${sessionId}`);

    if (this.useMockMode) {
      await mockSandbox.restartMockVM(sessionId);
    } else {
      const vmHost = await this.getVMHost(session.vm_id);
      await axios.post(`http://${vmHost}/api/vm/${session.vm_id}/restart`);
    }

    await this.updateSessionStatus(sessionId, 'starting');
    logger.info(`[VMOrchestrator] VM restarted: ${session.vm_id}`);
  }

  async resetVM(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    logger.info(`[VMOrchestrator] Resetting VM for session ${sessionId}`);

    if (this.useMockMode) {
      await mockSandbox.resetMockVM(sessionId);
    } else {
      const vmHost = await this.getVMHost(session.vm_id);
      await axios.post(`http://${vmHost}/api/vm/${session.vm_id}/reset`);
    }

    await this.updateSessionStatus(sessionId, 'starting');
    logger.info(`[VMOrchestrator] VM reset: ${session.vm_id}`);
  }

  async deleteVM(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      logger.warn(`[VMOrchestrator] No VM found for session ${sessionId}`);
      return;
    }

    logger.info(`[VMOrchestrator] Deleting VM for session ${sessionId}`);

    if (this.useMockMode) {
      await mockSandbox.deleteMockVM(sessionId);
    } else {
      const vmHost = await this.getVMHost(session.vm_id);
      await axios.delete(`http://${vmHost}/api/vm/${session.vm_id}`);
    }

    logger.info(`[VMOrchestrator] VM deleted: ${session.vm_id}`);
  }

  async takeScreenshot(sessionId: string): Promise<Buffer> {
    const session = await this.getSession(sessionId);
    if (!session.vm_id) {
      throw new Error('VM not found');
    }

    logger.info(`[VMOrchestrator] Taking screenshot for session ${sessionId}`);

    if (this.useMockMode) {
      return await mockSandbox.takeMockScreenshot(sessionId);
    } else {
      const vmHost = await this.getVMHost(session.vm_id);
      const response = await axios.get(`http://${vmHost}/api/vm/${session.vm_id}/screenshot`, {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    }
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
