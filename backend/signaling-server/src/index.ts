import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { SignalingHandler } from './signaling';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
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
