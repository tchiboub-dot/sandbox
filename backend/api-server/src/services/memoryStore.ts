import { logger } from '../utils/logger';

interface Session {
  id: string;
  device_type: string;
  device_config: any;
  status: string;
  vm_id?: string;
  stream_url?: string;
  created_at: Date;
  expires_at: Date;
  updated_at: Date;
}

/**
 * In-memory session storage for demo/mock mode
 * Used when database is not available
 */
class MemorySessionStore {
  private sessions: Map<string, Session> = new Map();

  async createSession(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
    logger.info(`[MemoryStore] Session created: ${session.id}`);
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.get(id) || null;
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.set(id, { ...session, ...updates, updated_at: new Date() });
      logger.info(`[MemoryStore] Session updated: ${id}`);
    }
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    logger.info(`[MemoryStore] Session deleted: ${id}`);
  }

  async cleanup(): Promise<number> {
    const now = new Date();
    let deleted = 0;
    
    for (const [id, session] of this.sessions.entries()) {
      if (session.expires_at < now) {
        this.sessions.delete(id);
        deleted++;
      }
    }
    
    if (deleted > 0) {
      logger.info(`[MemoryStore] Cleaned up ${deleted} expired sessions`);
    }
    
    return deleted;
  }

  getStats() {
    const sessions = Array.from(this.sessions.values());
    return {
      total: sessions.length,
      active: sessions.filter(s => s.status === 'running').length,
      pending: sessions.filter(s => s.status === 'pending').length,
    };
  }
}

export const memoryStore = new MemorySessionStore();
