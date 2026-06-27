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

    console.log(`🤖 Generating content for: ${businessData.businessName}`);

    // ── Generate content via Grok ────────────────────────────────────────────
    const generatedContent = await generateWebsiteContent(businessData);

    // ── Optionally capture owner from auth header (if user is logged in) ────
    let ownerId = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
        if (user) ownerId = user.id;
      } catch (_) {}
    }

    // ── Save session to Supabase ─────────────────────────────────────────────
    const session = await createSession(businessData, generatedContent, 'business', ownerId);

    console.log(`✅ Generated & saved session: ${session.id}`);

    res.json({
      success:          true,
      sessionId:        session.id,
      generatedContent: generatedContent,
      businessData:     businessData
    });

  } catch (err) {
    console.error('❌ Generation error:', err.message);
    res.status(500).json({
      error:   'Content generation failed',
      details: err.message
    });
  }
});

module.exports = router;
