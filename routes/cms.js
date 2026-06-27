// routes/cms.js - Customer CMS: read and update their website content

const express    = require('express');
const router     = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

// ─── Safe lazy Supabase init ──────────────────────────────────────────────────
let _supabase = null;
function getClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try { _supabase = createClient(url, key); return _supabase; }
  catch (e) { console.error('CMS Supabase init failed:', e.message); return null; }
}

// Apply auth middleware to ALL CMS routes
router.use(requireAuth);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verify the authenticated user owns the requested website
 */
async function getOwnedWebsite(websiteId, userId) {
  const db = getClient();
  if (!db) return res.status(503).json({ error: "Database not configured. Add Supabase environment variables to Railway." });
  const { data, error } = await db
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .eq('owner_id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Log a CMS edit to the audit table
 */
async function logEdit(websiteId, userId, section, oldVal, newVal) {
  await supabase.from('cms_edits').insert([{
    website_id: websiteId,
    owner_id:   userId,
    section:    section,
    old_value:  oldVal,
    new_value:  newVal
  }]).catch(console.warn); // Non-blocking
}

// ─── GET /api/cms/my-websites ─────────────────────────────────────────────────
// List all websites owned by this user
router.get('/my-websites', async (req, res) => {
  try {
    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .select('id, business_name, slug, category, template, plan, payment_status, status, created_at')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, websites: data || [] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/cms/:websiteId ──────────────────────────────────────────────────
// Get full website data for editing
router.get('/:websiteId', async (req, res) => {
  try {
    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    res.json({ success: true, website });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/cms/:websiteId/hero ──────────────────────────────────────────
// Update hero section: heroTitle, heroSubtitle
router.patch('/:websiteId/hero', async (req, res) => {
  try {
    const { heroTitle, heroSubtitle } = req.body;
    if (!heroTitle?.trim()) return res.status(400).json({ error: 'heroTitle is required' });

    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const oldContent = website.content_json;
    const newContent = {
      ...oldContent,
      heroTitle:    heroTitle.trim(),
      heroSubtitle: heroSubtitle?.trim() || oldContent.heroSubtitle
    };

    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .update({ content_json: newContent })
      .eq('id', req.params.websiteId)
      .select()
      .single();

    if (error) throw error;

    await logEdit(req.params.websiteId, req.user.id, 'hero',
      { heroTitle: oldContent.heroTitle, heroSubtitle: oldContent.heroSubtitle },
      { heroTitle, heroSubtitle }
    );

    res.json({ success: true, content: data.content_json });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/cms/:websiteId/about ─────────────────────────────────────────
// Update about section: aboutTitle, aboutDescription
router.patch('/:websiteId/about', async (req, res) => {
  try {
    const { aboutTitle, aboutDescription } = req.body;
    if (!aboutTitle?.trim()) return res.status(400).json({ error: 'aboutTitle is required' });

    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const oldContent = website.content_json;
    const newContent = {
      ...oldContent,
      aboutTitle:       aboutTitle.trim(),
      aboutDescription: aboutDescription?.trim() || oldContent.aboutDescription
    };

    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .update({ content_json: newContent })
      .eq('id', req.params.websiteId)
      .select()
      .single();

    if (error) throw error;
    await logEdit(req.params.websiteId, req.user.id, 'about', oldContent, newContent);
    res.json({ success: true, content: data.content_json });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/cms/:websiteId/services ─────────────────────────────────────────
// Replace entire services array
router.put('/:websiteId/services', async (req, res) => {
  try {
    const { services } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'services must be a non-empty array' });
    }
    for (const s of services) {
      if (!s.title?.trim() || !s.description?.trim()) {
        return res.status(400).json({ error: 'Each service needs a title and description' });
      }
    }

    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const oldContent = website.content_json;
    const cleanServices = services.map(s => ({
      title:       s.title.trim(),
      description: s.description.trim()
    }));

    const newContent = { ...oldContent, services: cleanServices };
    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .update({ content_json: newContent })
      .eq('id', req.params.websiteId)
      .select()
      .single();

    if (error) throw error;
    await logEdit(req.params.websiteId, req.user.id, 'services', oldContent.services, cleanServices);
    res.json({ success: true, content: data.content_json });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/cms/:websiteId/faq ──────────────────────────────────────────────
// Replace entire FAQ array
router.put('/:websiteId/faq', async (req, res) => {
  try {
    const { faq } = req.body;

    if (!Array.isArray(faq) || faq.length === 0) {
      return res.status(400).json({ error: 'faq must be a non-empty array' });
    }
    for (const f of faq) {
      if (!f.question?.trim() || !f.answer?.trim()) {
        return res.status(400).json({ error: 'Each FAQ needs a question and answer' });
      }
    }

    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const oldContent = website.content_json;
    const cleanFaq = faq.map(f => ({
      question: f.question.trim(),
      answer:   f.answer.trim()
    }));

    const newContent = { ...oldContent, faq: cleanFaq };
    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .update({ content_json: newContent })
      .eq('id', req.params.websiteId)
      .select()
      .single();

    if (error) throw error;
    await logEdit(req.params.websiteId, req.user.id, 'faq', oldContent.faq, cleanFaq);
    res.json({ success: true, content: data.content_json });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/cms/:websiteId/contact ────────────────────────────────────────
// Update contact info: phone, email, address
router.patch('/:websiteId/contact', async (req, res) => {
  try {
    const { phone, email, address } = req.body;
    if (!phone?.trim()) return res.status(400).json({ error: 'Phone number is required' });

    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .update({
        phone:   phone.trim(),
        email:   email?.trim()   || website.email   || '',
        address: address?.trim() || website.address || ''
      })
      .eq('id', req.params.websiteId)
      .select()
      .single();

    if (error) throw error;
    await logEdit(req.params.websiteId, req.user.id, 'contact',
      { phone: website.phone, email: website.email, address: website.address },
      { phone, email, address }
    );
    res.json({ success: true, website: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/cms/:websiteId/branding ──────────────────────────────────────
// Update business name + logo URL
router.patch('/:websiteId/branding', async (req, res) => {
  try {
    const { businessName, logoUrl } = req.body;
    if (!businessName?.trim()) return res.status(400).json({ error: 'Business name is required' });

    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .update({
        business_name: businessName.trim(),
        logo_url:      logoUrl?.trim() || website.logo_url || ''
      })
      .eq('id', req.params.websiteId)
      .select()
      .single();

    if (error) throw error;
    await logEdit(req.params.websiteId, req.user.id, 'branding',
      { business_name: website.business_name, logo_url: website.logo_url },
      { businessName, logoUrl }
    );
    res.json({ success: true, website: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/cms/:websiteId/seo ────────────────────────────────────────────
// Update SEO fields in content_json
router.patch('/:websiteId/seo', async (req, res) => {
  try {
    const { seoTitle, seoDescription, ctaTitle, ctaText } = req.body;

    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const oldContent = website.content_json;
    const newContent = {
      ...oldContent,
      seoTitle:       seoTitle?.trim()       || oldContent.seoTitle,
      seoDescription: seoDescription?.trim() || oldContent.seoDescription,
      ctaTitle:       ctaTitle?.trim()       || oldContent.ctaTitle,
      ctaText:        ctaText?.trim()        || oldContent.ctaText
    };

    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('websites')
      .update({ content_json: newContent })
      .eq('id', req.params.websiteId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, content: data.content_json });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/cms/:websiteId/history ─────────────────────────────────────────
// Get recent edit history for a website
router.get('/:websiteId/history', async (req, res) => {
  try {
    const website = await getOwnedWebsite(req.params.websiteId, req.user.id);
    if (!website) return res.status(404).json({ error: 'Website not found or access denied' });

    const db = getClient();
  if (!db) throw new Error("Database not configured");
  const { data, error } = await db
      .from('cms_edits')
      .select('id, section, created_at')
      .eq('website_id', req.params.websiteId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ success: true, history: data || [] });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
