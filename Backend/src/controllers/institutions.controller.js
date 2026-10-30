// Backend/src/controllers/institutions.controller.js
import { db } from '../config/db.js';
import { ok, fail } from '../utils/response.js';

/**
 * Helper to resolve the authorized institution ID for a user.
 */
async function getAuthorizedInstitutionId(user) {
  if (user.role === 'super_admin') {
    const { rows } = await db.query('SELECT id FROM institutions ORDER BY id ASC LIMIT 1');
    return rows[0]?.id || null;
  }
  const { rows } = await db.query(
    'SELECT institution_id FROM institution_memberships WHERE user_id = $1 LIMIT 1',
    [user.id]
  );
  return rows[0]?.institution_id || null;
}

/**
 * GET /api/institutions/my-institution
 */
export const getMyInstitution = async (req, res) => {
  try {
    const institutionId = await getAuthorizedInstitutionId(req.user);
    if (!institutionId) {
      return fail(res, 'User is not assigned to an institution', 404);
    }

    const { rows } = await db.query('SELECT * FROM institutions WHERE id = $1', [institutionId]);
    if (!rows[0]) {
      return fail(res, 'Institution not found', 404);
    }

    return ok(res, { institution: rows[0] });
  } catch (err) {
    console.error('Get My Institution Error:', err);
    return fail(res, 'Failed to fetch institution: ' + err.message, 500);
  }
};

/**
 * GET /api/institutions/students
 * Scoped to authorized institution.
 */
export const getInstitutionStudents = async (req, res) => {
  try {
    const institutionId = await getAuthorizedInstitutionId(req.user);
    if (!institutionId) {
      return fail(res, 'Access denied: No institution associated with this user', 403);
    }

    const { rows } = await db.query(
      `SELECT u.id as user_id, u.name, u.email,
              c.id as candidate_id, c.headline, c.experience_years, c.skill_json,
              fsa.faculty_id as assigned_faculty_id,
              fu.name as assigned_faculty_name
       FROM institution_memberships im
       JOIN users u ON im.user_id = u.id
       LEFT JOIN candidates c ON c.user_id = u.id
       LEFT JOIN faculty_student_assignments fsa ON fsa.student_id = u.id AND fsa.institution_id = $1
       LEFT JOIN users fu ON fsa.faculty_id = fu.id
       WHERE im.institution_id = $1 AND im.role = 'student'
       ORDER BY u.name ASC`,
      [institutionId]
    );

    const students = rows.map(r => {
      let skills = [];
      if (r.skill_json) {
        skills = typeof r.skill_json === 'string' ? JSON.parse(r.skill_json) : r.skill_json;
      }
      return {
        user_id: r.user_id,
        name: r.name,
        email: r.email,
        candidate_id: r.candidate_id,
        headline: r.headline || 'Student Candidate',
        experience_years: Number(r.experience_years || 0),
        skills,
        assigned_faculty_id: r.assigned_faculty_id,
        assigned_faculty_name: r.assigned_faculty_name
      };
    });

    return ok(res, { students, count: students.length, institution_id: institutionId });
  } catch (err) {
    console.error('Get Institution Students Error:', err);
    return fail(res, 'Failed to fetch students: ' + err.message, 500);
  }
};

/**
 * GET /api/institutions/faculty
 * Scoped to authorized institution.
 */
export const getInstitutionFaculty = async (req, res) => {
  try {
    const institutionId = await getAuthorizedInstitutionId(req.user);
    if (!institutionId) {
      return fail(res, 'Access denied: No institution associated with this user', 403);
    }

    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email,
              COUNT(fsa.id)::int as mentee_count
       FROM institution_memberships im
       JOIN users u ON im.user_id = u.id
       LEFT JOIN faculty_student_assignments fsa ON fsa.faculty_id = u.id AND fsa.institution_id = $1
       WHERE im.institution_id = $1 AND im.role = 'faculty'
       GROUP BY u.id, u.name, u.email
       ORDER BY u.name ASC`,
      [institutionId]
    );

    return ok(res, { faculty: rows, count: rows.length, institution_id: institutionId });
  } catch (err) {
    console.error('Get Institution Faculty Error:', err);
    return fail(res, 'Failed to fetch faculty: ' + err.message, 500);
  }
};

/**
 * POST /api/institutions/assign-faculty
 * Assigns or reassigns faculty to a student within the same institution.
 */
export const assignFacultyToStudent = async (req, res) => {
  try {
    const institutionId = await getAuthorizedInstitutionId(req.user);
    if (!institutionId) {
      return fail(res, 'Access denied: No institution associated with this user', 403);
    }

    const { faculty_id, student_id, notes } = req.body;
    if (!faculty_id || !student_id) {
      return fail(res, 'faculty_id and student_id are required', 400);
    }

    // Verify both faculty and student belong to this institution
    const { rows: facultyMember } = await db.query(
      'SELECT id FROM institution_memberships WHERE institution_id = $1 AND user_id = $2 AND role = $3',
      [institutionId, faculty_id, 'faculty']
    );
    if (!facultyMember[0]) {
      return fail(res, 'Faculty member not found in authorized institution', 404);
    }

    const { rows: studentMember } = await db.query(
      'SELECT id FROM institution_memberships WHERE institution_id = $1 AND user_id = $2 AND role = $3',
      [institutionId, student_id, 'student']
    );
    if (!studentMember[0]) {
      return fail(res, 'Student member not found in authorized institution', 404);
    }

    // Upsert assignment
    const { rows: assignmentRows } = await db.query(
      `INSERT INTO faculty_student_assignments (institution_id, faculty_id, student_id, status, notes, updated_at)
       VALUES ($1, $2, $3, 'active', $4, CURRENT_TIMESTAMP)
       ON CONFLICT (faculty_id, student_id) DO UPDATE 
       SET notes = EXCLUDED.notes, status = 'active', updated_at = CURRENT_TIMESTAMP
       RETURNING id, institution_id, faculty_id, student_id, status, notes, assigned_at`,
      [institutionId, faculty_id, student_id, notes || null]
    );

    // Record audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'ASSIGN_FACULTY', 'faculty_student_assignment', $2, $3)`,
      [req.user.id, assignmentRows[0].id, JSON.stringify({ faculty_id, student_id, institution_id: institutionId })]
    );

    return ok(res, {
      message: 'Faculty mentorship assigned successfully',
      assignment: assignmentRows[0]
    }, 201);
  } catch (err) {
    console.error('Assign Faculty Error:', err);
    return fail(res, 'Failed to assign faculty: ' + err.message, 500);
  }
};

