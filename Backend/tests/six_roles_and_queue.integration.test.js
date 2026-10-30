// Backend/tests/six_roles_and_queue.integration.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db, pool } from '../src/config/db.js';
import { signup, login } from '../src/controllers/auth.controller.js';
import { createCandidate } from '../src/controllers/candidates.controller.js';
import { createJob, getMatches } from '../src/controllers/jobs.controller.js';
import {
  getMyInstitution,
  getInstitutionStudents,
  getInstitutionFaculty,
  assignFacultyToStudent,
  getInstitutionStats
} from '../src/controllers/institutions.controller.js';
import {
  getMyAssignedStudents,
  getAssignedStudentDetails,
  getFacultyStats
} from '../src/controllers/faculty.controller.js';
import {
  getMyCompany,
  getCompanyRecruiters,
  getCompanyJobs,
  getCompanyStats
} from '../src/controllers/companies.controller.js';
import {
  getPlatformOverview,
  getIndexingQueue,
  recoverIndexingQueue,
  getAuditLogs
} from '../src/controllers/admin.controller.js';
import {
  enqueueCandidateIndexing,
  processPendingQueue,
  getQueueStatus
} from '../src/services/indexing_queue.service.js';

function createMockReqRes(options = {}) {
  const req = {
    body: options.body || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    user: options.user || null,
    params: options.params || {},
    query: options.query || {}
  };

  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { value: val, options: opts };
      return this;
    },
    clearCookie(name, opts) {
      delete this.cookies[name];
      return this;
    }
  };

  return { req, res };
}

