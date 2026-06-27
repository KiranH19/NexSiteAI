// routes/ai.js - AI content generation endpoint

const express = require('express');
const router  = express.Router();

const { generateWebsiteContent } = require('../services/grokService');
const { createSession }          = require('../services/supabaseService');

/**
 * POST /api/generate
 * Receives business data, calls Grok, saves session, returns content
 */
router.post('/', async (req, res) => {
  try {
    const { businessData } = req.body;

    // ── Validate input ───────────────────────────────────────────────────────
    if (!businessData) {
      return res.status(400).json({ error: 'businessData is required' });
    }

    const required = ['businessName', 'category', 'description', 'phone'];
    for (const field of required) {
      if (!businessData[field]?.trim()) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // ── Check Grok API key before attempting ─────────────────────────────────
    if (!process.env.GROK_API_KEY) {
      console.error('❌ GROK_API_KEY is not set in environment variables');
      return res.status(503).json({
        error:   'AI service not configured',
        details: 'GROK_API_KEY environment variable is missing. Please add it in your Railway dashboard.'
      });
    }

    console.log(`🤖 Generating content for: ${businessData.businessName}`);

    // ── Generate content via Grok ────────────────────────────────────────────
    const generatedContent = await generateWebsiteContent(businessData);

    // ── Optionally capture owner from auth header (if user is logged in) ────
    let ownerId = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ') && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
        if (user) ownerId = user.id;
      } catch (_) {
        // Non-fatal — just skip owner linking
      }
    }

    // ── Save session to Supabase (or mock if not configured) ─────────────────
    const session = await createSession(businessData, generatedContent, 'business', ownerId);

    console.log(`✅ Generated & saved session: ${session.id}`);

    res.json({
      success:          true,
      sessionId:        session.id,
      generatedContent: generatedContent,
      businessData:     businessData
    });

  } catch (err) {
    // Log the FULL error so Railway logs show the real cause
    console.error('❌ Generation error:', err.message);
    console.error('❌ Full stack:', err.stack);

    // Return specific error details to help debug
    res.status(500).json({
      error:   err.message || 'Content generation failed',
      details: err.message
    });
  }
});

module.exports = router;