/**
 * GET /api/institutions/assignments
 * Retrieves all mentorship assignments for the authorized institution.
 */
export const getInstitutionAssignments = async (req, res) => {
  try {
    const institutionId = await getAuthorizedInstitutionId(req.user);
    if (!institutionId) {
      return fail(res, 'Access denied: No institution associated with this user', 403);
    }

    const { rows } = await db.query(
      `SELECT fsa.id, fsa.institution_id, fsa.faculty_id, fu.name as faculty_name, fu.email as faculty_email,
              fsa.student_id, su.name as student_name, su.email as student_email,
              c.id as candidate_id, c.headline as student_headline, c.skill_json as student_skills,
              fsa.status, fsa.notes, fsa.assigned_at, fsa.updated_at
       FROM faculty_student_assignments fsa
       JOIN users fu ON fsa.faculty_id = fu.id
       JOIN users su ON fsa.student_id = su.id
       LEFT JOIN candidates c ON c.user_id = su.id
       WHERE fsa.institution_id = $1
       ORDER BY fsa.assigned_at DESC`,
      [institutionId]
    );

    const assignments = rows.map(r => {
      let skills = [];
      if (r.student_skills) {
        skills = typeof r.student_skills === 'string' ? JSON.parse(r.student_skills) : r.student_skills;
      }
      return {
        ...r,
        student_skills: skills
      };
    });

    return ok(res, { assignments, count: assignments.length, institution_id: institutionId });
  } catch (err) {
    console.error('Get Institution Assignments Error:', err);
    return fail(res, 'Failed to fetch assignments: ' + err.message, 500);
  }
};

/**
 * DELETE /api/institutions/assignments/:id
 * Removes a faculty-student mentorship assignment within the authorized institution.
 */
export const unassignFacultyFromStudent = async (req, res) => {
  try {
    const institutionId = await getAuthorizedInstitutionId(req.user);
    if (!institutionId) {
      return fail(res, 'Access denied: No institution associated with this user', 403);
    }

    const assignmentId = parseInt(req.params.id, 10);

    const { rows } = await db.query(
      'DELETE FROM faculty_student_assignments WHERE id = $1 AND institution_id = $2 RETURNING id, faculty_id, student_id',
      [assignmentId, institutionId]
    );

    if (!rows[0]) {
      return fail(res, 'Assignment not found in authorized institution', 404);
    }

    // Record audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'UNASSIGN_FACULTY', 'faculty_student_assignment', $2, $3)`,
      [req.user.id, assignmentId, JSON.stringify(rows[0])]
    );

    return ok(res, {
      message: 'Mentorship assignment removed successfully',
      deleted_id: assignmentId
    });
  } catch (err) {
    console.error('Unassign Faculty Error:', err);
    return fail(res, 'Failed to unassign faculty: ' + err.message, 500);
  }
};

/**
 * GET /api/institutions/stats
 */
export const getInstitutionStats = async (req, res) => {
  try {
    const institutionId = await getAuthorizedInstitutionId(req.user);
    if (!institutionId) {
      return fail(res, 'Access denied: No institution associated with this user', 403);
    }

    const { rows: inst } = await db.query('SELECT name, code FROM institutions WHERE id = $1', [institutionId]);
    const { rows: studentCount } = await db.query(
      "SELECT COUNT(*)::int as count FROM institution_memberships WHERE institution_id = $1 AND role = 'student'",
      [institutionId]
    );
    const { rows: facultyCount } = await db.query(
      "SELECT COUNT(*)::int as count FROM institution_memberships WHERE institution_id = $1 AND role = 'faculty'",
      [institutionId]
    );
    const { rows: assignmentCount } = await db.query(
      "SELECT COUNT(*)::int as count FROM faculty_student_assignments WHERE institution_id = $1 AND status = 'active'",
      [institutionId]
    );

    return ok(res, {
      institution_name: inst[0]?.name || 'Institutional Center',
      institution_code: inst[0]?.code || 'INST',
      total_students: studentCount[0]?.count || 0,
      total_faculty: facultyCount[0]?.count || 0,
      active_assignments: assignmentCount[0]?.count || 0
    });
  } catch (err) {
    console.error('Get Institution Stats Error:', err);
    return fail(res, 'Failed to fetch institution stats: ' + err.message, 500);
  }
};
