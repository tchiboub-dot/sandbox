import { Pool } from 'pg';
import { logger } from './utils/logger';

let pool: Pool | null = null;
let dbAvailable = false;

export async function initDatabase(): Promise<void> {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cloud_device_lab',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Fail fast in mock mode
  });

  // Test connection
  await pool.query('SELECT NOW()');

  // Create tables if they don't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      device_type VARCHAR(50) NOT NULL,
      device_config JSONB NOT NULL,
      status VARCHAR(50) NOT NULL,
      vm_id VARCHAR(255),
      stream_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS system_logs (
      id SERIAL PRIMARY KEY,
      level VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON system_logs(timestamp DESC);
  `);

  dbAvailable = true;
  logger.info('Database tables initialized');
}

export function getPool(): Pool | null {
  return pool;
}

export function isDatabaseAvailable(): boolean {
  return dbAvailable;
}
