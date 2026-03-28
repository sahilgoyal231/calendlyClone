import express from 'express';
import { getPool } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();

// POST /api/bookings - Create a booking
router.post('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const { event_type_id, invitee_name, invitee_email, start_time, end_time, timezone, answers, notes } = req.body;

    if (!event_type_id || !invitee_name || !invitee_email || !start_time || !end_time) {
      return res.status(400).json({ error: 'event_type_id, invitee_name, invitee_email, start_time, and end_time are required' });
    }

    const [eventTypes] = await pool.query('SELECT * FROM event_types WHERE id = ? AND is_active = 1', [event_type_id]);
    if (eventTypes.length === 0) {
      return res.status(404).json({ error: 'Event type not found or inactive' });
    }
    const eventType = eventTypes[0];

    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;
    const bufferBefore = eventType.buffer_before || 0;
    const bufferAfter = eventType.buffer_after || 0;

    const newStart = new Date(start_time);
    const newEnd = new Date(end_time);
    const newBlockedStart = new Date(newStart.getTime() - bufferBefore * 60000);
    const newBlockedEnd = new Date(newEnd.getTime() + bufferAfter * 60000);

    const [overlapping] = await pool.query(`
      SELECT b.*, et.buffer_before, et.buffer_after
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE et.user_id = ?
      AND b.status = 'confirmed'
      AND DATE_SUB(b.start_time, INTERVAL COALESCE(et.buffer_before, 0) MINUTE) < ?
      AND DATE_ADD(b.end_time, INTERVAL COALESCE(et.buffer_after, 0) MINUTE) > ?
    `, [userId, newBlockedEnd.toISOString().replace('T', ' ').substring(0, 19), newBlockedStart.toISOString().replace('T', ' ').substring(0, 19)]);

    if (overlapping.length > 0) {
      return res.status(409).json({ error: 'This time slot is no longer available. Please select another time.' });
    }

    const id = uuidv4();
    const startStr = new Date(start_time).toISOString().replace('T', ' ').substring(0, 19);
    const endStr = new Date(end_time).toISOString().replace('T', ' ').substring(0, 19);

    await pool.execute(`
      INSERT INTO bookings (id, event_type_id, invitee_name, invitee_email, start_time, end_time, timezone, answers, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, event_type_id, invitee_name, invitee_email, startStr, endStr, timezone || 'Asia/Kolkata', JSON.stringify(answers || []), notes || '']);

    const [bookingRows] = await pool.query(`
      SELECT b.*, et.name as event_name, et.duration, et.color, u.name as host_name, u.email as host_email
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.id = ?
    `, [id]);

    const booking = bookingRows[0];
    booking.answers = typeof booking.answers === 'string' ? JSON.parse(booking.answers || '[]') : (booking.answers || []);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings - List bookings
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;
    const { status } = req.query;

    let query = `
      SELECT b.*, et.name as event_name, et.duration, et.color, et.slug as event_slug, u.username
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE et.user_id = ?
    `;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (status === 'upcoming') {
      query += ` AND b.status = 'confirmed' AND b.start_time > '${nowStr}' ORDER BY b.start_time ASC`;
    } else if (status === 'past') {
      query += ` AND b.status = 'confirmed' AND b.start_time <= '${nowStr}' ORDER BY b.start_time DESC`;
    } else if (status === 'cancelled') {
      query += ` AND b.status = 'cancelled' ORDER BY b.updated_at DESC`;
    } else {
      query += ` ORDER BY b.start_time DESC`;
    }

    const [bookings] = await pool.query(query, [userId]);
    const result = bookings.map(b => ({
      ...b,
      start_time: b.start_time.toISOString(),
      end_time: b.end_time.toISOString(),
      answers: typeof b.answers === 'string' ? JSON.parse(b.answers || '[]') : (b.answers || [])
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT b.*, et.name as event_name, et.duration, et.color, et.slug as event_slug,
             u.name as host_name, u.email as host_email, u.username
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      JOIN users u ON et.user_id = u.id
      WHERE b.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = rows[0];
    booking.start_time = booking.start_time.toISOString();
    booking.end_time = booking.end_time.toISOString();
    booking.answers = typeof booking.answers === 'string' ? JSON.parse(booking.answers || '[]') : (booking.answers || []);
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = rows[0];

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    const { cancel_reason } = req.body || {};
    await pool.execute(`
      UPDATE bookings SET status = 'cancelled', cancel_reason = ?
      WHERE id = ?
    `, [cancel_reason || '', req.params.id]);

    const [updatedRows] = await pool.query(`
      SELECT b.*, et.name as event_name, et.duration, et.color
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE b.id = ?
    `, [req.params.id]);

    const updated = updatedRows[0];
    updated.start_time = updated.start_time.toISOString();
    updated.end_time = updated.end_time.toISOString();
    updated.answers = typeof updated.answers === 'string' ? JSON.parse(updated.answers || '[]') : (updated.answers || []);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PUT /api/bookings/:id/reschedule
router.put('/:id/reschedule', async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = rows[0];

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Only confirmed bookings can be rescheduled' });
    }

    const { start_time, end_time } = req.body;
    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'start_time and end_time are required' });
    }

    const [eventTypes] = await pool.query('SELECT * FROM event_types WHERE id = ?', [booking.event_type_id]);
    const eventType = eventTypes[0];
    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;
    const bufferBefore = eventType.buffer_before || 0;
    const bufferAfter = eventType.buffer_after || 0;

    const newStart = new Date(start_time);
    const newEnd = new Date(end_time);
    const newBlockedStart = new Date(newStart.getTime() - bufferBefore * 60000);
    const newBlockedEnd = new Date(newEnd.getTime() + bufferAfter * 60000);

    const [overlapping] = await pool.query(`
      SELECT b.*, et.buffer_before, et.buffer_after
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE et.user_id = ?
      AND b.id != ?
      AND b.status = 'confirmed'
      AND DATE_SUB(b.start_time, INTERVAL COALESCE(et.buffer_before, 0) MINUTE) < ?
      AND DATE_ADD(b.end_time, INTERVAL COALESCE(et.buffer_after, 0) MINUTE) > ?
    `, [userId, req.params.id, newBlockedEnd.toISOString().replace('T', ' ').substring(0, 19), newBlockedStart.toISOString().replace('T', ' ').substring(0, 19)]);

    if (overlapping.length > 0) {
      return res.status(409).json({ error: 'This time slot is not available. Please select another time.' });
    }

    const startStr = new Date(start_time).toISOString().replace('T', ' ').substring(0, 19);
    const endStr = new Date(end_time).toISOString().replace('T', ' ').substring(0, 19);

    await pool.execute(`
      UPDATE bookings SET start_time = ?, end_time = ?
      WHERE id = ?
    `, [startStr, endStr, req.params.id]);

    const [updatedRows] = await pool.query(`
      SELECT b.*, et.name as event_name, et.duration, et.color
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE b.id = ?
    `, [req.params.id]);

    const updated = updatedRows[0];
    updated.start_time = updated.start_time.toISOString();
    updated.end_time = updated.end_time.toISOString();
    updated.answers = typeof updated.answers === 'string' ? JSON.parse(updated.answers || '[]') : (updated.answers || []);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
