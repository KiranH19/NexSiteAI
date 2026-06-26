const express = require('express');
const razorpayService = require('../services/razorpayService');
const supabaseService = require('../services/supabaseService');
const slugify = require('../utils/slugify');

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Initiates a Razorpay order based on the selected plan.
 * Expects in body: { plan, sessionId }
 */
router.post('/create-order', async (req, res) => {
  try {
    const { plan, sessionId } = req.body;

    if (!plan || !sessionId) {
      return res.status(400).json({ success: false, message: 'Plan and Session ID are required.' });
    }

    // Determine amount based on plan
    // Starter: ₹299 setup fee
    // Premium: ₹999 setup fee
    let amount = 0;
    if (plan === 'starter') {
      amount = 299;
    } else if (plan === 'premium') {
      amount = 999;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid plan selected.' });
    }

    const receipt = `rcpt_${sessionId.substring(0, 10)}_${Date.now()}`;
    const order = await razorpayService.createOrder(amount, receipt);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature. If valid, registers the user, publishes the website, and logs payment.
 * Expects in body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId, plan, template, email, password, token }
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sessionId,
      plan,
      template,
      email,
      password,
      token
    } = req.body;

    // 1. Verify Payment Signature
    const isVerified = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isVerified) {
      console.warn('❌ Payment verification failed for Order ID:', razorpay_order_id);
      return res.json({ success: false, verified: false, message: 'Invalid payment signature.' });
    }

    console.log('✅ Payment verified successfully for Order ID:', razorpay_order_id);

    // 2. Fetch the AI generation details
    const { data: session, error: sessError } = await supabaseService.getSessionById(sessionId);
    if (sessError || !session) {
      return res.status(404).json({ success: false, message: 'AI session not found.' });
    }

    // 3. User Authentication / Sign up
    let userId = null;
    let userEmail = email;

    if (token) {
      const { data, error: tokenErr } = await supabaseService.verifyUserToken(token);
      if (!tokenErr && data.user) {
        userId = data.user.id;
        userEmail = data.user.email;
      }
    }

    // Register user if email/password given and not logged in
    if (!userId && email && password) {
      if (supabaseService.isMock) {
        const authData = await supabaseService.mockSignupOrLogin(email, password);
        userId = authData.user.id;
        userEmail = authData.user.email;
      } else {
        const { data: authData, error: signupErr } = await supabaseService.client.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (signupErr) {
          if (signupErr.message.includes('already registered')) {
            return res.status(409).json({
              success: false,
              code: 'USER_EXISTS',
              message: 'Account already exists. Please log in first and retry.'
            });
          }
          return res.status(500).json({ success: false, message: `Sign up failed: ${signupErr.message}` });
        }
        userId = authData.user.id;
      }
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'A user login or registration is required to save and publish your site.'
      });
    }

    // 4. Generate URL slug
    const baseSlug = slugify(session.business_data.name);
    let finalSlug = baseSlug;
    const { data: existingSite } = await supabaseService.getWebsiteBySlug(finalSlug);
    if (existingSite) {
      finalSlug = slugify(session.business_data.name, true);
    }

    // 5. Create the website record as published & paid
    const { data: website, error: createSiteErr } = await supabaseService.createWebsite({
      user_id: userId,
      business_name: session.business_data.name,
      slug: finalSlug,
      category: session.business_data.category,
      template: template || 'business',
      design_style: session.business_data.designStyle || 'modern',
      content_json: session.generated_content,
      phone: session.business_data.phone,
      email: session.business_data.email,
      address: session.business_data.address,
      logo_url: session.business_data.logoUrl || '',
      plan: plan,
      payment_status: 'paid',
      status: 'published'
    });

    if (createSiteErr) {
      console.error('Error creating paid website:', createSiteErr);
      return res.status(500).json({ success: false, message: 'Failed to publish website after payment.' });
    }

    // 6. Record the transaction in the payments table
    let amountCharged = plan === 'premium' ? 99900 : 29900; // in paise
    await supabaseService.createPayment({
      website_id: website.id,
      user_id: userId,
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id || 'mock_pay_id',
      razorpay_signature: razorpay_signature || 'mock_sig',
      amount: amountCharged,
      currency: 'INR',
      status: 'success'
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    res.json({
      success: true,
      verified: true,
      websiteId: website.id,
      slug: finalSlug,
      publicUrl: `${frontendUrl}/site.html?slug=${finalSlug}`
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Internal error during payment verification.' });
  }
});

module.exports = router;
