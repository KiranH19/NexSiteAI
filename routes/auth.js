// routes/auth.js - Supabase Email+Password Auth endpoints

const express = require('express');
const router  = express.Router();
const { createClient } = require('@supabase/supabase-js');

// ─── Safe lazy init ───────────────────────────────────────────────────────────
let _supabase = null;

function getClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    _supabase = createClient(url, key);
    return _supabase;
  } catch (err) {
    console.error('❌ Auth route Supabase init failed:', err.message);
    return null;
  }
}

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 6)  return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const db = getClient();
    if (!db) return res.status(503).json({ error: 'Auth service not configured. Please add Supabase environment variables.' });

    const { data, error } = await db.auth.signUp({
      email:    email.trim().toLowerCase(),
      password: password,
      options:  { data: { full_name: fullName || '' } }
    });
    if (error) return res.status(400).json({ error: error.message });

    res.json({
      success: true,
      message: 'Account created. Please check your email to confirm your account.',
      user: { id: data.user?.id, email: data.user?.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const db = getClient();
    if (!db) return res.status(503).json({ error: 'Auth service not configured. Please add Supabase environment variables.' });

    const { data, error } = await db.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: password
    });
    if (error) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      success:      true,
      accessToken:  data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id:       data.user.id,
        email:    data.user.email,
        fullName: data.user.user_metadata?.full_name || ''
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    const db = getClient();
    if (!db) return res.status(503).json({ error: 'Auth service not configured.' });

    const { data, error } = await db.auth.refreshSession({ refresh_token: refreshToken });
    if (error) return res.status(401).json({ error: 'Session refresh failed. Please log in again.' });

    res.json({
      success:      true,
      accessToken:  data.session.access_token,
      refreshToken: data.session.refresh_token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const db = getClient();
    if (db) await db.auth.signOut();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.json({ success: true });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const db = getClient();
    if (!db) return res.status(503).json({ error: 'Auth service not configured.' });

    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid token' });

    res.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.user_metadata?.full_name || '' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
