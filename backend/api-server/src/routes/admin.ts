import { Router } from 'express';
import { getPool } from '../database';
import { logger } from '../utils/logger';
import os from 'os';

const router = Router();

// Get active sessions
router.get('/sessions', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM sessions 
       WHERE status IN ('pending', 'starting', 'running')
       ORDER BY created_at DESC`
    );

    const sessions = result.rows.map((row) => ({
      id: row.id,
      deviceConfig: row.device_config,
      status: row.status,
      vmId: row.vm_id,
      streamUrl: row.stream_url,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }));

    res.json(sessions);
  } catch (error) {
    logger.error('Error getting active sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();

    // Get active sessions count
    const sessionsResult = await pool.query(
      `SELECT COUNT(*) as count FROM sessions WHERE status IN ('pending', 'starting', 'running')`
    );
    const activeSessions = parseInt(sessionsResult.rows[0].count);

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
    const pool = getPool();

    const result = await pool.query(
      `SELECT * FROM system_logs 
       ORDER BY timestamp DESC 
       LIMIT $1`,
      [limit]
    );

    const logs = result.rows.map((row) => ({
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
