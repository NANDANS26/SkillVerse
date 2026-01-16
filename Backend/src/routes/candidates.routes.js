// src/routes/candidates.routes.js
import { Router } from "express";
import { createCandidate, getCandidate } from "../controllers/candidates.controller.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// Candidate (or admin) can create/update their profile
router.post("/", authMiddleware(["candidate", "admin"]), createCandidate);

// Candidate, recruiter, or admin can view candidate profile
router.get("/:id", authMiddleware(["candidate", "recruiter", "admin"]), getCandidate);

export default router;
