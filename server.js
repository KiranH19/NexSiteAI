// server.js - NexSite Backend Entry Point
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 generations per IP
  message: { error: 'Too many generation requests. Please try again after 15 minutes.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please slow down.' }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const aiRoutes       = require('./routes/ai');
const websiteRoutes  = require('./routes/websites');
const leadRoutes     = require('./routes/leads');
const paymentRoutes  = require('./routes/payments');
const adminRoutes    = require('./routes/admin');
const authRoutes     = require('./routes/auth');
const cmsRoutes      = require('./routes/cms');

app.use('/api/generate',  generateLimiter, aiRoutes);
app.use('/api/websites',  apiLimiter,      websiteRoutes);
app.use('/api/leads',     apiLimiter,      leadRoutes);
app.use('/api/payments',  apiLimiter,      paymentRoutes);
app.use('/api/admin',     apiLimiter,      adminRoutes);
app.use('/api/auth',      apiLimiter,      authRoutes);
app.use('/api/cms',       apiLimiter,      cmsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'NexSite', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ─── Config Check — visit this URL to see which env vars are missing ──────────
app.get('/api/health/config', (req, res) => {
  const vars = {
    SUPABASE_URL:              !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY:         !!process.env.SUPABASE_ANON_KEY,
    GROK_API_KEY:              !!process.env.GROK_API_KEY,
    GROK_API_URL:              process.env.GROK_API_URL   || 'default',
    GROK_MODEL:                process.env.GROK_MODEL     || 'grok-3-latest (default)',
    RAZORPAY_KEY_ID:           !!process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET:       !!process.env.RAZORPAY_KEY_SECRET,
    FRONTEND_URL:              process.env.FRONTEND_URL   || 'not set',
    PORT:                      process.env.PORT           || '5000 (default)',
  };
  const missing = Object.entries(vars).filter(([k,v]) => v === false).map(([k]) => k);
  res.json({ status: missing.length === 0 ? 'all configured' : 'missing variables', missing, config: vars });
});

// ─── Frontend SPA Fallback ────────────────────────────────────────────────────
app.get('*', (req, res) => {
  // Allow API routes to 404 normally
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 NexSite server running on http://localhost:${PORT}`);
  console.log(`📂 Frontend served at http://localhost:${PORT}`);
  console.log(`🔌 API available at http://localhost:${PORT}/api\n`);
});

module.exports = app;
