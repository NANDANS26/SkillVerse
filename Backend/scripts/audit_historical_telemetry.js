// Backend/scripts/audit_historical_telemetry.js
import { db } from '../src/config/db.js';

async function auditHistoricalTelemetry() {
  console.log('================================================================');
  console.log(' SKILLVERSE PHASE 16: HISTORICAL TELEMETRY AUDIT & RECONCILIATION');
  console.log('================================================================\n');

  // 1. Overview counts by provenance tag
  const { rows: impProv } = await db.query(
    'SELECT provenance_tag, count(*)::int as count, count(distinct candidate_id)::int as distinct_candidates FROM recommendation_impressions GROUP BY provenance_tag ORDER BY count DESC'
  );
  console.log('--- 1. Recommendation Impressions by Provenance Tag ---');
  console.table(impProv);

  const { rows: rxProv } = await db.query(
    'SELECT provenance_tag, event_type, count(*)::int as count, count(distinct candidate_id)::int as distinct_candidates FROM recommendation_interactions GROUP BY provenance_tag, event_type ORDER BY provenance_tag, event_type'
  );
  console.log('\n--- 2. Recommendation Interactions by Provenance & Event Type ---');
  console.table(rxProv);

  const { rows: fbProv } = await db.query(
    'SELECT provenance_tag, count(*)::int as count, count(distinct candidate_id)::int as distinct_candidates FROM recommendation_feedback GROUP BY provenance_tag ORDER BY count DESC'
  );
  console.log('\n--- 3. Recommendation Feedback by Provenance Tag ---');
  console.table(fbProv);

  // 2. Candidate 666 and queue 737 verification
  console.log('\n--- 4. Candidate 666 & Queue 737 Invariant Audit ---');
  const { rows: c666 } = await db.query(
    'SELECT c.id, c.user_id, c.full_name, c.email, u.email as user_email, u.role FROM candidates c JOIN users u ON c.user_id = u.id WHERE c.id = 666'
  );
  console.log('Candidate 666 record:', c666[0] || 'NOT FOUND');

  const { rows: q737 } = await db.query(
    'SELECT * FROM indexing_queue WHERE id = 737 OR candidate_id = 666'
  );
  console.log('Queue entries for Candidate 666:', q737);

  // Check for orphan candidates
  const { rows: orphanCheck } = await db.query(
    'SELECT c.id FROM candidates c LEFT JOIN indexing_queue q ON c.id = q.candidate_id WHERE q.id IS NULL'
  );
  console.log(`Orphan candidates count (should be 0): ${orphanCheck.length}`);

  // 3. Detailed inspection of 'unknown' records
  console.log('\n--- 5. Forensic Inspection of "unknown" Telemetry Records ---');
  const { rows: unknownRecords } = await db.query(`
    SELECT DISTINCT
      c.id as candidate_id,
      u.email,
      u.name,
      u.role,
      (SELECT count(*) FROM recommendation_impressions ri WHERE ri.candidate_id = c.id AND ri.provenance_tag = 'unknown')::int as unknown_impressions,
      (SELECT count(*) FROM recommendation_interactions rx WHERE rx.candidate_id = c.id AND rx.provenance_tag = 'unknown')::int as unknown_interactions,
      (SELECT count(*) FROM recommendation_feedback rf WHERE rf.candidate_id = c.id AND rf.provenance_tag = 'unknown')::int as unknown_feedback,
      (SELECT min(presented_at) FROM recommendation_impressions ri WHERE ri.candidate_id = c.id) as first_telemetry_at
    FROM candidates c
    JOIN users u ON c.user_id = u.id
    WHERE c.id IN (
      SELECT candidate_id FROM recommendation_impressions WHERE provenance_tag = 'unknown'
      UNION
      SELECT candidate_id FROM recommendation_interactions WHERE provenance_tag = 'unknown'
      UNION
      SELECT candidate_id FROM recommendation_feedback WHERE provenance_tag = 'unknown'
    )
    ORDER BY c.id ASC
  `);
  console.table(unknownRecords);

  // 4. Inspection of 'pilot_candidate_' created in Phase 15.2 test
  console.log('\n--- 6. Inspection of "pilot_candidate_" Test Account ---');
  const { rows: pilotCandCheck } = await db.query(`
    SELECT c.id, u.email, u.name,
      (SELECT count(*) FROM recommendation_impressions ri WHERE ri.candidate_id = c.id)::int as imp_count,
      (SELECT count(*) FROM recommendation_feedback rf WHERE rf.candidate_id = c.id)::int as fb_count
    FROM candidates c
    JOIN users u ON c.user_id = u.id
    WHERE u.email LIKE '%pilot_candidate_%'
  `);
  console.table(pilotCandCheck);

  // 5. Total candidate populations
  console.log('\n--- 7. Candidate Population Summary ---');
  const { rows: candCounts } = await db.query(`
    SELECT
      (SELECT count(*) FROM candidates)::int as total_candidates,
      (SELECT count(distinct candidate_id) FROM recommendation_impressions)::int as candidates_with_impressions,
      (SELECT count(distinct candidate_id) FROM recommendation_interactions)::int as candidates_with_interactions,
      (SELECT count(distinct candidate_id) FROM recommendation_feedback)::int as candidates_with_feedback
  `);
  console.table(candCounts);

  process.exit(0);
}

auditHistoricalTelemetry().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
