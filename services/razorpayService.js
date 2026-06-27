// services/razorpayService.js - Razorpay order creation and verification

const Razorpay = require('razorpay');
const crypto   = require('crypto');

// Plan pricing config (amounts in paise = INR * 100)
const PLANS = {
  starter: {
    name:          'Starter Plan',
    setupAmount:   29900,  // ₹299
    monthlyAmount: 5900,   // ₹59
    currency:      'INR'
  },
  premium: {
    name:          'Premium Plan',
    setupAmount:   99900,  // ₹999
    monthlyAmount: 9900,   // ₹99
    currency:      'INR'
  }
};

/**
 * Get Razorpay instance (lazy init so missing keys don't crash on startup)
 */
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

/**
 * Create a Razorpay order for a given plan
 * @param {string} plan - 'starter' or 'premium'
 * @param {string} sessionId - generation session ID for receipt
 * @returns {object} Razorpay order object
 */
async function createOrder(plan, sessionId) {
  const planConfig = PLANS[plan];
  if (!planConfig) throw new Error(`Unknown plan: ${plan}`);

  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount:   planConfig.setupAmount,
    currency: planConfig.currency,
    receipt:  `nexsite_${sessionId?.substring(0, 8)}_${Date.now()}`,
    notes: {
      plan:      plan,
      sessionId: sessionId,
      app:       'NexSite'
    }
  });

  return {
    orderId:   order.id,
    amount:    order.amount,
    currency:  order.currency,
    planName:  planConfig.name,
    keyId:     process.env.RAZORPAY_KEY_ID
  };
}

/**
 * Verify Razorpay payment signature
 * @returns {boolean}
 */
function verifyPayment(orderId, paymentId, signature) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay secret not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Get plan config by name
 */
function getPlanConfig(plan) {
  return PLANS[plan] || null;
}

/**
 * Get all plan configs (for frontend display)
 */
function getAllPlans() {
  return PLANS;
}

module.exports = { createOrder, verifyPayment, getPlanConfig, getAllPlans };
