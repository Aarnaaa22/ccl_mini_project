import express from 'express';
import { query } from '../config/db.js';

const router = express.Router();

/**
 * GET /api/users
 * Retrieve users list optionally filtered by role (student | faculty)
 */
router.get('/', async (req, res) => {
  const { role } = req.query;

  try {
    let sql = 'SELECT id, name, email, role, created_at FROM users';
    const params = [];

    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }

    sql += ' ORDER BY id ASC';

    const [rows] = await query(sql, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.warn('[Users API] Database unavailable, serving initial seed users:', error.message);
    const fallbackUsers = [
      { id: 1, name: 'Dr. Aris Thorne', email: 'faculty.thorne@university.edu', role: 'faculty' },
      { id: 2, name: 'Prof. Evelyn Vance', email: 'faculty.vance@university.edu', role: 'faculty' },
      { id: 3, name: 'Alex Mercer', email: 'student.mercer@university.edu', role: 'student' },
      { id: 4, name: 'Maya Lin', email: 'student.lin@university.edu', role: 'student' },
      { id: 5, name: 'Jordan Lee', email: 'student.lee@university.edu', role: 'student' },
    ];
    const filtered = role ? fallbackUsers.filter(u => u.role === role) : fallbackUsers;
    return res.json({
      success: true,
      count: filtered.length,
      data: filtered,
      source: 'seed_cache',
    });
  }
});


export default router;
