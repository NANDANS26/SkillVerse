// Backend/src/services/ml.service.js
import axios from 'axios';
import { env } from '../config/env.js';

export const callMLForMatches = async (job, topK = 10, mode = 'live') => {
  const baseUrl = process.env.ML_SERVICE_URL || env.ML_SERVICE_URL;
  const mlUrl = `${baseUrl}/api/v1/match`;

  let requiredSkills = [];
  if (Array.isArray(job.required_skills)) {
    requiredSkills = job.required_skills;
  } else if (typeof job.required_skills === 'string') {
    try {
      requiredSkills = JSON.parse(job.required_skills);
    } catch {
      requiredSkills = job.required_skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  } else if (job.parsed_json) {
    try {
      const parsed = typeof job.parsed_json === 'string' ? JSON.parse(job.parsed_json) : job.parsed_json;
      if (Array.isArray(parsed?.skills)) {
        requiredSkills = parsed.skills;
      }
    } catch {}
  }

  const payload = {
    job: {
      id: job.id,
      title: job.title || 'Role',
      required_skills: requiredSkills,
      experience_min: Number(job.experience_min ?? 0),
      experience_max: Number(job.experience_max ?? 10),
      exp_min: Number(job.experience_min ?? 0),
      exp_max: Number(job.experience_max ?? 10),
      raw_text: job.raw_text || job.description || ''
    },
    top_k: topK,
    mode: mode
  };

  try {
    const response = await axios.post(mlUrl, payload, { timeout: 20000 });
    const matches = response.data?.matches || response.data?.results || [];
    return matches;
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
    console.error(`[ML Service Error] Request to ${mlUrl} failed:`, errorMsg);
    throw new Error(`AI Matching Service Error: ${errorMsg}`);
  }
};

const getHeaders = () => ({
  'X-Service-Token': process.env.ML_SERVICE_SECRET || env.ML_SERVICE_SECRET || 'skillverse-internal-service-secret-local-dev'
});

/**
 * Dynamically indexes a candidate profile in the live vector index.
 */
export const callMLToEmbedCandidate = async (candidate) => {
  const baseUrl = process.env.ML_SERVICE_URL || env.ML_SERVICE_URL;
  const url = `${baseUrl}/api/v1/embed_candidate`;

  const payload = {
    candidate_id: candidate.id || candidate.candidate_id,
    full_name: candidate.full_name || candidate.name || '',
    headline: candidate.headline || '',
    email: candidate.email || '',
    experience_years: Number(candidate.experience_years ?? 0),
    resume_text: candidate.resume_text || '',
    skill_json: candidate.skill_json || candidate.skills || []
  };

  try {
    const response = await axios.post(url, payload, { headers: getHeaders(), timeout: 20000 });
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
    console.error(`[ML Embed Error] Request to ${url} failed:`, errorMsg);
    throw new Error(`AI Embedding Service Error: ${errorMsg}`);
  }
};

/**
 * Rebuilds the live vector index from a batch of candidate records.
 */
export const callMLToReindexAll = async (candidates) => {
  const baseUrl = process.env.ML_SERVICE_URL || env.ML_SERVICE_URL;
  const url = `${baseUrl}/api/v1/reindex_all`;

  try {
    const response = await axios.post(url, { candidates }, { headers: getHeaders(), timeout: 30000 });
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
    console.error(`[ML Reindex Error] Request to ${url} failed:`, errorMsg);
    throw new Error(`AI Reindex Service Error: ${errorMsg}`);
  }
};

/**
 * Removes a candidate vector from the live index.
 */
export const callMLToRemoveCandidate = async (candidateId) => {
  const baseUrl = process.env.ML_SERVICE_URL || env.ML_SERVICE_URL;
  const url = `${baseUrl}/api/v1/candidate/${candidateId}`;

  try {
    const response = await axios.delete(url, { headers: getHeaders(), timeout: 10000 });
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
    console.error(`[ML Remove Error] Request to ${url} failed:`, errorMsg);
    throw new Error(`AI Remove Service Error: ${errorMsg}`);
  }
};

/**
 * Retrieves indexing and vector count status from FastAPI.
 */
export const getMLIndexStatus = async () => {
  const baseUrl = process.env.ML_SERVICE_URL || env.ML_SERVICE_URL;
  const url = `${baseUrl}/api/v1/index_status`;

  try {
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
    console.error(`[ML Status Error] Request to ${url} failed:`, errorMsg);
    throw new Error(`AI Status Error: ${errorMsg}`);
  }
};

/**
 * Calls FastAPI to generate evidence-aware semantic activity recommendations
 */
export const callMLToRecommendActivities = async ({ studentContext, candidateActivities, topK = 5 }) => {
  const baseUrl = process.env.ML_SERVICE_URL || env.ML_SERVICE_URL;
  const url = `${baseUrl}/api/v1/recommend_activities`;

  const payload = {
    student_context: studentContext,
    candidate_activities: candidateActivities,
    top_k: topK
  };

  try {
    const response = await axios.post(url, payload, { headers: getHeaders(), timeout: 25000 });
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
    console.error(`[ML Recommend Error] Request to ${url} failed:`, errorMsg);
    throw new Error(`AI Recommendation Service Error: ${errorMsg}`);
  }
};
