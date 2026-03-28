import express from 'express';
import { getPool } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();

// GET /api/event-types
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;

    const [eventTypes] = await pool.query(`
      SELECT et.*, u.username 
      FROM event_types et
      JOIN users u ON et.user_id = u.id
      WHERE et.user_id = ?
      ORDER BY et.created_at DESC
    `, [userId]);

    const result = eventTypes.map(et => ({
      ...et,
      custom_questions: typeof et.custom_questions === 'string' ? JSON.parse(et.custom_questions || '[]') : (et.custom_questions || []),
      is_active: Boolean(et.is_active)
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/event-types/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT et.*, u.username
      FROM event_types et
      JOIN users u ON et.user_id = u.id
      WHERE et.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    const eventType = rows[0];
    eventType.custom_questions = typeof eventType.custom_questions === 'string' ? JSON.parse(eventType.custom_questions || '[]') : (eventType.custom_questions || []);
    eventType.is_active = Boolean(eventType.is_active);
    res.json(eventType);
  } catch (err) {
    next(err);
  }
});

// GET /api/event-types/slug/:slug - Public endpoint
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT et.*, u.username, u.name as user_name, u.welcome_message, u.timezone as user_timezone
      FROM event_types et
      JOIN users u ON et.user_id = u.id
      WHERE et.slug = ? AND et.is_active = 1
    `, [req.params.slug]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    const eventType = rows[0];
    eventType.custom_questions = typeof eventType.custom_questions === 'string' ? JSON.parse(eventType.custom_questions || '[]') : (eventType.custom_questions || []);
    eventType.is_active = Boolean(eventType.is_active);
    res.json(eventType);
  } catch (err) {
    next(err);
  }
});

// POST /api/event-types
router.post('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;

    const {
      name, slug, description, duration, color,
      location, buffer_before, buffer_after, custom_questions, schedule_id
    } = req.body;

    if (!name || !slug || !duration) {
      return res.status(400).json({ error: 'Name, slug, and duration are required' });
    }

    // Validate slug uniqueness
    const [existing] = await pool.query('SELECT id FROM event_types WHERE user_id = ? AND slug = ?', [userId, slug]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An event type with this URL slug already exists' });
    }

    // Get default schedule if not provided
    let sid = schedule_id || null;
    if (!sid) {
      const [schedules] = await pool.query('SELECT id FROM availability_schedules WHERE user_id = ? AND is_default = 1', [userId]);
      if (schedules.length > 0) sid = schedules[0].id;
    }

    const id = uuidv4();
    const questionsJson = JSON.stringify(custom_questions || []);

    await pool.execute(`
      INSERT INTO event_types (id, user_id, name, slug, description, duration, color, location, buffer_before, buffer_after, custom_questions, schedule_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, userId, name, slug,
      description || '', duration, color || '#0069ff',
      location || '', buffer_before || 0, buffer_after || 0,
      questionsJson, sid
    ]);

    const [createdRows] = await pool.query('SELECT et.*, u.username FROM event_types et JOIN users u ON et.user_id = u.id WHERE et.id = ?', [id]);
    const created = createdRows[0];
    created.custom_questions = typeof created.custom_questions === 'string' ? JSON.parse(created.custom_questions || '[]') : (created.custom_questions || []);
    created.is_active = Boolean(created.is_active);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/event-types/:id
router.put('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM event_types WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    const eventType = rows[0];

    const {
      name, slug, description, duration, color, location,
      is_active, buffer_before, buffer_after, custom_questions, schedule_id
    } = req.body;

    // Check slug
    if (slug && slug !== eventType.slug) {
      const [existing] = await pool.query('SELECT id FROM event_types WHERE user_id = ? AND slug = ? AND id != ?', [eventType.user_id, slug, req.params.id]);
      if (existing.length > 0) {
        return res.status(409).json({ error: 'An event type with this URL slug already exists' });
      }
    }

    // Prepare fields
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (slug !== undefined) { updates.push('slug = ?'); values.push(slug); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (duration !== undefined) { updates.push('duration = ?'); values.push(duration); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }
    if (location !== undefined) { updates.push('location = ?'); values.push(location); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (buffer_before !== undefined) { updates.push('buffer_before = ?'); values.push(buffer_before); }
    if (buffer_after !== undefined) { updates.push('buffer_after = ?'); values.push(buffer_after); }
    if (custom_questions !== undefined) { updates.push('custom_questions = ?'); values.push(JSON.stringify(custom_questions)); }
    if (schedule_id !== undefined) { updates.push('schedule_id = ?'); values.push(schedule_id); }

    if (updates.length > 0) {
      values.push(req.params.id);
      await pool.execute(`UPDATE event_types SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updatedRows] = await pool.query('SELECT et.*, u.username FROM event_types et JOIN users u ON et.user_id = u.id WHERE et.id = ?', [req.params.id]);
    const updated = updatedRows[0];
    updated.custom_questions = typeof updated.custom_questions === 'string' ? JSON.parse(updated.custom_questions || '[]') : (updated.custom_questions || []);
    updated.is_active = Boolean(updated.is_active);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/event-types/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id FROM event_types WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    await pool.execute('DELETE FROM event_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event type deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
