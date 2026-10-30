// Backend/src/db/migrate.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../config/env.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export async function runMigrations(customConfig = null) {
  const config = customConfig || (env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL, ssl: env.PGSSL ? { rejectUnauthorized: false } : false }
    : {
        host: env.PGHOST,
        port: env.PGPORT,
        user: env.PGUSER,
        password: env.PGPASSWORD,
        database: env.PGDATABASE,
        ssl: env.PGSSL ? { rejectUnauthorized: false } : false
      });

  const targetDb = config.database || config.connectionString || `${env.PGHOST}:${env.PGPORT}/${env.PGDATABASE}`;
  console.log(`[Migration] Connecting to PostgreSQL at ${targetDb}...`);

  const client = new Client(config);
  try {
    await client.connect();
  } catch (err) {
    console.error(`[Migration] Database connection failed:`, err.message);
    throw err;
  }

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch applied migrations
    const { rows: appliedRows } = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC');
    const appliedNames = new Set(appliedRows.map(r => r.name));

    // 3. Read migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log(`[Migration] No migrations directory found at ${MIGRATIONS_DIR}`);
      return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let pendingCount = 0;
    for (const file of files) {
      if (appliedNames.has(file)) {
        continue;
      }

      pendingCount++;
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`[Migration] Applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[Migration] Successfully applied ${file}`);
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`[Migration] Failed applying ${file}:`, migrationErr.message);
        throw migrationErr;
      }
    }

    if (pendingCount === 0) {
      console.log('[Migration] Database is already up to date. No pending migrations.');
    } else {
      console.log(`[Migration] Applied ${pendingCount} migration(s) successfully.`);
    }
  } finally {
    await client.end();
  }
}

// Allow CLI execution via `node migrate.js`
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
