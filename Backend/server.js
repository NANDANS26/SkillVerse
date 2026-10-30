// Backend/server.js
import express from 'express';
import cors from 'cors';
import { env } from './src/config/env.js';
import { db } from './src/config/db.js';
import { parseCookies } from './src/middleware/auth.js';

import authRoutes from './src/routes/auth.routes.js';
import jobsRoutes from './src/routes/jobs.routes.js';
import candidatesRoutes from './src/routes/candidates.routes.js';
import institutionsRoutes from './src/routes/institutions.routes.js';
import facultyRoutes from './src/routes/faculty.routes.js';
import companiesRoutes from './src/routes/companies.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import skillsRoutes from './src/routes/skills.routes.js';
import assessmentsRoutes from './src/routes/assessments.routes.js';
import roadmapRoutes from './src/routes/roadmap.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import pilotRoutes from './src/routes/pilot.routes.js';
import { startIndexingWorker } from './src/services/indexing_queue.service.js';

const app = express();

// CORS configuration supporting cookie credentials
app.use(cors({
  origin: env.FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use((req, _res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});

// Root & Health check
app.get('/', (_req, res) => {
  res.json({ success: true, service: 'SkillVerse Core API', version: '1.0.0' });
});

app.get('/health', async (_req, res) => {
  let dbStatus = 'connected';
  try {
    await db.query('SELECT 1');
  } catch {
    dbStatus = 'disconnected';
  }
  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'skillverse-backend',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/student', roadmapRoutes);
app.use('/api/pilot', pilotRoutes);
app.use('/api/student/pilot', pilotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: env.isProd ? 'Internal server error' : (err.message || 'Internal server error')
  });
});

const isTestRun = process.env.NODE_ENV === 'test' ||
  process.env.npm_lifecycle_event === 'test' ||
  process.argv.some(a => a.includes('--test') || a.includes('node:test')) ||
  process.execArgv.some(a => a.includes('--test') || a.includes('node:test'));

if (!isTestRun) {
  app.listen(env.PORT, () => {
    console.log(`SkillVerse Backend running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    // Start background indexing recovery worker
    startIndexingWorker(15000);
  });
}

export default app;
