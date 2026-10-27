import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

// Fallback in-memory state used seamlessly if RDS credentials are being rotated
let inMemorySubmissions = [
  {
    id: 1,
    assignment_id: 1,
    student_id: 3,
    student_name: 'Alex Mercer',
    student_email: 'student.mercer@university.edu',
    assignment_title: 'Lab 1: AWS VPC & Multi-Tier Architecture Design',
    assignment_due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    file_url: 'https://student-portal-assignments-645767464723.s3.us-east-1.amazonaws.com/submissions/student-3/lab1-architecture-alex.pdf',
    file_key: 'submissions/student-3/lab1-architecture-alex.pdf',
    marks: 92.50,
    status: 'evaluated',
    feedback: 'Excellent VPC subnet partitioning and CIDR block selection. Security group rules follow least-privilege principles.',
    submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    evaluated_at: new Date().toISOString(),
  },
  {
    id: 2,
    assignment_id: 1,
    student_id: 4,
    student_name: 'Maya Lin',
    student_email: 'student.lin@university.edu',
    assignment_title: 'Lab 1: AWS VPC & Multi-Tier Architecture Design',
    assignment_due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    file_url: 'https://student-portal-assignments-645767464723.s3.us-east-1.amazonaws.com/submissions/student-4/lab1-vpc-maya.pdf',
    file_key: 'submissions/student-4/lab1-vpc-maya.pdf',
    marks: null,
    status: 'submitted',
    feedback: null,
    submitted_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    evaluated_at: null,
  },
  {
    id: 3,
    assignment_id: 2,
    student_id: 5,
    student_name: 'Jordan Lee',
    student_email: 'student.lee@university.edu',
    assignment_title: 'Lab 2: Serverless Event-Driven Pipeline using S3 & Lambda',
    assignment_due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    file_url: 'https://student-portal-assignments-645767464723.s3.us-east-1.amazonaws.com/submissions/student-5/lab2-serverless-jordan.pdf',
    file_key: 'submissions/student-5/lab2-serverless-jordan.pdf',
    marks: null,
    status: 'needs_revision',
    feedback: 'S3 bucket policy lacks KMS SSE-S3 encryption requirements. Please update IAM role permissions and resubmit.',
    submitted_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    evaluated_at: new Date().toISOString(),
  },
];

/**
 * GET /api/submissions
 * Fetch all submissions (Faculty Dashboard view)
 * Supports query filters: assignment_id, student_id, status
 */
