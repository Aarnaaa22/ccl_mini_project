import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/assignments
 * Retrieve all assignments ordered by due date
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT 
        a.id, 
        a.title, 
        a.description, 
        a.due_date, 
        a.created_by, 
        a.created_at,
        u.name AS faculty_name,
        u.email AS faculty_email,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS total_submissions
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.due_date ASC
    `);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.warn('[Assignments API] Database unavailable, serving seed assignments:', error.message);
    const fallbackAssignments = [
      {
        id: 1,
        title: 'Lab 1: AWS VPC & Multi-Tier Architecture Design',
        description: 'Design and implement a highly available, fault-tolerant 3-tier VPC with public and private subnets, NAT Gateway, and security group configurations. Submit your architectural diagram and implementation report as a PDF.',
        due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        faculty_name: 'Dr. Aris Thorne',
        faculty_email: 'faculty.thorne@university.edu',
        total_submissions: 2,
      },
      {
        id: 2,
        title: 'Lab 2: Serverless Event-Driven Pipeline using S3 & Lambda',
        description: 'Build a serverless image processing pipeline triggered by S3 ObjectCreated events. Include SAM or Terraform template definitions, Lambda handler code, and test execution logs.',
        due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        faculty_name: 'Dr. Aris Thorne',
        faculty_email: 'faculty.thorne@university.edu',
        total_submissions: 1,
      },
      {
        id: 3,
        title: 'Lab 3: Kubernetes Microservices Deployment on AWS EKS',
        description: 'Containerize a multi-service web application, create Helm charts, configure Ingress ALB controllers, and demonstrate horizontal pod autoscaling (HPA) under synthetic load.',
        due_date: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString(),
        faculty_name: 'Prof. Evelyn Vance',
        faculty_email: 'faculty.vance@university.edu',
        total_submissions: 0,
      },
    ];
    return res.json({
      success: true,
      count: fallbackAssignments.length,
      data: fallbackAssignments,
      source: 'seed_cache',
    });
  }
});


/**
 * GET /api/assignments/:id
 * Retrieve details for a specific assignment
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await query(
      `SELECT 
        a.id, 
        a.title, 
        a.description, 
        a.due_date, 
        a.created_by, 
        a.created_at,
        u.name AS faculty_name,
        u.email AS faculty_email
      FROM assignments a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Assignment with ID ${id} not found.`,
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error(`[Assignments API] Failed to fetch assignment ${id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignment.',
      error: error.message,
    });
  }
});

/**
 * POST /api/assignments
 * Create a new assignment (Faculty only)
 */
router.post('/', async (req, res) => {
  const { title, description, due_date, created_by } = req.body;

  if (!title || !description || !due_date) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, and due_date are required.',
    });
  }

  try {
    const [result] = await query(
      `INSERT INTO assignments (title, description, due_date, created_by)
       VALUES (?, ?, ?, ?)`,
      [title, description, due_date, created_by || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      data: {
        id: result.insertId,
        title,
        description,
        due_date,
        created_by,
      },
    });
  } catch (error) {
    console.error('[Assignments API] Failed to create assignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create assignment.',
      error: error.message,
    });
  }
});

export default router;
