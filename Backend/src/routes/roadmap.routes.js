// Backend/src/routes/roadmap.routes.js
import express from 'express';
import {
  getGoal,
  setGoal,
  getRoadmap,
  regenerateRoadmap,
  updateRecommendation,
  listActivities
} from '../controllers/roadmap.controller.js';
import {
  postImpressions,
  postInteraction,
  postFeedback,
  getFeedback
} from '../controllers/feedback.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Activities catalogue (authenticated students and platform roles)
router.get('/activities', requireAuth, listActivities);

// Student target goal operations
router.get('/goal', requireAuth, requireRole('student'), getGoal);
router.post('/goal', requireAuth, requireRole('student'), setGoal);

// Development roadmap & skill gap operations
router.get('/roadmap', requireAuth, requireRole('student'), getRoadmap);
router.post('/roadmap/generate', requireAuth, requireRole('student'), regenerateRoadmap);

// Recommendation lifecycle operations
router.patch('/roadmap/recommendations/:id', requireAuth, requireRole('student'), updateRecommendation);

// Recommendation impression tracking & interaction outcomes
router.post('/roadmap/impressions', requireAuth, requireRole('student'), postImpressions);
router.post('/roadmap/interactions', requireAuth, requireRole('student'), postInteraction);

// Explicit relevance feedback operations
router.post('/roadmap/feedback', requireAuth, requireRole('student'), postFeedback);
router.get('/roadmap/feedback', requireAuth, requireRole('student'), getFeedback);

export default router;
