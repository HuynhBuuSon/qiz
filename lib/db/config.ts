import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from project root if it exists
const envPath = process.env.NODE_ENV === 'production' 
  ? path.resolve(__dirname, '../../.env.local')
  : path.resolve(__dirname, '../../../.env.local');

dotenv.config({ path: envPath });

// Database configuration with fallbacks for Docker and local development
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'game',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  // For Docker Compose, add these for connection pooling
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  console.error(`DB Connection Info - Host: ${process.env.DB_HOST}, Port: ${process.env.DB_PORT}, DB: ${process.env.DB_NAME}`);
});

pool.on('connect', () => {
  console.log(`✅ Connected to PostgreSQL at ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

export const query = (text: string, params?: any[]) => {
  if (process.env.DEBUG_DB) {
    console.log(`[DB] Host: ${pool.options.host}:${pool.options.port}/${pool.options.database}`);
    console.log(`[DB Query] ${text.substring(0, 100)}...`, params ? `[Params: ${params.length}]` : '');
  }
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export default pool;
