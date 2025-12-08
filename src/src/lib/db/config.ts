import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const pool = new Pool({
  host: process.env.DB_HOST || '192.168.1.7',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'game',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
    console.log(pool.options.host, pool.options.port, pool.options.database);
    console.log('Executing query:', text, params);
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export default pool;
