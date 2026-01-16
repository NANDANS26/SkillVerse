// src/controllers/jobs.controller.js
import { db } from "../config/db.js";
import { ok, fail } from "../utils/response.js";
import { callMLForMatches } from "../services/ml.service.js";

// -------- CREATE JOB --------
export const createJob = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const { title, raw_text, experience_min, experience_max, location } = req.body;

    if (!recruiterId) {
      return fail(res, "Unauthorized", 401);
    }

    if (!title || !raw_text) {
      return fail(res, "Title and job description are required", 400);
    }

    const [result] = await db.query(
      `INSERT INTO jobs 
       (recruiter_id, title, raw_text, parsed_json, experience_min, experience_max, location)
       VALUES (?, ?, ?, NULL, ?, ?, ?)`,
      [
        recruiterId,
        title,
        raw_text,
        experience_min ?? null,
        experience_max ?? null,
        location ?? null
      ]
    );

    return ok(
      res,
      {
        message: "Job created successfully",
        job_id: result.insertId
      },
      201
    );
  } catch (error) {
    console.error("Create Job Error:", error);
    return fail(res, "Failed to create job");
  }
};

// -------- GET JOB DETAILS --------
export const getJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    const [rows] = await db.query("SELECT * FROM jobs WHERE id = ?", [jobId]);

    if (!rows[0]) {
      return fail(res, "Job not found", 404);
    }

    return ok(res, { job: rows[0] });
  } catch (error) {
    console.error("Get Job Error:", error);
    return fail(res, "Failed to fetch job");
  }
};

// -------- GET AI MATCHES FOR JOB --------
export const getMatches = async (req, res) => {
  try {
    const jobId = req.params.id;

    const [rows] = await db.query("SELECT * FROM jobs WHERE id = ?", [jobId]);

    if (!rows[0]) {
      return fail(res, "Job not found", 404);
    }

    const job = rows[0];
    const matches = await callMLForMatches(job);

    return ok(res, { job_id: jobId, matches });
  } catch (error) {
    console.error("Get Matches Error:", error);
    return fail(res, "Failed to fetch matches");
  }
};

// -------- LIST JOBS FOR LOGGED-IN RECRUITER --------
export const listJobsForRecruiter = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    if (!recruiterId) {
      return fail(res, "Unauthorized", 401);
    }

    const [rows] = await db.query(
      `SELECT id, title, location, experience_min, experience_max, created_at
       FROM jobs
       WHERE recruiter_id = ?
       ORDER BY created_at DESC`,
      [recruiterId]
    );

    return ok(res, { jobs: rows });
  } catch (error) {
    console.error("List Jobs Error:", error);
    return fail(res, "Failed to fetch jobs");
  }
};
