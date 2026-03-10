/**
 * API endpoint to query Android emulator session status
 * GET /api/sandbox/session/:sessionId
 */

export default function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(400).json({ error: 'Session ID is required' });
      return;
    }

    // In a real implementation, fetch from database
    // For now, return mock response
    const session = {
      id: sessionId,
      status: 'running',
      emulatorName: 'default',
      port: 5037,
      createdAt: new Date(Date.now() - 120000),
      startedAt: new Date(Date.now() - 100000),
      uptime: '100 seconds',
    };

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      session,
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
