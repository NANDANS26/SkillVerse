// Backend/src/db/seed.js
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const { Client } = pg;

export async function runSeed(customConfig = null) {
  const config = customConfig || (env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL, ssl: env.PGSSL ? { rejectUnauthorized: false } : false }
    : {
        host: env.PGHOST,
        port: env.PGPORT,
        user: env.PGUSER,
        password: env.PGPASSWORD,
        database: env.PGDATABASE,
        ssl: env.PGSSL ? { rejectUnauthorized: false } : false
      });

  const targetDb = config.database || config.connectionString || `${env.PGHOST}:${env.PGPORT}/${env.PGDATABASE}`;
  console.log(`[Seed] Connecting to PostgreSQL at ${targetDb}...`);

  const client = new Client(config);
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash('TestPass123!', 10);

    const testUsers = [
      { name: 'Alice Student', email: 'student@skillverse.test', role: 'student' },
      { name: 'Bob Recruiter', email: 'recruiter@skillverse.test', role: 'recruiter' },
      { name: 'Admin User', email: 'admin@skillverse.test', role: 'super_admin' },
      { name: 'Dr. Smith Faculty', email: 'faculty@skillverse.test', role: 'faculty' },
      { name: 'Dean Johnson', email: 'college@skillverse.test', role: 'college_admin' },
      { name: 'Enterprise Lead', email: 'company@skillverse.test', role: 'company_admin' }
    ];

    console.log('[Seed] Seeding canonical users...');
    for (const u of testUsers) {
      await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
        [u.name, u.email, passwordHash, u.role]
      );
    }

    // Get student and recruiter IDs
    const { rows: studentRows } = await client.query('SELECT id FROM users WHERE email = $1', ['student@skillverse.test']);
    const studentId = studentRows[0]?.id;

    const { rows: recruiterRows } = await client.query('SELECT id FROM users WHERE email = $1', ['recruiter@skillverse.test']);
    const recruiterId = recruiterRows[0]?.id;

    if (studentId) {
      console.log('[Seed] Seeding sample student candidate profile...');
      await client.query(
        `INSERT INTO candidates (user_id, full_name, headline, email, phone, experience_years, resume_text, skill_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET headline = EXCLUDED.headline, experience_years = EXCLUDED.experience_years`,
        [
          studentId,
          'Alice Student',
          'Full-Stack Developer & AI Enthusiast',
          'student@skillverse.test',
          '+1-555-0199',
          2.5,
          'Experienced with React, Node.js, Python, FastAPI, TypeScript, and SQL database design.',
          JSON.stringify(['React', 'Node.js', 'Python', 'FastAPI', 'TypeScript', 'SQL'])
        ]
      );
    }

    if (recruiterId) {
      console.log('[Seed] Seeding sample recruiter job...');
      const { rows: existingJobs } = await client.query('SELECT id FROM jobs WHERE recruiter_id = $1 LIMIT 1', [recruiterId]);
      let jobId = existingJobs[0]?.id;

      if (!jobId) {
        const { rows: jobResult } = await client.query(
          `INSERT INTO jobs
           (recruiter_id, title, location, raw_text, parsed_json, experience_min, experience_max, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
           RETURNING id`,
          [
            recruiterId,
            'Senior Full-Stack Engineer',
            'San Francisco, CA (Hybrid)',
            'We are seeking a Senior Full-Stack Engineer experienced in React, TypeScript, Node.js, and Python ML pipelines.',
            JSON.stringify({ skills: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL'] }),
            2.0,
            6.0
          ]
        );
        jobId = jobResult[0]?.id;
      }

      const { rows: candidateRows } = await client.query('SELECT id FROM candidates WHERE user_id = $1', [studentId]);
      const candidateId = candidateRows[0]?.id;

      if (jobId && candidateId) {
        console.log('[Seed] Seeding sample application...');
        await client.query(
          `INSERT INTO applications (job_id, candidate_id, status, match_score)
           VALUES ($1, $2, 'applied', 0.9500)
           ON CONFLICT (job_id, candidate_id) DO UPDATE SET match_score = EXCLUDED.match_score`,
          [jobId, candidateId]
        );

        // Seed indexing queue item for candidate
        await client.query(
          `INSERT INTO indexing_queue (candidate_id, status, attempts, created_at)
           VALUES ($1, 'completed', 1, CURRENT_TIMESTAMP)
           ON CONFLICT DO NOTHING`,
          [candidateId]
        );
      }
    }

    // Seed Institution and Memberships
    console.log('[Seed] Seeding sample institution and memberships...');
    const { rows: instRows } = await client.query(
      `INSERT INTO institutions (name, code, domain)
       VALUES ('Apex Institute of Technology', 'AIT', 'apex.edu')
       ON CONFLICT (name) DO UPDATE SET domain = EXCLUDED.domain
       RETURNING id`
    );
    const institutionId = instRows[0]?.id;

    const { rows: facultyRows } = await client.query('SELECT id FROM users WHERE email = $1', ['faculty@skillverse.test']);
    const facultyId = facultyRows[0]?.id;

    const { rows: collegeAdminRows } = await client.query('SELECT id FROM users WHERE email = $1', ['college@skillverse.test']);
    const collegeAdminId = collegeAdminRows[0]?.id;

    if (institutionId) {
      if (collegeAdminId) {
        await client.query(
          `INSERT INTO institution_memberships (institution_id, user_id, role)
           VALUES ($1, $2, 'college_admin')
           ON CONFLICT (institution_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
          [institutionId, collegeAdminId]
        );
      }
      if (facultyId) {
        await client.query(
          `INSERT INTO institution_memberships (institution_id, user_id, role)
           VALUES ($1, $2, 'faculty')
           ON CONFLICT (institution_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
          [institutionId, facultyId]
        );
      }
      if (studentId) {
        await client.query(
          `INSERT INTO institution_memberships (institution_id, user_id, role)
           VALUES ($1, $2, 'student')
           ON CONFLICT (institution_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
          [institutionId, studentId]
        );
      }

      // Seed faculty-student mentorship assignment
      if (facultyId && studentId) {
        await client.query(
          `INSERT INTO faculty_student_assignments (institution_id, faculty_id, student_id, status, notes)
           VALUES ($1, $2, $3, 'active', 'Primary mentor for Distributed Systems & AI project')
           ON CONFLICT (faculty_id, student_id) DO UPDATE SET notes = EXCLUDED.notes`,
          [institutionId, facultyId, studentId]
        );
      }
    }

    // Seed Company and Memberships
    console.log('[Seed] Seeding sample company and memberships...');
    const { rows: compRows } = await client.query(
      `INSERT INTO companies (name, domain, industry)
       VALUES ('Nexus Innovations', 'nexus.tech', 'Enterprise Software & Cloud AI')
       ON CONFLICT (name) DO UPDATE SET industry = EXCLUDED.industry
       RETURNING id`
    );
    const companyId = compRows[0]?.id;

    const { rows: compAdminRows } = await client.query('SELECT id FROM users WHERE email = $1', ['company@skillverse.test']);
    const compAdminId = compAdminRows[0]?.id;

    if (companyId) {
      if (compAdminId) {
        await client.query(
          `INSERT INTO company_memberships (company_id, user_id, role)
           VALUES ($1, $2, 'company_admin')
           ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
          [companyId, compAdminId]
        );
      }
      if (recruiterId) {
        await client.query(
          `INSERT INTO company_memberships (company_id, user_id, role)
           VALUES ($1, $2, 'recruiter')
           ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
          [companyId, recruiterId]
        );

        // Associate recruiter's jobs with company
        await client.query('UPDATE jobs SET company_id = $1 WHERE recruiter_id = $2', [companyId, recruiterId]);
      }
    }

    // Seed Initial Audit Log
    const { rows: adminRows } = await client.query('SELECT id FROM users WHERE email = $1', ['admin@skillverse.test']);
    const adminId = adminRows[0]?.id;
    if (adminId) {
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, details)
         VALUES ($1, 'SYSTEM_INITIALIZATION', 'platform', $2)`,
        [adminId, JSON.stringify({ phase: 'Phase 6 Complete MVP Operationalization', status: 'initialized' })]
      );
    }

    console.log('[Seed] Database seeding completed successfully.');
  } finally {
    await client.end();
  }
}

// Allow CLI execution via `node seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
