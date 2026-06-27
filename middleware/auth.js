// middleware/auth.js - Verify Supabase JWT token on protected CMS routes

const { createClient } = require('@supabase/supabase-js');

// ─── Safe lazy init ───────────────────────────────────────────────────────────
let _supabaseAnon = null;

function getAnonClient() {
  if (_supabaseAnon) return _supabaseAnon;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    _supabaseAnon = createClient(url, key);
    return _supabaseAnon;
  } catch (err) {
    console.error('❌ Auth client init failed:', err.message);
    return null;
  }
}

/**
 * requireAuth middleware
 * Expects: Authorization: Bearer <supabase_access_token>
 * Attaches req.user = { id, email } if valid
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const db = getAnonClient();

  // If Supabase not configured, allow mock auth (dev/test only)
  if (!db) {
    console.warn('⚠️  Auth running in mock mode — Supabase not configured');
    req.user = { id: 'mock-user-id', email: 'dev@nexsite.in' };
    return next();
  }

  try {
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Auth verification failed.' });
  }
}

module.exports = { requireAuth };
