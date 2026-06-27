// routes/leads.js - Lead capture from published websites

const express = require('express');
const router  = express.Router();

const { createLead, getLeadsByWebsite, getWebsiteById } = require('../services/supabaseService');

/**
 * POST /api/leads
 * Save a lead submitted from a customer's website
 */
router.post('/', async (req, res) => {
  try {
    const { websiteId, name, phone, email, message } = req.body;

    // Validate required fields
    if (!websiteId || !name) {
      return res.status(400).json({ error: 'websiteId and name are required' });
    }

    // Verify website exists
    const website = await getWebsiteById(websiteId);
    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    // Save lead
    const lead = await createLead({
      website_id: websiteId,
      name:       name.trim(),
      phone:      phone?.trim() || null,
      email:      email?.trim() || null,
      message:    message?.trim() || null
    });

    console.log(`📞 New lead for ${website.business_name}: ${name}`);

    res.json({ success: true, leadId: lead.id, message: 'Lead saved successfully' });

  } catch (err) {
    console.error('❌ Lead save error:', err.message);
    res.status(500).json({ error: 'Failed to save lead', details: err.message });
  }
});

/**
 * GET /api/leads/:websiteId
 * Get all leads for a specific website
 */
router.get('/:websiteId', async (req, res) => {
  try {
    const leads = await getLeadsByWebsite(req.params.websiteId);
    res.json({ success: true, leads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