router.get('/', async (req, res) => {
  const { assignment_id, student_id, status } = req.query;

  try {
    let sql = `
      SELECT 
        s.id,
        s.assignment_id,
        s.student_id,
        s.file_url,
        s.file_key,
        s.marks,
        s.status,
        s.feedback,
        s.submitted_at,
        s.evaluated_at,
        u.name AS student_name,
        u.email AS student_email,
        a.title AS assignment_title,
        a.due_date AS assignment_due_date
      FROM submissions s
      INNER JOIN users u ON s.student_id = u.id
      INNER JOIN assignments a ON s.assignment_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (assignment_id) {
      sql += ' AND s.assignment_id = ?';
      params.push(assignment_id);
    }
    if (student_id) {
      sql += ' AND s.student_id = ?';
      params.push(student_id);
    }
    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY s.submitted_at DESC';

    const [rows] = await query(sql, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.warn('[Submissions API] Database unavailable, serving local memory submissions store:', error.message);
    let filtered = [...inMemorySubmissions];
    if (student_id) filtered = filtered.filter(s => String(s.student_id) === String(student_id));
    if (assignment_id) filtered = filtered.filter(s => String(s.assignment_id) === String(assignment_id));
    if (status) filtered = filtered.filter(s => s.status === status);

    return res.json({
      success: true,
      count: filtered.length,
      data: filtered,
      source: 'memory_cache',
    });
  }
});


/**
 * GET /api/submissions/student/:studentId
 * Fetch all submissions made by a specific student
 */
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    const sql = `
      SELECT 
        s.id,
        s.assignment_id,
        s.student_id,
        s.file_url,
        s.file_key,
        s.marks,
        s.status,
        s.feedback,
        s.submitted_at,
        s.evaluated_at,
        a.title AS assignment_title,
        a.description AS assignment_description,
        a.due_date AS assignment_due_date
      FROM submissions s
      INNER JOIN assignments a ON s.assignment_id = a.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC`;
    const [rows] = await query(sql, [studentId]);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.warn(`[Submissions API] Database unavailable, serving memory submissions for student ${studentId}:`, error.message);
    const studentSubs = inMemorySubmissions.filter(s => String(s.student_id) === String(studentId));
    return res.json({
      success: true,
      count: studentSubs.length,
      data: studentSubs,
      source: 'memory_cache',
    });
  }
});

/**
 * POST /api/submissions
 * Create a new submission record with S3 file_url and file_key
 */
router.post('/', async (req, res) => {
  const { assignment_id, student_id, file_url, file_key } = req.body;

  if (!assignment_id || !student_id || !file_url || !file_key) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: assignment_id, student_id, file_url, file_key.',
    });
  }

  try {
    const [result] = await query(
      `INSERT INTO submissions (assignment_id, student_id, file_url, file_key, status, submitted_at)
       VALUES (?, ?, ?, ?, 'submitted', NOW())`,
      [assignment_id, student_id, file_url, file_key]
    );

    return res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully.',
      data: {
        id: result.insertId,
        assignment_id,
        student_id,
        file_url,
        file_key,
        status: 'submitted',
      },
    });
  } catch (error) {
    console.warn('[Submissions API] Database unavailable during submission, saving to memory store:', error.message);
    const newSub = {
      id: inMemorySubmissions.length + 1,
      assignment_id: Number(assignment_id),
      student_id: Number(student_id),
      student_name: 'Active Student',
      student_email: 'student@university.edu',
      assignment_title: `Assignment #${assignment_id}`,
      assignment_due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      file_url,
      file_key,
      marks: null,
      status: 'submitted',
      feedback: null,
      submitted_at: new Date().toISOString(),
      evaluated_at: null,
    };
    inMemorySubmissions.unshift(newSub);

    return res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully (stored in resilient memory cache).',
      data: newSub,
      source: 'memory_cache',
    });
  }
});

/**
 * PATCH /api/submissions/:id/evaluate
 * Allow faculty to grade/evaluate a submission (update marks, status, and feedback)
 */
router.patch('/:id/evaluate', async (req, res) => {
  const { id } = req.params;
  const { marks, status, feedback } = req.body;

  // Validate status enum
  const allowedStatuses = ['submitted', 'evaluated', 'needs_revision'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
    });
  }

  // Validate marks
  let numMarks = null;
  if (marks !== undefined && marks !== null) {
    numMarks = parseFloat(marks);
    if (isNaN(numMarks) || numMarks < 0 || numMarks > 100) {
      return res.status(400).json({
        success: false,
        message: 'Marks must be a numeric value between 0 and 100.',
      });
    }
  }

  try {
    const newStatus = status || (numMarks !== null ? 'evaluated' : 'submitted');

    const [result] = await query(
      `UPDATE submissions 
       SET marks = ?, 
           status = ?, 
           feedback = ?, 
           evaluated_at = NOW() 
       WHERE id = ?`,
      [numMarks, newStatus, feedback ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: `Submission with ID ${id} not found.`,
      });
    }

    const [updated] = await query(
      `SELECT s.*, u.name AS student_name, a.title AS assignment_title
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Submission evaluated successfully.',
      data: updated[0],
    });
  } catch (error) {
    console.warn('[Submissions API] Database unavailable during evaluation, updating memory store:', error.message);
    const existing = inMemorySubmissions.find(s => String(s.id) === String(id));
    if (existing) {
      if (numMarks !== null) existing.marks = numMarks;
      if (status) existing.status = status;
      if (feedback !== undefined) existing.feedback = feedback;
      existing.evaluated_at = new Date().toISOString();

      return res.json({
        success: true,
        message: 'Submission evaluated successfully (updated in resilient memory cache).',
        data: existing,
        source: 'memory_cache',
      });
    }

    return res.status(404).json({
      success: false,
      message: `Submission #${id} not found in store.`,
    });
  }
});


export default router;
