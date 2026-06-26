const express = require('express');
const supabaseService = require('../services/supabaseService');

const router = express.Router();

// Middleware to authenticate and verify user is an Administrator
async function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  const { data, error } = await supabaseService.verifyUserToken(token);

  if (error || !data.user) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
  }

  const user = data.user;
  const isAdmin = user.user_metadata && user.user_metadata.role === 'admin';
  const isDefaultAdminEmail = user.email && (user.email === 'admin@nexsite.com' || (process.env.ADMIN_EMAILS && process.env.ADMIN_EMAILS.split(',').includes(user.email)));

  if (!isAdmin && !isDefaultAdminEmail) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }

  req.user = user;
  next();
}

/**
 * GET /api/admin/stats
 * Aggregates site metrics, lead counts, paid invoices, and revenue totals.
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const { data: websites } = await supabaseService.getAllWebsites();
    const { data: leads } = await supabaseService.getAllLeads();
    const { data: payments } = await supabaseService.getAllPayments();

    const totalSites = websites ? websites.length : 0;
    const totalLeads = leads ? leads.length : 0;

    const paidSites = websites ? websites.filter(w => w.payment_status === 'paid').length : 0;
    const pendingSites = websites ? websites.filter(w => w.payment_status === 'pending').length : 0;

    // Calculate total revenue from successful payments (amount in paise, convert to INR)
    let totalRevenue = 0;
    if (payments) {
      totalRevenue = payments
        .filter(p => p.status === 'success')
        .reduce((sum, p) => sum + (p.amount / 100), 0);
    }

    res.json({
      success: true,
      stats: {
        totalSites,
        totalLeads,
        paidSites,
        pendingSites,
        totalRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve administrative statistics.' });
  }
});

/**
 * GET /api/admin/websites
 * Lists all generated websites inside the platform.
 */
router.get('/websites', authenticateAdmin, async (req, res) => {
  try {
    const { data: websites, error } = await supabaseService.getAllWebsites();
    if (error) throw error;
    res.json({ success: true, websites });
  } catch (error) {
    console.error('Error fetching admin websites:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve website directories.' });
  }
});

/**
 * GET /api/admin/leads
 * Lists all form submissions across the platform.
 */
router.get('/leads', authenticateAdmin, async (req, res) => {
  try {
    const { data: leads, error } = await supabaseService.getAllLeads();
    if (error) throw error;
    res.json({ success: true, leads });
  } catch (error) {
    console.error('Error fetching admin leads:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve leads directories.' });
  }
});

/**
 * GET /api/admin/payments
 * Lists all recorded transactions.
 */
router.get('/payments', authenticateAdmin, async (req, res) => {
  try {
    const { data: payments, error } = await supabaseService.getAllPayments();
    if (error) throw error;
    res.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payments history.' });
  }
});

module.exports = router;
 // Export for custom endpoints if needed
module.exports = {
  router,
  authenticateAdmin
};
