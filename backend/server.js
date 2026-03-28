import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/database.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import usersRouter from './routes/users.js';
import eventTypesRouter from './routes/eventTypes.js';
import availabilityRouter from './routes/availability.js';
import bookingsRouter from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite default port
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/event-types', eventTypesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all route to serve React app for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handler
app.use(errorHandler);

// Initialize DB then start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Calendly Clone API running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });

export default app;
