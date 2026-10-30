// Backend/src/db/sync_index.js
import { db, closePool } from '../config/db.js';
import { callMLToReindexAll } from '../services/ml.service.js';

export async function syncIndex() {
  console.log('[Sync Index] Connecting to PostgreSQL to fetch candidates...');
  try {
    const result = await db.query(
      `SELECT id, user_id, full_name, headline, email, phone, experience_years, resume_text, skill_json 
       FROM candidates 
       ORDER BY id ASC`
    );

    const candidates = result.rows;
    console.log(`[Sync Index] Found ${candidates.length} candidate(s) in PostgreSQL.`);

    if (candidates.length === 0) {
      console.log('[Sync Index] No candidates found in database to index.');
      return { total_indexed: 0 };
    }

    const formatted = candidates.map((c) => ({
      candidate_id: c.id,
      id: c.id,
      full_name: c.full_name,
      headline: c.headline,
      email: c.email,
      phone: c.phone,
      experience_years: Number(c.experience_years || 0),
      resume_text: c.resume_text || '',
      skill_json: c.skill_json
    }));

    console.log(`[Sync Index] Submitting ${formatted.length} candidate(s) to FastAPI live index...`);
    const mlResponse = await callMLToReindexAll(formatted);
    console.log('[Sync Index] Dynamic index rebuilt successfully:', mlResponse);
    return mlResponse;
  } catch (err) {
    console.error('[Sync Index Error]:', err.message);
    throw err;
  }
}

// Run directly if called as a script
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('sync_index.js')) {
  syncIndex()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Sync Index Fatal Error]:', err);
      await closePool();
      process.exit(1);
    });
}
