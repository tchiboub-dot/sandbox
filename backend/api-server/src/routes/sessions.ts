import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { getPool } from '../database';
import { getRedisClient } from '../redis';
import { logger } from '../utils/logger';
import { VMOrchestrator } from '../services/vmOrchestrator';

const router = Router();
const vmOrchestrator = new VMOrchestrator();

// Validation schemas
const deviceConfigSchema = Joi.object({
  type: Joi.string().valid('android', 'windows').required(),
  version: Joi.string().required(),
  screenResolution: Joi.string().required(),
  ram: Joi.string().required(),
  cpu: Joi.string().required(),
  language: Joi.string().required(),
  sessionDuration: Joi.number().min(15).max(240).required(),
  networkSpeed: Joi.string().optional(),
  startUrl: Joi.string().uri().optional(),
});

// Create new session
router.post('/', async (req, res) => {
  try {
    logger.info('[Sessions] Received session creation request');
    logger.info(`[Sessions] Request body: ${JSON.stringify(req.body, null, 2)}`);

    const { error, value } = deviceConfigSchema.validate(req.body);
    if (error) {
      logger.warn(`[Sessions] Validation error: ${error.details[0].message}`);
      return res.status(400).json({ error: error.details[0].message });
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + value.sessionDuration * 60 * 1000);

    logger.info(`[Sessions] Creating session ${sessionId} for ${value.type} device`);

    // Store session in database
    const pool = getPool();
    await pool.query(
      `INSERT INTO sessions (id, device_type, device_config, status, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, value.type, JSON.stringify(value), 'pending', expiresAt]
    );

    logger.info(`[Sessions] Session ${sessionId} record created, queueing VM creation`);

    // Queue VM creation
    await vmOrchestrator.createVM(sessionId, value);

    logger.info(`[Sessions] Session ${sessionId} created successfully`);

    res.status(201).json({ sessionId });
  } catch (error) {
    logger.error('[Sessions] Error creating session:', error);
    
    // Provide detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
    const statusCode = errorMessage.includes('Unable to connect') ? 503 : 500;
    
    res.status(statusCode).json({ 
      error: 'Session creation failed',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Get session details
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pool = getPool();

    const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];
    res.json({
      id: session.id,
      deviceConfig: session.device_config,
      status: session.status,
      vmId: session.vm_id,
      streamUrl: session.stream_url,
      createdAt: session.created_at,
      expiresAt: session.expires_at,
    });
  } catch (error) {
    logger.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Restart session
router.post('/:sessionId/restart', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await vmOrchestrator.restartVM(sessionId);
    logger.info(`Session restarted: ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error restarting session:', error);
    res.status(500).json({ error: 'Failed to restart session' });
  }
});

// Reset session
router.post('/:sessionId/reset', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await vmOrchestrator.resetVM(sessionId);
    logger.info(`Session reset: ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error resetting session:', error);
    res.status(500).json({ error: 'Failed to reset session' });
  }
});

// Extend session
router.post('/:sessionId/extend', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { minutes } = req.body;

    if (!minutes || minutes < 15 || minutes > 120) {
      return res.status(400).json({ error: 'Invalid extension duration' });
    }

    const pool = getPool();
    const result = await pool.query(
      `UPDATE sessions 
       SET expires_at = expires_at + INTERVAL '${minutes} minutes',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING expires_at`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.info(`Session extended: ${sessionId} by ${minutes} minutes`);
    res.json({ expiresAt: result.rows[0].expires_at });
  } catch (error) {
    logger.error('Error extending session:', error);
    res.status(500).json({ error: 'Failed to extend session' });
  }
});

// Take screenshot
router.get('/:sessionId/screenshot', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const screenshot = await vmOrchestrator.takeScreenshot(sessionId);

    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    logger.error('Error taking screenshot:', error);
    res.status(500).json({ error: 'Failed to take screenshot' });
  }
});

// End session
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Delete VM
    await vmOrchestrator.deleteVM(sessionId);

    // Delete session from database
    const pool = getPool();
    await pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    logger.info(`Session ended: ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Android-specific: Simulate phone actions
router.post('/:sessionId/phone', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, phoneNumber, message } = req.body;

    await vmOrchestrator.sendPhoneAction(sessionId, action, { phoneNumber, message });

    logger.info(`Phone action sent: ${sessionId} - ${action}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error sending phone action:', error);
    res.status(500).json({ error: 'Failed to send phone action' });
  }
});

// Set location
router.post('/:sessionId/location', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { latitude, longitude } = req.body;

    await vmOrchestrator.setLocation(sessionId, latitude, longitude);

    logger.info(`Location set: ${sessionId} - ${latitude}, ${longitude}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error setting location:', error);
    res.status(500).json({ error: 'Failed to set location' });
  }
});

// Rotate screen
router.post('/:sessionId/rotate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await vmOrchestrator.rotateScreen(sessionId);

    logger.info(`Screen rotated: ${sessionId}`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error rotating screen:', error);
    res.status(500).json({ error: 'Failed to rotate screen' });
  }
});

export default router;
