import { Router } from "express";
import {
  createJob,
  getJob,
  getMatches,
  listJobsForRecruiter
} from "../controllers/jobs.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// List jobs for recruiter
router.get("/", authMiddleware(["recruiter", "admin"]), listJobsForRecruiter);

// Create job
router.post("/", authMiddleware(["recruiter", "admin"]), createJob);

// Get job details
router.get("/:id", authMiddleware(["recruiter", "admin"]), getJob);

// Get AI matches
router.get("/:id/matches", authMiddleware(["recruiter", "admin"]), getMatches);

export default router;
