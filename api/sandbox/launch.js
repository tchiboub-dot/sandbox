/**
 * Sandbox Launch Endpoint - Vercel Serverless Function
 * POST /api/sandbox/launch
 * 
 * Creates a new sandbox session for Android or Windows device
 */

import { randomUUID } from 'crypto';

// In-memory session storage
// Note: In production, use a persistent database (PostgreSQL, MongoDB, etc.)
// Sessions stored here are per-execution and may not persist across invocations
const sessionStore = new Map();

function generateSessionId() {
  return randomUUID();
}

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use POST to launch a sandbox device'
    });
  }

  try {
    const { type, deviceType } = req.body;
    const launchType = type || deviceType;

    // Validate device type
    if (!launchType || !['android', 'windows'].includes(launchType)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'type must be "android" or "windows"'
      });
    }

    // Generate session ID
    const sessionId = generateSessionId();
    const timestamp = new Date().toISOString();
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Create mock session
    const session = {
      id: sessionId,
      type: launchType,
      status: 'running',
      createdAt: timestamp,
      expiresAt: expiry,
      vmId: `mock-vm-${randomUUID().substring(0, 8)}`,
      streamUrl: `/stream/${sessionId}`
    };

    // Store in memory (ephemeral)
    sessionStore.set(sessionId, session);

    if (process.env.DEBUG) {
      console.log(`[Sandbox] Created session: ${sessionId} for ${launchType}`);
    }

    // Return success response matching frontend expectations
    return res.status(200).json({
      sessionId,
      deviceType: launchType,
      status: 'running',
      streamUrl: session.streamUrl,
      vmId: session.vmId
    });

  } catch (error) {
    console.error('[Sandbox Error]', error);

    return res.status(500).json({
      error: 'Sandbox launch failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

