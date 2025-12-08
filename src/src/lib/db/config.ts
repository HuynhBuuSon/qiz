import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'game',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'YourStrongPassword123!',
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
