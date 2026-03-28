import express from 'express';
import { getPool } from '../db/database.js';
const router = express.Router();

// GET /api/users/me
router.get('/me', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users LIMIT 1');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No user found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/me
router.put('/me', async (req, res, next) => {
  try {
    const pool = getPool();
    const { name, email, username, timezone, welcome_message } = req.body;
    
    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'No user found' });
    }
    const userId = userRows[0].id;

    await pool.execute(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        username = COALESCE(?, username),
        timezone = COALESCE(?, timezone),
        welcome_message = COALESCE(?, welcome_message)
      WHERE id = ?
    `, [name, email, username, timezone, welcome_message, userId]);

    const [updatedRows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    res.json(updatedRows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
