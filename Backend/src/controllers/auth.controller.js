// src/controllers/auth.controller.js
import { db } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ok, fail } from "../utils/response.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

/**
 * POST /api/auth/signup
 * Body: { name, email, password, role }
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
      return fail(res, "All fields are required", 400);
    }

    // Check if user already exists
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return fail(res, "Email already registered", 400);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert into DB
    const [result] = await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, password_hash, role]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role
    };

    // Generate JWT
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1d" });

    // Response shape expected by frontend
    return ok(res, { user, token }, 201);
  } catch (err) {
    console.error("Signup error:", err);
    return fail(res, "Signup failed");
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const [rows] = await db.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return fail(res, "Invalid credentials", 401);
    }

    const userRow = rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!isMatch) {
      return fail(res, "Invalid credentials", 401);
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role
    };

    // Generate JWT
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1d" });

    // Response shape expected by frontend
    return ok(res, { user, token });
  } catch (err) {
    console.error("Login error:", err);
    return fail(res, "Login failed");
  }
};
