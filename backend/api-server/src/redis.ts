import { createClient } from 'redis';
import { logger } from './utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initRedis(): Promise<void> {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => logger.error('Redis error:', err));
  redisClient.on('connect', () => logger.info('Connected to Redis'));

  await redisClient.connect();
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis not initialized');
  }
  return redisClient;
}