describe('SkillVerse Phase 6: Six Roles, Durable Outbox Queue & Operational Delivery Suite', () => {
  const timestamp = Date.now();
  let studentUser;
  let studentBUser;
  let facultyUser;
  let collegeAdminUser;
  let recruiterUser;
  let companyAdminUser;
  let superAdminUser;

  let institutionId;
  let companyId;
  let createdCandidateId;

  before(async () => {
    // 1. Fetch or create verified canonical users
    const { rows: studentRows } = await db.query('SELECT * FROM users WHERE email = $1', ['student@skillverse.test']);
    studentUser = studentRows[0];

    const { rows: facultyRows } = await db.query('SELECT * FROM users WHERE email = $1', ['faculty@skillverse.test']);
    facultyUser = facultyRows[0];

    const { rows: collegeRows } = await db.query('SELECT * FROM users WHERE email = $1', ['college@skillverse.test']);
    collegeAdminUser = collegeRows[0];

    const { rows: recruiterRows } = await db.query('SELECT * FROM users WHERE email = $1', ['recruiter@skillverse.test']);
    recruiterUser = recruiterRows[0];

    const { rows: companyRows } = await db.query('SELECT * FROM users WHERE email = $1', ['company@skillverse.test']);
    companyAdminUser = companyRows[0];

    const { rows: adminRows } = await db.query('SELECT * FROM users WHERE email = $1', ['admin@skillverse.test']);
    superAdminUser = adminRows[0];

    // Create an unassigned student for access control testing
    const emailB = `unassigned_student_${timestamp}@skillverse.test`;
    const { req: sReq, res: sRes } = createMockReqRes({
      body: { name: 'Unassigned Student', email: emailB, password: 'Password123!', role: 'student' }
    });
    await signup(sReq, sRes);
    studentBUser = sRes.body.user;

    // Fetch seeded institution & company IDs
    const { rows: inst } = await db.query('SELECT id FROM institutions WHERE name = $1', ['Apex Institute of Technology']);
    institutionId = inst[0]?.id;

    const { rows: comp } = await db.query('SELECT id FROM companies WHERE name = $1', ['Nexus Innovations']);
    companyId = comp[0]?.id;
  });

  describe('1. Dynamic Indexing Outbox Queue & Offline Recovery', () => {
    it('creates profile and records completed indexing queue entry when ML service is online', async () => {
      const email = `queue_student_${timestamp}@skillverse.test`;
      const { req: sReq, res: sRes } = createMockReqRes({
        body: { name: 'Queue Student Test', email, password: 'Password123!', role: 'student' }
      });
      await signup(sReq, sRes);
      const user = sRes.body.user;

      const { req, res } = createMockReqRes({
        user,
        body: {
          full_name: 'Queue Student Test',
          headline: 'Real-Time Streaming Systems Engineer',
          email,
          experience_years: 3.0,
          resume_text: 'Apache Kafka, Flink, and PostgreSQL streaming architectures.',
          skill_json: ['Kafka', 'Flink', 'PostgreSQL', 'Java']
        }
      });

      await createCandidate(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.indexing_status, 'indexed');
      createdCandidateId = res.body.candidate_id;

      // Verify PostgreSQL indexing_queue table recorded completion
      const { rows } = await db.query(
        'SELECT status, attempts FROM indexing_queue WHERE candidate_id = $1 ORDER BY id DESC LIMIT 1',
        [createdCandidateId]
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].status, 'completed');
    });

    it('records pending indexing queue entry without failing profile save when ML service is offline', async () => {
      const originalUrl = process.env.ML_SERVICE_URL;
      process.env.ML_SERVICE_URL = 'http://127.0.0.1:59999'; // Dead port

      try {
        const offlineEmail = `offline_queue_${timestamp}@skillverse.test`;
        const { req: sReq, res: sRes } = createMockReqRes({
          body: { name: 'Offline Queue Student', email: offlineEmail, password: 'Password123!', role: 'student' }
        });
        await signup(sReq, sRes);
        const user = sRes.body.user;

        const { req, res } = createMockReqRes({
          user,
          body: {
            full_name: 'Offline Queue Student',
            headline: 'Resilient Queue Test Candidate',
            email: offlineEmail,
            experience_years: 4.0,
            skill_json: ['Go', 'PostgreSQL', 'Distributed Systems']
          }
        });

        await createCandidate(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.indexing_status, 'pending');

        const offlineCid = res.body.candidate_id;

        // Verify outbox queue recorded pending state
        const { rows } = await db.query(
          'SELECT status, last_error FROM indexing_queue WHERE candidate_id = $1 ORDER BY id DESC LIMIT 1',
          [offlineCid]
        );
        assert.equal(rows.length, 1);
        assert.equal(rows[0].status, 'pending');
        assert.match(rows[0].last_error, /connect ECONNREFUSED/);

        // Restore ML service URL
        process.env.ML_SERVICE_URL = originalUrl || 'http://127.0.0.1:8000';

        // Execute recovery worker
        const recoveryResult = await processPendingQueue(10);
        assert.ok(recoveryResult.succeeded >= 1);

        // Verify queue item transitioned to completed after recovery
        const { rows: afterRows } = await db.query(
          'SELECT status FROM indexing_queue WHERE candidate_id = $1 ORDER BY id DESC LIMIT 1',
          [offlineCid]
        );
        assert.equal(afterRows[0].status, 'completed');
      } finally {
        process.env.ML_SERVICE_URL = originalUrl || 'http://127.0.0.1:8000';
      }
    });

    it('returns truthful queue status metrics via getQueueStatus', async () => {
      const status = await getQueueStatus();
      assert.ok(typeof status.total === 'number');
      assert.ok(typeof status.completed === 'number');
      assert.ok(status.total >= status.completed);
    });
  });

  describe('2. Faculty Role & Mentorship Boundary Enforcement', () => {
    it('retrieves assigned students for authenticated faculty member', async () => {
      const { req, res } = createMockReqRes({ user: facultyUser });
      await getMyAssignedStudents(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.students));
      assert.ok(res.body.students.length > 0);
      assert.equal(res.body.students[0].name, 'Alice Student');
    });

    it('allows faculty to inspect details of an assigned student', async () => {
      const { req, res } = createMockReqRes({
        user: facultyUser,
        params: { id: studentUser.id }
      });
      await getAssignedStudentDetails(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.student.name, 'Alice Student');
      assert.ok(Array.isArray(res.body.student.skills));
      assert.equal(res.body.student.mentorship.status, 'active');
    });

    it('strictly denies faculty access to an unassigned student (403 Forbidden)', async () => {
      const { req, res } = createMockReqRes({
        user: facultyUser,
        params: { id: studentBUser.id } // Unassigned student
      });
      await getAssignedStudentDetails(req, res);
      assert.equal(res.statusCode, 403);
      assert.match(res.body.message, /Access denied: Student is not assigned/);
    });

    it('returns faculty mentee count via getFacultyStats', async () => {
      const { req, res } = createMockReqRes({ user: facultyUser });
      await getFacultyStats(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(res.body.assigned_students_count >= 1);
    });
  });

  describe('3. College Administrator Role & Institutional Scoping', () => {
    it('retrieves institution metrics derived from PostgreSQL', async () => {
      const { req, res } = createMockReqRes({ user: collegeAdminUser });
      await getInstitutionStats(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.institution_name, 'Apex Institute of Technology');
      assert.ok(res.body.total_students >= 1);
      assert.ok(res.body.total_faculty >= 1);
    });

    it('retrieves enrolled students belonging to the authorized institution', async () => {
      const { req, res } = createMockReqRes({ user: collegeAdminUser });
      await getInstitutionStudents(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.students));
      assert.ok(res.body.students.some(s => s.name === 'Alice Student'));
    });

    it('retrieves faculty associated with the authorized institution', async () => {
      const { req, res } = createMockReqRes({ user: collegeAdminUser });
      await getInstitutionFaculty(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.faculty));
      assert.ok(res.body.faculty.some(f => f.name === 'Dr. Smith Faculty'));
    });

    it('permits college administrator to assign faculty mentorship within institution', async () => {
      // First enroll studentB into the institution
      await db.query(
        `INSERT INTO institution_memberships (institution_id, user_id, role)
         VALUES ($1, $2, 'student')
         ON CONFLICT (institution_id, user_id) DO NOTHING`,
        [institutionId, studentBUser.id]
      );

      const { req, res } = createMockReqRes({
        user: collegeAdminUser,
        body: {
          faculty_id: facultyUser.id,
          student_id: studentBUser.id,
          notes: 'Assigned for Cloud Systems Specialization'
        }
      });

      await assignFacultyToStudent(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.assignment.faculty_id, facultyUser.id);
      assert.equal(res.body.assignment.student_id, studentBUser.id);
    });
  });

  describe('4. Company Administrator Role & Recruiter Scoping', () => {
    it('retrieves company metrics derived from PostgreSQL', async () => {
      const { req, res } = createMockReqRes({ user: companyAdminUser });
      await getCompanyStats(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.company_name, 'Nexus Innovations');
      assert.ok(res.body.total_recruiters >= 1);
    });

    it('retrieves recruiting team members within the authorized company', async () => {
      const { req, res } = createMockReqRes({ user: companyAdminUser });
      await getCompanyRecruiters(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.recruiters));
      assert.ok(res.body.recruiters.some(r => r.name === 'Bob Recruiter'));
    });

    it('retrieves job requisitions scoped to the company', async () => {
      const { req, res } = createMockReqRes({ user: companyAdminUser });
      await getCompanyJobs(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.jobs));
      assert.ok(res.body.jobs.length >= 1);
      assert.equal(res.body.jobs[0].company_id, companyId);
    });
  });

  describe('5. Super Administrator Operational Overview & Governance', () => {
    it('retrieves comprehensive platform telemetry derived from authoritative state', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await getPlatformOverview(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.database_status, 'connected (PostgreSQL 18)');
      assert.ok(res.body.counts.candidates >= 1);
      assert.ok(res.body.counts.jobs >= 1);
      assert.ok(res.body.counts.institutions >= 1);
      assert.ok(res.body.counts.companies >= 1);
      assert.ok(res.body.users.total >= 6);
      assert.ok(typeof res.body.indexing_queue.completed === 'number');
    });

    it('retrieves recent indexing queue entries via getIndexingQueue', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser, query: { limit: '10' } });
      await getIndexingQueue(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.queue));
      assert.ok(res.body.queue.length > 0);
    });

    it('executes manual queue recovery via recoverIndexingQueue and writes audit log', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await recoverIndexingQueue(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);

      // Verify audit log
      const { req: aReq, res: aRes } = createMockReqRes({ user: superAdminUser, query: { limit: '5' } });
      await getAuditLogs(aReq, aRes);
      assert.equal(aRes.statusCode, 200);
      assert.ok(Array.isArray(aRes.body.audit_logs));
      assert.ok(aRes.body.audit_logs.some(l => l.action === 'RECOVER_INDEXING_QUEUE'));
    });
  });

  after(async () => {
    await pool.end();
  });
});
