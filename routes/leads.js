const express = require('express');
const supabaseService = require('../services/supabaseService');

const router = express.Router();

/**
 * POST /api/leads
 * Saves a contact form lead submitted on a generated customer website.
 * Public endpoint.
 * Expects in body: { websiteId, name, phone, email, message }
 */
router.post('/', async (req, res) => {
  try {
    const { websiteId, name, phone, email, message } = req.body;

    if (!websiteId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Website ID, name, and email are required fields.'
      });
    }

    // Save lead record in database
    const { data: newLead, error } = await supabaseService.createLead({
      website_id: websiteId,
      name,
      phone: phone || '',
      email,
      message: message || ''
    });

    if (error) {
      console.error('Error saving lead to database:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit form. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Thank you! Your submission has been sent successfully.',
      leadId: newLead.id
    });

  } catch (error) {
    console.error('API /leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while processing contact form.'
    });
  }
});

module.exports = router;
