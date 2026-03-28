import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;

async function initDb() {
  if (pool) return pool;

  if (process.env.DATABASE_URL) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      timezone: 'Z',
      ssl: { rejectUnauthorized: true } // Required for TiDB Serverless
    });
  } else {
    // Local fallback
    const initConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      timezone: 'Z'
    });

    const dbName = process.env.DB_NAME || 'calendly';
    await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await initConnection.end();

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      timezone: 'Z',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });
  }

  // Run schema
  const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await pool.query(schema);

  // Seed default data
  await seedDefaultData();

  return pool;
}

function getPool() {
  if (!pool) throw new Error('Database pool not initialized');
  return pool;
}

async function seedDefaultData() {
  const [rows] = await pool.query('SELECT id FROM users LIMIT 1');
  if (rows.length > 0) return; // Already seeded

  const userId = uuidv4();
  const scheduleId = uuidv4();

  await pool.execute(`
    INSERT INTO users (id, name, email, username, timezone)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, 'Sahil Goyal', 'sahil@example.com', 'sahil-goyal', 'Asia/Kolkata']);

  await pool.execute(`
    INSERT INTO availability_schedules (id, user_id, name, timezone, is_default)
    VALUES (?, ?, ?, ?, ?)
  `, [scheduleId, userId, 'Working Hours', 'Asia/Kolkata', 1]);

  const days = [1, 2, 3, 4, 5]; // Mon-Fri
  for (const day of days) {
    await pool.execute(`
      INSERT INTO availability_rules (id, schedule_id, day_of_week, start_time, end_time, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [uuidv4(), scheduleId, day, '09:00', '17:00', 1]);
  }

  const eventTypes = [
    { name: '15 Minute Meeting', slug: '15min', duration: 15, color: '#0069ff', description: 'A quick 15-minute meeting.' },
    { name: '30 Minute Meeting', slug: '30min', duration: 30, color: '#7B2FFE', description: 'A standard 30-minute meeting.' },
    { name: '60 Minute Meeting', slug: '60min', duration: 60, color: '#FF5733', description: 'An extended 60-minute meeting.' }
  ];

  for (const et of eventTypes) {
    await pool.execute(`
      INSERT INTO event_types (id, user_id, name, slug, description, duration, color, schedule_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [uuidv4(), userId, et.name, et.slug, et.description, et.duration, et.color, scheduleId]);
  }
}

export { initDb, getPool };
