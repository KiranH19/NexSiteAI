// routes/admin.js - Admin dashboard data endpoints

const express = require('express');
const router  = express.Router();

const {
  getAllWebsites, getAllLeads, getAdminStats
} = require('../services/supabaseService');

/**
 * GET /api/admin/websites
 * Return all websites (for admin dashboard)
 */
router.get('/websites', async (req, res) => {
  try {
    const websites = await getAllWebsites();
    res.json({ success: true, websites });
  } catch (err) {
    console.error('❌ Admin websites error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/leads
 * Return all leads with website info
 */
router.get('/leads', async (req, res) => {
  try {
    const leads = await getAllLeads();
    res.json({ success: true, leads });
  } catch (err) {
    console.error('❌ Admin leads error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/stats
 * Return high-level stats for dashboard cards
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json({ success: true, stats });
  } catch (err) {
    console.error('❌ Admin stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
