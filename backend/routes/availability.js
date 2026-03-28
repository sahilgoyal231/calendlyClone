import express from 'express';
import { getPool } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();

// GET /api/availability - List all schedules
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;

    const [schedules] = await pool.query('SELECT * FROM availability_schedules WHERE user_id = ? ORDER BY is_default DESC', [userId]);

    const result = [];
    for (const schedule of schedules) {
      const [rules] = await pool.query('SELECT * FROM availability_rules WHERE schedule_id = ? ORDER BY day_of_week', [schedule.id]);
      const [overrides] = await pool.query('SELECT * FROM availability_overrides WHERE schedule_id = ? ORDER BY specific_date', [schedule.id]);
      
      result.push({
        ...schedule,
        is_default: Boolean(schedule.is_default),
        rules: rules.map(r => ({ ...r, is_active: Boolean(r.is_active) })),
        overrides: overrides.map(o => ({ ...o, specific_date: o.specific_date.toISOString().split('T')[0], is_unavailable: Boolean(o.is_unavailable) }))
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/availability - Create schedule
router.post('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;

    const { name, timezone, rules } = req.body;
    const id = uuidv4();

    await pool.execute(`
      INSERT INTO availability_schedules (id, user_id, name, timezone) VALUES (?, ?, ?, ?)
    `, [id, userId, name || 'New Schedule', timezone || 'Asia/Kolkata']);

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        await pool.execute(`
          INSERT INTO availability_rules (id, schedule_id, day_of_week, start_time, end_time, is_active)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), id, rule.day_of_week, rule.start_time, rule.end_time, rule.is_active ? 1 : 0]);
      }
    }

    const [scheduleRows] = await pool.query('SELECT * FROM availability_schedules WHERE id = ?', [id]);
    const schedule = scheduleRows[0];
    const [savedRules] = await pool.query('SELECT * FROM availability_rules WHERE schedule_id = ? ORDER BY day_of_week', [id]);
    
    res.status(201).json({
      ...schedule,
      is_default: Boolean(schedule.is_default),
      rules: savedRules.map(r => ({ ...r, is_active: Boolean(r.is_active) })),
      overrides: []
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/availability/:id - Update schedule
router.put('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const [scheduleRows] = await pool.query('SELECT * FROM availability_schedules WHERE id = ?', [req.params.id]);
    if (scheduleRows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const { name, timezone, rules, overrides } = req.body;

    if (name !== undefined || timezone !== undefined) {
      const dbName = name !== undefined ? name : scheduleRows[0].name;
      const dbTz = timezone !== undefined ? timezone : scheduleRows[0].timezone;
      await pool.execute(`
        UPDATE availability_schedules SET name = ?, timezone = ? WHERE id = ?
      `, [dbName, dbTz, req.params.id]);
    }

    // Replace rules if provided
    if (rules) {
      await pool.execute('DELETE FROM availability_rules WHERE schedule_id = ?', [req.params.id]);
      for (const rule of rules) {
        await pool.execute(`
          INSERT INTO availability_rules (id, schedule_id, day_of_week, start_time, end_time, is_active)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), req.params.id, rule.day_of_week, rule.start_time, rule.end_time, rule.is_active !== false ? 1 : 0]);
      }
    }

    // Replace overrides if provided
    if (overrides) {
      await pool.execute('DELETE FROM availability_overrides WHERE schedule_id = ?', [req.params.id]);
      for (const ovr of overrides) {
        await pool.execute(`
          INSERT INTO availability_overrides (id, schedule_id, specific_date, start_time, end_time, is_unavailable)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [uuidv4(), req.params.id, ovr.specific_date, ovr.start_time || null, ovr.end_time || null, ovr.is_unavailable ? 1 : 0]);
      }
    }

    const [updatedRows] = await pool.query('SELECT * FROM availability_schedules WHERE id = ?', [req.params.id]);
    const updated = updatedRows[0];
    const [savedRules] = await pool.query('SELECT * FROM availability_rules WHERE schedule_id = ? ORDER BY day_of_week', [req.params.id]);
    const [savedOverrides] = await pool.query('SELECT * FROM availability_overrides WHERE schedule_id = ? ORDER BY specific_date', [req.params.id]);

    res.json({
      ...updated,
      is_default: Boolean(updated.is_default),
      rules: savedRules.map(r => ({ ...r, is_active: Boolean(r.is_active) })),
      overrides: savedOverrides.map(o => ({ ...o, specific_date: o.specific_date.toISOString().split('T')[0], is_unavailable: Boolean(o.is_unavailable) }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/availability/:id/slots?date=YYYY-MM-DD - Get available time slots
router.get('/:id/slots', async (req, res, next) => {
  try {
    const pool = getPool();
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required (YYYY-MM-DD)' });
    }

    const [scheduleRows] = await pool.query('SELECT * FROM availability_schedules WHERE id = ?', [req.params.id]);
    if (scheduleRows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const duration = parseInt(req.query.duration) || 30;
    const bufferBefore = parseInt(req.query.buffer_before) || 0;
    const bufferAfter = parseInt(req.query.buffer_after) || 0;
    const eventTypeId = req.query.event_type_id;

    // Check for date-specific override
    const [overrideRows] = await pool.query(`
      SELECT * FROM availability_overrides 
      WHERE schedule_id = ? AND specific_date = ?
    `, [req.params.id, date]);

    let timeWindows = [];

    if (overrideRows.length > 0) {
      const override = overrideRows[0];
      if (override.is_unavailable) {
        return res.json({ date, slots: [] });
      }
      timeWindows = [{ start_time: override.start_time, end_time: override.end_time }];
    } else {
      const dateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();

      const [rules] = await pool.query(`
        SELECT * FROM availability_rules 
        WHERE schedule_id = ? AND day_of_week = ? AND is_active = 1
      `, [req.params.id, dayOfWeek]);

      if (rules.length === 0) {
        return res.json({ date, slots: [] });
      }
      timeWindows = rules;
    }

    const [userRows] = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userRows[0].id;

    // MySQL strict mode safe LIKE for dates requires properly formatted ranges or matching DATE part
    const [existingBookings] = await pool.query(`
      SELECT b.start_time, b.end_time, et.buffer_before, et.buffer_after
      FROM bookings b
      JOIN event_types et ON b.event_type_id = et.id
      WHERE et.user_id = ? 
      AND b.status = 'confirmed'
      AND b.start_time >= DATE_SUB(?, INTERVAL 1 DAY)
      AND b.start_time <= DATE_ADD(?, INTERVAL 1 DAY)
    `, [userId, date, date]);

    const slots = [];
    const now = new Date();

    for (const window of timeWindows) {
      const [startH, startM] = window.start_time.split(':').map(Number);
      const [endH, endM] = window.end_time.split(':').map(Number);
      
      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (currentMinutes + duration <= endMinutes) {
        const slotStartH = Math.floor(currentMinutes / 60);
        const slotStartM = currentMinutes % 60;
        const slotEndMinutes = currentMinutes + duration;
        const slotEndH = Math.floor(slotEndMinutes / 60);
        const slotEndM = slotEndMinutes % 60;

        const slotStart = `${date}T${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}:00`;
        const slotEnd = `${date}T${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}:00`;

        const slotDateTime = new Date(slotStart);
        if (slotDateTime <= now) {
          currentMinutes += duration;
          continue;
        }

        const hasConflict = existingBookings.some(booking => {
          const bookingStart = new Date(booking.start_time);
          const bookingEnd = new Date(booking.end_time);
          const bBufferBefore = booking.buffer_before || 0;
          const bBufferAfter = booking.buffer_after || 0;

          const blockedStart = new Date(bookingStart.getTime() - bBufferBefore * 60000);
          const blockedEnd = new Date(bookingEnd.getTime() + bBufferAfter * 60000);

          const newSlotStart = new Date(new Date(slotStart).getTime() - bufferBefore * 60000);
          const newSlotEnd = new Date(new Date(slotEnd).getTime() + bufferAfter * 60000);

          return newSlotStart < blockedEnd && newSlotEnd > blockedStart;
        });

        if (!hasConflict) {
          slots.push({
            start_time: slotStart,
            end_time: slotEnd,
            display: formatTime(slotStartH, slotStartM)
          });
        }

        currentMinutes += duration;
      }
    }

    res.json({ date, slots });
  } catch (err) {
    next(err);
  }
});

function formatTime(hours, minutes) {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

export default router;
