import { Router } from 'express';
import { getPool, isDatabaseAvailable } from '../database';
import { logger } from '../utils/logger';
import { memoryStore } from '../services/memoryStore';
import os from 'os';

const router = Router();

// Get active sessions
router.get('/sessions', async (req, res) => {
  try {
    const useDatabase = isDatabaseAvailable();
    let sessions;

    if (useDatabase) {
      const pool = getPool();
      const result = await pool!.query(
        `SELECT * FROM sessions 
         WHERE status IN ('pending', 'starting', 'running')
         ORDER BY created_at DESC`
      );

      sessions = result.rows.map((row: any) => ({
        id: row.id,
        deviceConfig: row.device_config,
        status: row.status,
        vmId: row.vm_id,
        streamUrl: row.stream_url,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      }));
    } else {
      const allSessions = await memoryStore.getAllSessions();
      sessions = allSessions
        .filter(s => ['pending', 'starting', 'running'].includes(s.status))
        .map(row => ({
          id: row.id,
          deviceConfig: row.device_config,
          status: row.status,
          vmId: row.vm_id,
          streamUrl: row.stream_url,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    res.json(sessions);
  } catch (error) {
    logger.error('Error getting active sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const useDatabase = isDatabaseAvailable();
    let activeSessions = 0;

    if (useDatabase) {
      const pool = getPool();
      const sessionsResult = await pool!.query(
        `SELECT COUNT(*) as count FROM sessions WHERE status IN ('pending', 'starting', 'running')`
      );
      activeSessions = parseInt(sessionsResult.rows[0].count);
    } else {
      const stats = memoryStore.getStats();
      activeSessions = stats.active + stats.pending;
    }

    // Get system metrics
    const cpuUsage = Math.round(os.loadavg()[0] / os.cpus().length * 100);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // Mock data for charts (would be replaced with actual historical data)
    const cpuHistory = Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}m`,
      value: Math.random() * 100,
    }));

    const memoryHistory = Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}m`,
      value: Math.random() * 100,
    }));

    // Calculate available VMs (mock calculation)
    const totalVMs = 50;
    const availableVMs = totalVMs - activeSessions;

    // Get alerts
    const alerts = [];
    if (cpuUsage > 80) {
      alerts.push({ message: 'High CPU usage detected', level: 'warning' });
    }
    if (memoryUsage > 80) {
      alerts.push({ message: 'High memory usage detected', level: 'warning' });
    }
    if (availableVMs < 5) {
      alerts.push({ message: 'Low VM availability', level: 'critical' });
    }

    res.json({
      activeSessions,
      cpuUsage,
      memoryUsage,
      availableVMs,
      cpuHistory,
      memoryHistory,
      alerts,
    });
  } catch (error) {
    logger.error('Error getting system stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const useDatabase = isDatabaseAvailable();

    if (!useDatabase) {
      // Return empty logs in mock mode (could be enhanced with in-memory log buffer)
      return res.json([]);
    }

    const pool = getPool();
    const result = await pool!.query(
      `SELECT * FROM system_logs 
       ORDER BY timestamp DESC 
       LIMIT $1`,
      [limit]
    );

    const logs = result.rows.map((row: any) => ({
      timestamp: row.timestamp,
      level: row.level,
      message: row.message,
      metadata: row.metadata,
    }));

    res.json(logs);
  } catch (error) {
    logger.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

export default router;
