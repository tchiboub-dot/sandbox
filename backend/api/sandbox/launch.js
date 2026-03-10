/**
 * API endpoint to launch an Android emulator session
 * POST /api/sandbox/launch
 */

import { v4 as uuidv4 } from 'uuid';

// In-memory session store (use database in production)
const sessions = new Map();

export default function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { emulatorName = 'default', timeout = 300000 } = req.body || {};

    // Generate a new session ID
    const sessionId = uuidv4();

    // Create session object
    const session = {
      id: sessionId,
      emulatorName,
      status: 'launching',
      createdAt: new Date(),
      startedAt: null,
      port: 5037 + Math.floor(Math.random() * 1000), // Mock port
      error: null,
    };

    // Store session
    sessions.set(sessionId, session);

    // Simulate async launch process
    setTimeout(() => {
      const s = sessions.get(sessionId);
      if (s) {
        s.status = 'running';
        s.startedAt = new Date();
      }
    }, 2000);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({
      success: true,
      sessionId,
      message: 'Emulator launch initiated',
      estimatedWaitTime: '60-120 seconds',
    });
  } catch (error) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Export for testing
export { sessions };
