// Backend/src/config/db.js
import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: env.PGSSL ? { rejectUnauthorized: false } : false
    }
  : {
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: env.PGSSL ? { rejectUnauthorized: false } : false
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error] Unexpected error on idle client:', err.message);
});

const defaultQuery = (text, params) => pool.query(text, params);

export const db = {
  query: defaultQuery,
  connect: async () => {
    if (db.query !== defaultQuery) {
      return {
        query: (text, params) => db.query(text, params),
        release: () => {}
      };
    }
    return pool.connect();
  },
  pool
};

export const closePool = async () => {
  await pool.end();
};
