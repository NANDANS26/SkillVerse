// Backend/tests/verify_production_secrets.js
import { spawnSync } from 'child_process';
import assert from 'assert/strict';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '..');

console.log('--- Production Mode Secret Validation Audit ---');

// Test 1: Missing JWT_SECRET in production mode
const res1 = spawnSync(process.execPath, [
  '--input-type=module',
  '-e',
  `process.env.NODE_ENV = 'production';
   process.env.JWT_SECRET = '';
   import('./src/config/env.js');`
], { cwd: backendDir, encoding: 'utf-8' });

assert.equal(res1.status, 1, 'Missing JWT_SECRET in production must exit with code 1');
assert.match(res1.stderr, /FATAL: A strong JWT_SECRET must be provided in production mode/);
console.log('PASS: Missing JWT_SECRET in production rejected with fatal error.');

// Test 2: Insecure/default JWT_SECRET in production mode
const res2 = spawnSync(process.execPath, [
  '--input-type=module',
  '-e',
  `process.env.NODE_ENV = 'production';
   process.env.JWT_SECRET = 'skillverse-dev-default-secret';
   import('./src/config/env.js');`
], { cwd: backendDir, encoding: 'utf-8' });

assert.equal(res2.status, 1, 'Development default JWT_SECRET in production must exit with code 1');
assert.match(res2.stderr, /FATAL: A strong JWT_SECRET must be provided in production mode/);
console.log('PASS: Insecure dev JWT_SECRET in production rejected with fatal error.');

// Test 3: Missing ML_SERVICE_SECRET in production mode
const res3 = spawnSync(process.execPath, [
  '--input-type=module',
  '-e',
  `process.env.NODE_ENV = 'production';
   process.env.JWT_SECRET = 'a-super-secure-production-jwt-secret-string-32chars';
   process.env.PGPASSWORD = 'a-super-secure-production-db-password';
   process.env.ML_SERVICE_SECRET = 'skillverse-internal-service-secret-local-dev';
   import('./src/config/env.js');`
], { cwd: backendDir, encoding: 'utf-8' });

assert.equal(res3.status, 1, 'Development default ML_SERVICE_SECRET in production must exit with code 1');
assert.match(res3.stderr, /FATAL: A secure, strong ML_SERVICE_SECRET must be configured in production mode/);
console.log('PASS: Dev ML_SERVICE_SECRET in production rejected with fatal error.');

// Test 4: Missing Database credentials in production mode
const res4 = spawnSync(process.execPath, [
  '--input-type=module',
  '-e',
  `process.env.NODE_ENV = 'production';
   process.env.JWT_SECRET = 'a-super-secure-production-jwt-secret-string-32chars';
   process.env.ML_SERVICE_SECRET = 'a-super-secure-ml-secret-string-32chars';
   delete process.env.DATABASE_URL;
   delete process.env.PGPASSWORD;
   import('./src/config/env.js');`
], { cwd: backendDir, encoding: 'utf-8' });

assert.equal(res4.status, 1, 'Missing DB password in production must exit with code 1');
assert.match(res4.stderr, /FATAL: PGPASSWORD or DATABASE_URL must be explicitly provided in production mode/);
console.log('PASS: Missing database password in production rejected with fatal error.');

console.log('ALL PRODUCTION SECURITY INVARIANTS VERIFIED SUCCESSFULLY.');

