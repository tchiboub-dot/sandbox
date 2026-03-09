import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { SignalingHandler } from './signaling';

dotenv.config();

function buildCorsOriginValidator() {
  const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true';

  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    if (allowVercelPreviews) {
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.vercel.app')) {
          callback(null, true);
          return;
        }
      } catch {
        // Fall through to deny invalid origin.
      }
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  };
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: buildCorsOriginValidator(),
    methods: ['GET', 'POST', 'OPTIONS'],
  },
  transports: ['websocket', 'polling'],
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize signaling handler
const signalingHandler = new SignalingHandler(io);

const port = process.env.PORT || 5001;

httpServer.listen(port, () => {
  logger.info(`Signaling server running on port ${port}`);
});

export default httpServer;
