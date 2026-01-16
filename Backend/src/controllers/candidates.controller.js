// src/controllers/candidates.controller.js
import { db } from "../config/db.js";
import { ok, fail } from "../utils/response.js";

/**
 * POST /api/candidates
 * Body: {
 *   full_name, headline, email, phone,
 *   experience_years, resume_text, skill_json
 * }
 * Candidate is linked logically to logged-in user (same email).
 */
export const createCandidate = async (req, res) => {
  try {
    const {
      full_name,
      headline,
      email,
      phone,
      experience_years,
      resume_text,
      skill_json
    } = req.body;

    if (!full_name || !email) {
      return fail(res, "Name and email are required", 400);
    }

    const [result] = await db.query(
      `INSERT INTO candidates 
      (full_name, headline, email, phone, experience_years, resume_text, skill_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        headline || null,
        email,
        phone || null,
        experience_years ?? null,
        resume_text || null,
        JSON.stringify(skill_json || [])
      ]
    );

    return ok(res, {
      message: "Candidate profile created",
      candidate_id: result.insertId
    }, 201);
  } catch (error) {
    console.error("Create Candidate Error:", error);
    return fail(res, "Failed to create candidate profile");
  }
};

/**
 * GET /api/candidates/:id
 */
export const getCandidate = async (req, res) => {
  try {
    const candidateId = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM candidates WHERE id = ?",
      [candidateId]
    );

    if (!rows[0]) {
      return fail(res, "Candidate not found", 404);
    }

    return ok(res, { candidate: rows[0] });
  } catch (error) {
    console.error("Get Candidate Error:", error);
    return fail(res, "Failed to fetch candidate");
  }
};
