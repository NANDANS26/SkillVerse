// Backend/src/config/env.js
import dotenv from 'dotenv';
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET || (isProd ? null : 'skillverse-dev-jwt-secret-key-32chars-min-local');
if (isProd && (!JWT_SECRET || JWT_SECRET === 'supersecret' || JWT_SECRET.includes('dev'))) {
  throw new Error('FATAL: A strong JWT_SECRET must be provided in production mode.');
}

// PostgreSQL Configuration
const DATABASE_URL = process.env.DATABASE_URL || null;
const PGHOST = process.env.PGHOST || '127.0.0.1';
const PGPORT = parseInt(process.env.PGPORT || '5432', 10);
const PGUSER = process.env.PGUSER || 'postgres';
const PGPASSWORD = process.env.PGPASSWORD !== undefined ? process.env.PGPASSWORD : (isProd ? null : '');
if (isProd && !DATABASE_URL && PGPASSWORD === null) {
  throw new Error('FATAL: PGPASSWORD or DATABASE_URL must be explicitly provided in production mode.');
}
const PGDATABASE = process.env.PGDATABASE || 'skillverse';
const PGSSL = process.env.PGSSL === 'true' || (isProd && process.env.PGSSL !== 'false');

const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const ML_SERVICE_SECRET = process.env.ML_SERVICE_SECRET || (isProd ? null : 'skillverse-internal-service-secret-local-dev');
if (isProd && (!ML_SERVICE_SECRET || ML_SERVICE_SECRET.includes('dev'))) {
  throw new Error('FATAL: A secure, strong ML_SERVICE_SECRET must be configured in production mode.');
}

export const env = {
  NODE_ENV,
  isProd,
  JWT_SECRET: JWT_SECRET || 'skillverse-dev-jwt-secret-key-32chars-min-local',
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGUSER,
  PGPASSWORD: PGPASSWORD ?? '',
  PGDATABASE,
  PGSSL,
  PORT,
  FRONTEND_ORIGIN,
  ML_SERVICE_URL,
  ML_SERVICE_SECRET
};
