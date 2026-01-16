// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/auth.routes.js";
import jobsRoutes from "./src/routes/jobs.routes.js";
import candidatesRoutes from "./src/routes/candidates.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.json({ success: true, message: "SkillVerse Backend API running" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/candidates", candidatesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
