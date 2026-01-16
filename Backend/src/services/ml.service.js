// src/services/ml.service.js
import axios from "axios";

const ML_BASE_URL = process.env.ML_BASE_URL || "http://localhost:8000";

export const callMLForMatches = async (job) => {
  try {
    // You can adjust this payload to match your FastAPI
    const res = await axios.post(`${ML_BASE_URL}/match`, {
      job_id: job.id,
      title: job.title,
      raw_text: job.raw_text,
      experience_min: job.experience_min,
      experience_max: job.experience_max
    });

    // Expecting: { matches: [...] }
    return res.data.matches || [];
  } catch (err) {
    console.error("ML Service Error:", err.message);
    return [];
  }
};
