import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import sessionRoutes from './routes/sessions';
import adminRoutes from './routes/admin';
import { errorHandler } from './middleware/errorHandler';
import { initDatabase } from './database';
import { initRedis } from './redis';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized');

    // Initialize Redis
    await initRedis();
    logger.info('Redis initialized');

    // Start server
    app.listen(port, () => {
      logger.info(`API Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
