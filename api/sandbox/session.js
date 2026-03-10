/**
 * Sandbox Session Info Endpoint - Vercel Serverless Function
 * GET /api/sandbox/session/[sessionId]
 * 
 * Returns information about a sandbox session
 */

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

  // Only accept GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Use GET to retrieve session info'
    });
  }

  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'sessionId is required'
      });
    }

    // Mock session response
    // In production, fetch from database
    const mockSession = {
      id: sessionId,
      status: 'running',
      deviceType: 'android',
      vmId: `mock-vm-${sessionId.substring(0, 8)}`,
      streamUrl: `/stream/${sessionId}`,
      createdAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };

    return res.status(200).json(mockSession);

  } catch (error) {
    console.error('[Session Error]', error);

    return res.status(500).json({
      error: 'Failed to fetch session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
