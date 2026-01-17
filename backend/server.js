/**
 * JARVIS Backend Server
 * Express API with Groq LLM integration
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'JARVIS Backend is running', timestamp: new Date() });
});

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║        🤖 JARVIS Backend Server          ║
║              Running on Port              ║
║              ${PORT}                          ║
╚═══════════════════════════════════════════╝

📍 Local:   http://localhost:${PORT}
📍 Health:  http://localhost:${PORT}/health
📍 API:     http://localhost:${PORT}/api

Ready to handle requests...
  `);
});

export default app;
