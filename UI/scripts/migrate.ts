import dotenv from 'dotenv';
import path from 'path';
import { runMigrations } from '@/lib/db/migrations';
import pool from '@/lib/db/config';

// Load .env.local from project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function migrate() {
  try {
    console.log('Starting database migrations...');
    console.log('Using DB:', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);
    await runMigrations();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();
