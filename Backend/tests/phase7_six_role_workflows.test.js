// Backend/tests/phase7_six_role_workflows.test.js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/config/db.js';
import { signup } from '../src/controllers/auth.controller.js';
import { createCandidate, getMyCandidateProfile, getMyApplications } from '../src/controllers/candidates.controller.js';
import { createJob, listJobs, applyToJob, getJobApplications, updateApplicationStatus } from '../src/controllers/jobs.controller.js';
import { assignFacultyToStudent, getInstitutionAssignments, unassignFacultyFromStudent } from '../src/controllers/institutions.controller.js';
import { getMyAssignedStudents, getAssignedStudentDetails, updateMentorshipNotes } from '../src/controllers/faculty.controller.js';
import { addCompanyRecruiter, getCompanyRecruiters, removeCompanyRecruiter, getCompanyJobs } from '../src/controllers/companies.controller.js';
import { getAdminUsers, getAdminTenants, getPlatformOverview } from '../src/controllers/admin.controller.js';

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

describe('SkillVerse Phase 7: Six-Role Product Workflows & Persistence Integration Suite', () => {
  const timestamp = Date.now();
  let studentUser;
  let recruiterUser;
  let unauthorizedRecruiter;
  let collegeAdminUser;
  let facultyUser;
  let unassignedFacultyUser;
  let companyAdminUser;
  let superAdminUser;

  let institutionId;
  let companyId;
  let createdJobId;
  let studentCandidateId;
  let createdApplicationId;
  let createdAssignmentId;

  before(async () => {
    // 1. Create Student User
    const { req: sReq, res: sRes } = createMockReqRes({
      body: {
        name: `Student P7 ${timestamp}`,
        email: `student_p7_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'student'
      }
    });
    await signup(sReq, sRes);
    studentUser = sRes.body.user;

    // 2. Create Recruiter User
    const { req: rReq, res: rRes } = createMockReqRes({
      body: {
        name: `Recruiter P7 ${timestamp}`,
        email: `recruiter_p7_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'recruiter'
      }
    });
    await signup(rReq, rRes);
    recruiterUser = rRes.body.user;

    // 3. Create Second Recruiter (for unauthorized boundary checks)
    const { req: urReq, res: urRes } = createMockReqRes({
      body: {
        name: `Other Recruiter P7 ${timestamp}`,
        email: `other_recruiter_p7_${timestamp}@skillverse.test`,
        password: 'Password123!',
        role: 'recruiter'
      }
    });
    await signup(urReq, urRes);
    unauthorizedRecruiter = urRes.body.user;

    // 4. Create College Admin, Faculty, and Super Admin in DB
    const { rows: caRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'college_admin') RETURNING id, name, email, role`,
      [`College Admin P7 ${timestamp}`, `college_admin_p7_${timestamp}@skillverse.test`]
    );
    collegeAdminUser = caRows[0];

    const { rows: facRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'faculty') RETURNING id, name, email, role`,
      [`Faculty P7 ${timestamp}`, `faculty_p7_${timestamp}@skillverse.test`]
    );
    facultyUser = facRows[0];

    const { rows: unassignedFacRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'faculty') RETURNING id, name, email, role`,
      [`Unassigned Faculty P7 ${timestamp}`, `unassigned_fac_p7_${timestamp}@skillverse.test`]
    );
    unassignedFacultyUser = unassignedFacRows[0];

    const { rows: compAdminRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'company_admin') RETURNING id, name, email, role`,
      [`Company Admin P7 ${timestamp}`, `company_admin_p7_${timestamp}@skillverse.test`]
    );
    companyAdminUser = compAdminRows[0];

    const { rows: saRows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, 'hash', 'super_admin') RETURNING id, name, email, role`,
      [`Super Admin P7 ${timestamp}`, `super_admin_p7_${timestamp}@skillverse.test`]
    );
    superAdminUser = saRows[0];

    // 5. Seed Institution & Memberships
    const { rows: instRows } = await db.query(
      `INSERT INTO institutions (name, code)
       VALUES ($1, $2) RETURNING id`,
      [`University of Science & Tech ${timestamp}`, `UST_${timestamp}`]
    );
    institutionId = instRows[0].id;

    await db.query(
      `INSERT INTO institution_memberships (institution_id, user_id, role)
       VALUES ($1, $2, 'college_admin'), ($1, $3, 'faculty'), ($1, $4, 'student')`,
      [institutionId, collegeAdminUser.id, facultyUser.id, studentUser.id]
    );

    // 6. Seed Company & Memberships
    const { rows: compRows } = await db.query(
      `INSERT INTO companies (name, industry)
       VALUES ($1, 'Software Engineering') RETURNING id`,
      [`Nexus Cybernetics ${timestamp}`]
    );
    companyId = compRows[0].id;

    await db.query(
      `INSERT INTO company_memberships (company_id, user_id, role)
       VALUES ($1, $2, 'company_admin'), ($1, $3, 'recruiter')`,
      [companyId, companyAdminUser.id, recruiterUser.id]
    );
  });

  describe('1. Student Profile & Authoritative Indexing Status', () => {
    it('returns candidate: null before profile is initialized', async () => {
      const { req, res } = createMockReqRes({ user: studentUser });
      await getMyCandidateProfile(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.candidate, null);
    });

    it('persists student profile and accurately reports indexing status and app count', async () => {
      const { req, res } = createMockReqRes({
        user: studentUser,
        body: {
          full_name: studentUser.name,
          email: studentUser.email,
          headline: 'Full-Stack Distributed Systems Developer',
          experience_years: 2.5,
          resume_text: 'Experienced in Node.js, React, PostgreSQL, and FAISS indexing.',
          skill_json: ['React', 'Node.js', 'PostgreSQL', 'TypeScript']
        }
      });
      await createCandidate(req, res);
      assert.equal(res.statusCode, 201);
      assert.ok(res.body.candidate_id);
      studentCandidateId = res.body.candidate_id;

      // Verify getMyCandidateProfile returns populated profile with indexing_status
      const { req: pReq, res: pRes } = createMockReqRes({ user: studentUser });
      await getMyCandidateProfile(pReq, pRes);
      assert.equal(pRes.statusCode, 200);
      assert.ok(pRes.body.candidate);
      assert.equal(pRes.body.candidate.id, studentCandidateId);
      assert.equal(pRes.body.candidate.full_name, studentUser.name);
      assert.equal(pRes.body.candidate.indexing_status, 'indexed');
      assert.equal(pRes.body.candidate.applications_count, 0);
    });
  });

  describe('2. Recruiter Job Posting & Candidate Application Flow', () => {
    it('recruiter creates and persists a company-scoped job', async () => {
      const { req, res } = createMockReqRes({
        user: recruiterUser,
        body: {
          title: `Full-Stack Architect ${timestamp}`,
          description: 'Looking for a skilled engineer with React and PostgreSQL experience.',
          required_skills: ['React', 'PostgreSQL', 'Node.js'],
          experience_min: 2,
          experience_max: 6,
          location: 'Remote'
        }
      });
      await createJob(req, res);
      assert.equal(res.statusCode, 201);
      createdJobId = res.body.job_id || res.body.job?.id;
      assert.ok(createdJobId);

      // Link job to company
      await db.query('UPDATE jobs SET company_id = $1 WHERE id = $2', [companyId, createdJobId]);
    });

    it('student views open jobs and submits a real application', async () => {
      const { req: lReq, res: lRes } = createMockReqRes({ user: studentUser });
      await listJobs(lReq, lRes);
      assert.equal(lRes.statusCode, 200);
      const targetJob = lRes.body.jobs.find(j => j.id === createdJobId);
      assert.ok(targetJob, 'Created job must be visible in open jobs');

      // Student applies to the job
      const { req: aReq, res: aRes } = createMockReqRes({
        user: studentUser,
        params: { id: createdJobId }
      });
      await applyToJob(aReq, aRes);
      assert.equal(aRes.statusCode, 201);
      assert.equal(aRes.body.success, true);
      assert.equal(aRes.body.application.job_id, createdJobId);
      assert.equal(aRes.body.application.candidate_id, studentCandidateId);
      assert.equal(aRes.body.application.status, 'applied');
      createdApplicationId = aRes.body.application.id;
    });

    it('student retrieves their submitted applications with job details', async () => {
      const { req, res } = createMockReqRes({ user: studentUser });
      await getMyApplications(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.count >= 1);
      const app = res.body.applications.find(a => a.job_id === createdJobId);
      assert.ok(app);
      assert.equal(app.job_title, `Full-Stack Architect ${timestamp}`);
      assert.equal(app.status, 'applied');

      // Verify getMyCandidateProfile now reflects applications_count: 1
      const { req: pReq, res: pRes } = createMockReqRes({ user: studentUser });
      await getMyCandidateProfile(pReq, pRes);
      assert.equal(pRes.body.candidate.applications_count, 1);
    });

    it('recruiter views applications for their job and updates applicant status', async () => {
      // Recruiter views applications
      const { req: gReq, res: gRes } = createMockReqRes({
        user: recruiterUser,
        params: { id: createdJobId }
      });
      await getJobApplications(gReq, gRes);
      assert.equal(gRes.statusCode, 200);
      assert.equal(gRes.body.count, 1);
      assert.equal(gRes.body.applications[0].candidate_id, studentCandidateId);

      // Unauthorized recruiter is denied access
      const { req: uReq, res: uRes } = createMockReqRes({
        user: unauthorizedRecruiter,
        params: { id: createdJobId }
      });
      await getJobApplications(uReq, uRes);
      assert.equal(uRes.statusCode, 403);

      // Recruiter advances application to 'interviewing'
      const { req: pReq, res: pRes } = createMockReqRes({
        user: recruiterUser,
        params: { id: createdJobId, appId: createdApplicationId },
        body: { status: 'interviewing', notes: 'Top candidate match from vector index' }
      });
      await updateApplicationStatus(pReq, pRes);
      assert.equal(pRes.statusCode, 200);
      assert.equal(pRes.body.application.status, 'interviewing');

      // Student verifies status is updated
      const { req: sReq, res: sRes } = createMockReqRes({ user: studentUser });
      await getMyApplications(sReq, sRes);
      const updatedApp = sRes.body.applications.find(a => a.job_id === createdJobId);
      assert.equal(updatedApp.status, 'interviewing');
    });
  });

  describe('3. College Administrator Mentorship Management', () => {
    it('college admin assigns faculty to student and inspects assignments', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdminUser,
        body: {
          faculty_id: facultyUser.id,
          student_id: studentUser.id,
          notes: 'Focus on distributed consensus systems'
        }
      });
      await assignFacultyToStudent(req, res);
      assert.equal(res.statusCode, 201);
      assert.ok(res.body.assignment.id);
      createdAssignmentId = res.body.assignment.id;

      // College admin views assignments
      const { req: aReq, res: aRes } = createMockReqRes({ user: collegeAdminUser });
      await getInstitutionAssignments(aReq, aRes);
      assert.equal(aRes.statusCode, 200);
      assert.ok(aRes.body.count >= 1);
      const found = aRes.body.assignments.find(a => a.id === createdAssignmentId);
      assert.ok(found);
      assert.equal(found.faculty_id, facultyUser.id);
      assert.equal(found.student_id, studentUser.id);
    });

    it('college admin can unassign mentorship and remove assignment', async () => {
      const { req, res } = createMockReqRes({
        user: collegeAdminUser,
        params: { id: createdAssignmentId }
      });
      await unassignFacultyFromStudent(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.deleted_id, createdAssignmentId);

      // Re-assign for next faculty tests
      const { req: reReq, res: reRes } = createMockReqRes({
        user: collegeAdminUser,
        body: {
          faculty_id: facultyUser.id,
          student_id: studentUser.id,
          notes: 'Active advising relationship'
        }
      });
      await assignFacultyToStudent(reReq, reRes);
      assert.equal(reRes.statusCode, 201);
      createdAssignmentId = reRes.body.assignment.id;
    });
  });

  describe('4. Faculty Mentorship Review & Student Access Enforcement', () => {
    it('assigned faculty retrieves mentee roster and inspects assigned student details', async () => {
      const { req, res } = createMockReqRes({ user: facultyUser });
      await getMyAssignedStudents(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(res.body.count >= 1);
      const mentee = res.body.students.find(s => s.user_id === studentUser.id);
      assert.ok(mentee);
      assert.equal(mentee.name, studentUser.name);

      // Detailed inspect
      const { req: dReq, res: dRes } = createMockReqRes({
        user: facultyUser,
        params: { id: studentUser.id }
      });
      await getAssignedStudentDetails(dReq, dRes);
      assert.equal(dRes.statusCode, 200);
      assert.equal(dRes.body.student.user_id, studentUser.id);
    });

    it('faculty updates mentorship review notes and progress status', async () => {
      const { req, res } = createMockReqRes({
        user: facultyUser,
        params: { id: studentUser.id },
        body: { notes: 'Midterm progress review complete: 95% proficiency in PostgreSQL', status: 'reviewed' }
      });
      await updateMentorshipNotes(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.assignment.notes, 'Midterm progress review complete: 95% proficiency in PostgreSQL');
    });

    it('unassigned faculty is strictly denied access to student details and notes (403 Forbidden)', async () => {
      const { req, res } = createMockReqRes({
        user: unassignedFacultyUser,
        params: { id: studentUser.id }
      });
      await getAssignedStudentDetails(req, res);
      assert.equal(res.statusCode, 403);

      const { req: nReq, res: nRes } = createMockReqRes({
        user: unassignedFacultyUser,
        params: { id: studentUser.id },
        body: { notes: 'Hacked notes' }
      });
      await updateMentorshipNotes(nReq, nRes);
      assert.equal(nRes.statusCode, 403);
    });
  });

  describe('5. Company Administrator Recruiter & Requisition Governance', () => {
    it('company admin views recruiters and company jobs', async () => {
      const { req, res } = createMockReqRes({ user: companyAdminUser });
      await getCompanyRecruiters(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(res.body.count >= 1);
      const rec = res.body.recruiters.find(r => r.id === recruiterUser.id);
      assert.ok(rec);

      const { req: jReq, res: jRes } = createMockReqRes({ user: companyAdminUser });
      await getCompanyJobs(jReq, jRes);
      assert.equal(jRes.statusCode, 200);
      assert.ok(jRes.body.count >= 1);
    });

    it('company admin adds and removes recruiter from corporate roster', async () => {
      // Add unauthorizedRecruiter into company
      const { req, res } = createMockReqRes({
        user: companyAdminUser,
        body: { email: unauthorizedRecruiter.email }
      });
      await addCompanyRecruiter(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.recruiter.id, unauthorizedRecruiter.id);

      // Verify now present in company recruiters
      const { req: cReq, res: cRes } = createMockReqRes({ user: companyAdminUser });
      await getCompanyRecruiters(cReq, cRes);
      assert.ok(cRes.body.recruiters.some(r => r.id === unauthorizedRecruiter.id));

      // Remove recruiter
      const { req: dReq, res: dRes } = createMockReqRes({
        user: companyAdminUser,
        params: { user_id: unauthorizedRecruiter.id }
      });
      await removeCompanyRecruiter(dReq, dRes);
      assert.equal(dRes.statusCode, 200);
      assert.equal(dRes.body.deleted_user_id, unauthorizedRecruiter.id);
    });
  });

  describe('6. Super Administrator User Directory & Tenant Inspection', () => {
    it('super admin inspects all platform users with password hashes strictly excluded', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await getAdminUsers(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.users));
      assert.ok(res.body.count > 0);

      // Security check: Verify NO user record contains password or password_hash
      for (const u of res.body.users) {
        assert.equal(u.password, undefined);
        assert.equal(u.password_hash, undefined);
        assert.ok(u.id);
        assert.ok(u.email);
        assert.ok(u.role);
      }
    });

    it('super admin inspects tenants with member counts', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await getAdminTenants(req, res);
      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.institutions));
      assert.ok(Array.isArray(res.body.companies));
      assert.ok(res.body.total_institutions > 0);
      assert.ok(res.body.total_companies > 0);
    });

    it('super admin retrieves real-time platform overview telemetry', async () => {
      const { req, res } = createMockReqRes({ user: superAdminUser });
      await getPlatformOverview(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.database_status, 'connected (PostgreSQL 18)');
      assert.ok(res.body.users.total > 0);
      assert.ok(res.body.counts.candidates > 0);
      assert.ok(res.body.counts.jobs > 0);
      assert.ok(res.body.indexing_queue.total >= 0);
    });
  });
});
