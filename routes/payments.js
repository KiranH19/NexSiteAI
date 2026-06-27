// routes/payments.js - Razorpay order creation and verification

const express = require('express');
const router  = express.Router();

const { createOrder, verifyPayment, getPlanConfig } = require('../services/razorpayService');
const {
  createPaymentRecord, updatePaymentRecord,
  createWebsite, getSession, updateWebsiteStatus,
  createSubscription
} = require('../services/supabaseService');
const { generateSlug } = require('../utils/slugify');

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for the selected plan
 */
router.post('/create-order', async (req, res) => {
  try {
    const { plan, sessionId } = req.body;

    if (!plan || !sessionId) {
      return res.status(400).json({ error: 'plan and sessionId are required' });
    }

    if (!['starter', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Choose starter or premium.' });
    }

    // Create Razorpay order
    const order = await createOrder(plan, sessionId);

    // Store pending payment record (no websiteId yet – website created after payment)
    await createPaymentRecord({
      website_id:         null,
      razorpay_order_id:  order.orderId,
      amount:             order.amount,
      currency:           order.currency,
      status:             'pending'
    });

    res.json({
      success:    true,
      orderId:    order.orderId,
      amount:     order.amount,
      currency:   order.currency,
      planName:   order.planName,
      keyId:      order.keyId,
      sessionId:  sessionId,
      plan:       plan
    });

  } catch (err) {
    console.error('❌ Order create error:', err.message);
    res.status(500).json({ error: 'Order creation failed', details: err.message });
  }
});

/**
 * POST /api/payments/verify
 * Verify payment signature, publish website, store records
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sessionId,
      plan,
      template
    } = req.body;

    // Verify all fields present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    // Verify signature
    const isValid = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      // Update payment record as failed
      await updatePaymentRecord(razorpay_order_id, { status: 'failed' });
      return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
    }

    // ── Get session data to create website ───────────────────────────────────
    const session = await getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const bd = session.business_data;
    const slug = generateSlug(bd.businessName);

    // ── Create website record ────────────────────────────────────────────────
    const { createWebsite: createWebsiteFn } = require('../services/supabaseService');
    const website = await createWebsiteFn({
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
      payment_status: 'paid',
      status:         'published',
      owner_id:       session.owner_id || null
    });

    // ── Update payment record ────────────────────────────────────────────────
    await updatePaymentRecord(razorpay_order_id, {
      website_id:           website.id,
      razorpay_payment_id:  razorpay_payment_id,
      razorpay_signature:   razorpay_signature,
      status:               'paid'
    });

    // ── Create subscription record ───────────────────────────────────────────
    const planConfig = getPlanConfig(plan);
    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 1);

    await createSubscription({
      website_id:    website.id,
      plan:          plan,
      amount:        planConfig.monthlyAmount,
      billing_cycle: 'monthly',
      status:        'active',
      next_due_date: nextDue.toISOString().split('T')[0]
    });

    const publicUrl = `${process.env.FRONTEND_URL || ''}/site.html?slug=${slug}`;

    console.log(`✅ Payment verified & website published: ${slug}`);

    res.json({
      success:   true,
      verified:  true,
      websiteId: website.id,
      slug:      slug,
      publicUrl: publicUrl
    });

  } catch (err) {
    console.error('❌ Payment verify error:', err.message);
    res.status(500).json({ error: 'Payment verification failed', details: err.message });
  }
});

/**
 * GET /api/payments/plans
 * Get available plan details (for frontend)
 */
router.get('/plans', (req, res) => {
  const { getAllPlans } = require('../services/razorpayService');
  res.json({ success: true, plans: getAllPlans() });
});

module.exports = router;
