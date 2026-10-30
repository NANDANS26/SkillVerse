// Backend/src/controllers/faculty.controller.js
import { db } from '../config/db.js';
import { ok, fail } from '../utils/response.js';

/**
 * GET /api/faculty/students
 * Retrieves students assigned to the authenticated faculty member.
 */
export const getMyAssignedStudents = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const { rows } = await db.query(
      `SELECT u.id as user_id, u.name, u.email,
              c.id as candidate_id, c.headline, c.experience_years, c.skill_json,
              fsa.assigned_at, fsa.status as mentorship_status, fsa.notes
       FROM faculty_student_assignments fsa
       JOIN users u ON fsa.student_id = u.id
       LEFT JOIN candidates c ON c.user_id = u.id
       WHERE fsa.faculty_id = $1 AND fsa.status = 'active'
       ORDER BY u.name ASC`,
      [facultyId]
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
        headline: r.headline || 'Mentee Student',
        experience_years: Number(r.experience_years || 0),
        skills,
        mentorship_status: r.mentorship_status,
        notes: r.notes,
        assigned_at: r.assigned_at
      };
    });

    return ok(res, { students, count: students.length });
  } catch (err) {
    console.error('Get Faculty Students Error:', err);
    return fail(res, 'Failed to fetch assigned students: ' + err.message, 500);
  }
};

/**
 * GET /api/faculty/student/:id
 * Retrieves details for a specific assigned student (enforcing mentorship assignment access boundary).
 */
export const getAssignedStudentDetails = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const studentUserId = parseInt(req.params.id, 10);

    // Enforce authorization boundary: student must be actively assigned to this faculty
    const { rows: assignment } = await db.query(
      `SELECT fsa.id, fsa.status, fsa.notes, fsa.assigned_at, inst.name as institution_name
       FROM faculty_student_assignments fsa
       JOIN institutions inst ON fsa.institution_id = inst.id
       WHERE fsa.faculty_id = $1 AND fsa.student_id = $2`,
      [facultyId, studentUserId]
    );

    if (!assignment[0]) {
      return fail(res, 'Access denied: Student is not assigned to your mentorship roster', 403);
    }

    const { rows: studentRows } = await db.query(
      `SELECT u.id as user_id, u.name, u.email,
              c.id as candidate_id, c.headline, c.experience_years, c.resume_text, c.skill_json
       FROM users u
       LEFT JOIN candidates c ON c.user_id = u.id
       WHERE u.id = $1`,
      [studentUserId]
    );

    if (!studentRows[0]) {
      return fail(res, 'Student record not found', 404);
    }

    const s = studentRows[0];
    let skills = [];
    if (s.skill_json) {
      skills = typeof s.skill_json === 'string' ? JSON.parse(s.skill_json) : s.skill_json;
    }

    return ok(res, {
      student: {
        user_id: s.user_id,
        name: s.name,
        email: s.email,
        candidate_id: s.candidate_id,
        headline: s.headline,
        experience_years: Number(s.experience_years || 0),
        resume_text: s.resume_text,
        skills,
        mentorship: assignment[0]
      }
    });
  } catch (err) {
    console.error('Get Assigned Student Details Error:', err);
    return fail(res, 'Failed to fetch student details: ' + err.message, 500);
  }
};

/**
 * GET /api/faculty/stats
 */
export const getFacultyStats = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { rows } = await db.query(
      `SELECT COUNT(*)::int as assigned_count
       FROM faculty_student_assignments 
       WHERE faculty_id = $1 AND status = 'active'`,
      [facultyId]
    );

    return ok(res, {
      assigned_students_count: rows[0]?.assigned_count || 0
    });
  } catch (err) {
    console.error('Get Faculty Stats Error:', err);
    return fail(res, 'Failed to fetch faculty stats: ' + err.message, 500);
  }
};

/**
 * PATCH /api/faculty/student/:id/notes
 * Updates mentorship progress notes and review status for an assigned student.
 */
export const updateMentorshipNotes = async (req, res) => {
  try {
    const facultyId = req.user.id;
    const studentUserId = parseInt(req.params.id, 10);
    const { notes, status } = req.body;

    // Verify mentorship assignment boundary
    const { rows: assignment } = await db.query(
      'SELECT id, institution_id FROM faculty_student_assignments WHERE faculty_id = $1 AND student_id = $2',
      [facultyId, studentUserId]
    );

    if (!assignment[0]) {
      return fail(res, 'Access denied: Student is not assigned to your mentorship roster', 403);
    }

    const { rows: updated } = await db.query(
      `UPDATE faculty_student_assignments
       SET notes = COALESCE($1, notes),
           status = COALESCE($2, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, faculty_id, student_id, notes, status, updated_at`,
      [notes || null, status || null, assignment[0].id]
    );

    // Record audit event
    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, 'UPDATE_MENTORSHIP_NOTES', 'faculty_student_assignment', $2, $3)`,
      [facultyId, assignment[0].id, JSON.stringify({ student_id: studentUserId, notes, status })]
    );

    return ok(res, {
      message: 'Mentorship review notes updated successfully',
      assignment: updated[0]
    });
  } catch (err) {
    console.error('Update Mentorship Notes Error:', err);
    return fail(res, 'Failed to update mentorship notes: ' + err.message, 500);
  }
};
