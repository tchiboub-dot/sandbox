import { createClient } from 'redis';
import { logger } from './utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initRedis(): Promise<void> {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  // Suppress error event logging (will be handled by caller)
  redisClient.on('error', () => {
    // Silently ignore - connection errors are expected in mock mode
  });
  
  redisClient.on('connect', () => logger.info('Connected to Redis'));

  // Set a shorter timeout and don't wait for connection in mock mode
  await Promise.race([
    redisClient.connect(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
    )
  ]);
}

export function getRedisClient() {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis not initialized or not connected');
  }
  return redisClient;
}
