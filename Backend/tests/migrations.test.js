// Backend/tests/migrations.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

describe('Database Schema & Migrations Suite', () => {
  it('contains the versioned migrations directory', () => {
    assert.equal(fs.existsSync(MIGRATIONS_DIR), true);
  });

  it('contains valid 001_initial_schema.sql defining core tables', () => {
    const file001 = path.join(MIGRATIONS_DIR, '001_initial_schema.sql');
    assert.equal(fs.existsSync(file001), true);

    const sql = fs.readFileSync(file001, 'utf-8');
    assert.match(sql, /CREATE TABLE IF NOT EXISTS schema_migrations/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS users/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS candidates/i);
    assert.match(sql, /user_id INT NULL/i); // Foreign key linkage to users
    assert.match(sql, /fk_candidates_user/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS jobs/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS applications/i);
  });

  it('contains 002_role_normalization.sql with safe non-escalating vocabulary mapping', () => {
    const file002 = path.join(MIGRATIONS_DIR, '002_role_normalization.sql');
    assert.equal(fs.existsSync(file002), true);

    const sql = fs.readFileSync(file002, 'utf-8');
    assert.match(sql, /UPDATE users\s+SET role = 'student'\s+WHERE role = 'candidate'/i);
    assert.match(sql, /UPDATE users\s+SET role = 'legacy_admin_pending'\s+WHERE role = 'admin'/i);
    assert.match(sql, /UPDATE users\s+SET role = 'super_admin'\s+WHERE role = 'admin' AND email = 'admin@skillverse\.test'/i);
  });

  it('contains 005_personalized_roadmaps_and_learning.sql defining goals, activities, and recommendations', () => {
    const file005 = path.join(MIGRATIONS_DIR, '005_personalized_roadmaps_and_learning.sql');
    assert.equal(fs.existsSync(file005), true);

    const sql = fs.readFileSync(file005, 'utf-8');
    assert.match(sql, /CREATE TABLE IF NOT EXISTS student_goals/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS learning_activities/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS development_roadmaps/i);
    assert.match(sql, /CREATE TABLE IF NOT EXISTS roadmap_recommendations/i);
  });
});
