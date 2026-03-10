import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface MockDeviceConfig {
  type: 'android' | 'windows';
  version: string;
  screenResolution: string;
  ram: string;
  cpu: string;
  language: string;
  sessionDuration: number;
  startUrl?: string;
}

interface MockSession {
  vmId: string;
  streamUrl: string;
  deviceType: 'android' | 'windows';
  status: 'starting' | 'running';
  createdAt: number;
}

/**
 * Mock Sandbox Engine for demo/development mode
 * Simulates VM provisioning without requiring real VM infrastructure
 */
export class MockSandboxEngine {
  private sessions: Map<string, MockSession> = new Map();

  /**
   * Simulate VM creation with realistic delay
   */
  async createMockVM(sessionId: string, config: MockDeviceConfig): Promise<{ vmId: string; streamUrl: string }> {
    const vmId = `mock-vm-${uuidv4().substring(0, 8)}`;
    
    logger.info(`[MockSandbox] Creating ${config.type} VM for session ${sessionId}`);
    logger.info(`[MockSandbox] Config: ${config.version}, ${config.screenResolution}, ${config.ram}, ${config.cpu}`);
    
    if (config.startUrl) {
      logger.info(`[MockSandbox] Will open URL: ${config.startUrl}`);
    }

    // Simulate provisioning delay (500-1500ms)
    const delay = 500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    const streamUrl = `/stream/${sessionId}`;
    
    const mockSession: MockSession = {
      vmId,
      streamUrl,
      deviceType: config.type,
      status: 'running',
      createdAt: Date.now(),
    };

    this.sessions.set(sessionId, mockSession);

    logger.info(`[MockSandbox] VM created: ${vmId} for session ${sessionId}`);
    logger.info(`[MockSandbox] Stream URL: ${streamUrl}`);

    return { vmId, streamUrl };
  }

  /**
   * Simulate VM restart
   */
  async restartMockVM(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Mock session not found');
    }

    logger.info(`[MockSandbox] Restarting VM ${session.vmId} for session ${sessionId}`);
    
    // Simulate restart delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    session.status = 'running';
    logger.info(`[MockSandbox] VM restarted: ${session.vmId}`);
  }

  /**
   * Simulate VM reset
   */
  async resetMockVM(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Mock session not found');
    }

    logger.info(`[MockSandbox] Resetting VM ${session.vmId} for session ${sessionId}`);
    
    // Simulate reset delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    session.status = 'running';
    logger.info(`[MockSandbox] VM reset complete: ${session.vmId}`);
  }

  /**
   * Simulate VM deletion
   */
  async deleteMockVM(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`[MockSandbox] Session ${sessionId} not found for deletion`);
      return;
    }

    logger.info(`[MockSandbox] Deleting VM ${session.vmId} for session ${sessionId}`);
    
    // Simulate cleanup delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.sessions.delete(sessionId);
    logger.info(`[MockSandbox] VM deleted: ${session.vmId}`);
  }

  /**
   * Simulate screenshot capture
   */
  async takeMockScreenshot(sessionId: string): Promise<Buffer> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Mock session not found');
    }

    logger.info(`[MockSandbox] Taking screenshot for session ${sessionId}`);
    
    // Return a minimal 1x1 PNG as placeholder
    // In a real implementation, this would capture the actual screen
    const mockPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    return mockPng;
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): MockSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): MockSession[] {
    return Array.from(this.sessions.values());
  }
}

// Singleton instance
export const mockSandbox = new MockSandboxEngine();
