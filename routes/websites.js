// routes/websites.js - Website management endpoints

const express = require('express');
const router  = express.Router();

const {
  getSession, updateSessionTemplate,
  createWebsite, getWebsiteBySlug, getWebsiteById, getAllWebsites
} = require('../services/supabaseService');
const { generateSlug } = require('../utils/slugify');

/**
 * POST /api/websites/publish
 * Publish a website after payment. Creates website record.
 */
router.post('/publish', async (req, res) => {
  try {
    const { sessionId, template, plan, paymentId, websiteId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // Get session data
    const session = await getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const bd = session.business_data; // business data shorthand

    // Generate unique slug from business name
    const slug = generateSlug(bd.businessName);

    // Build website record
    const websiteData = {
      business_name:  bd.businessName,
      slug:           slug,
      category:       bd.category,
      template:       template || session.selected_template || 'business',
      design_style:   bd.designStyle || 'modern',
      content_json:   session.generated_content,
      phone:          bd.phone,
      email:          bd.email     || '',
      address:        bd.address   || '',
      logo_url:       bd.logoUrl   || '',
      plan:           plan || 'starter',
      payment_status: paymentId ? 'paid' : 'pending',
      status:         paymentId ? 'published' : 'draft'
    };

    // Create website in Supabase
    const website = await createWebsite(websiteData);

    const publicUrl = `${process.env.FRONTEND_URL || ''}/site.html?slug=${slug}`;

    console.log(`✅ Website published: ${slug}`);

    res.json({
      success:   true,
      websiteId: website.id,
      slug:      slug,
      publicUrl: publicUrl,
      website:   website
    });

  } catch (err) {
    console.error('❌ Publish error:', err.message);
    res.status(500).json({ error: 'Publish failed', details: err.message });
  }
});

/**
 * GET /api/websites/:slug
 * Get a published website by slug (for public rendering)
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const website = await getWebsiteBySlug(slug);

    if (!website) {
      return res.status(404).json({ error: 'Website not found or not published' });
    }

    res.json({ success: true, website });

  } catch (err) {
    console.error('❌ Get website error:', err.message);
    res.status(500).json({ error: 'Failed to fetch website', details: err.message });
  }
});

/**
 * GET /api/websites/id/:id
 * Get any website by ID (used internally)
 */
router.get('/id/:id', async (req, res) => {
  try {
    const website = await getWebsiteById(req.params.id);
    if (!website) return res.status(404).json({ error: 'Website not found' });
    res.json({ success: true, website });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/websites/:id/template
 * Update selected template for a session
 */
router.patch('/session/:sessionId/template', async (req, res) => {
  try {
    const { template } = req.body;
    const session = await updateSessionTemplate(req.params.sessionId, template);
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
