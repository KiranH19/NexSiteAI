const Razorpay = require('razorpay');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpay = null;
let isMock = false;

if (keyId && keySecret) {
  try {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('✅ Razorpay Payment Gateway initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay SDK:', error.message);
    isMock = true;
  }
} else {
  console.warn('⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not configured. Running in MOCK PAYMENT mode.');
  isMock = true;
}

class RazorpayService {
  constructor() {
    this.isMock = isMock;
    this.keyId = keyId || 'mock_razorpay_key_id_123';
  }

  /**
   * Creates a Razorpay Order.
   * 
   * @param {number} amount - Amount in INR (e.g. 299 for ₹299)
   * @param {string} receipt - Receipt reference identifier
   * @returns {Promise<object>} The order details
   */
  async createOrder(amount, receipt) {
    // Razorpay amounts are in paise (e.g. ₹299 = 29900 paise)
    const amountInPaise = Math.round(amount * 100);

    if (isMock) {
      const mockOrder = {
        id: 'order_' + Math.random().toString(36).substring(2, 16),
        entity: 'order',
        amount: amountInPaise,
        amount_paid: 0,
        amount_due: amountInPaise,
        currency: 'INR',
        receipt: receipt,
        status: 'created',
        created_at: Math.floor(Date.now() / 1000),
        isMock: true
      };
      return mockOrder;
    }

    return new Promise((resolve, reject) => {
      razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt,
        payment_capture: 1
      }, (err, order) => {
        if (err) return reject(err);
        resolve(order);
      });
    });
  }

  /**
   * Verifies the Razorpay payment signature.
   * 
   * @param {string} orderId - Razorpay order ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} signature - Razorpay signature
   * @returns {boolean} Whether the payment signature matches
   */
  verifyPaymentSignature(orderId, paymentId, signature) {
    if (isMock || (orderId && orderId.startsWith('order_') && paymentId === 'mock_pay_id')) {
      // Mock payment verified automatically
      return true;
    }

    try {
      const shasum = crypto.createHmac('sha256', keySecret);
      shasum.update(`${orderId}|${paymentId}`);
      const digest = shasum.digest('hex');
      return digest === signature;
    } catch (error) {
      console.error('Error verifying Razorpay signature:', error);
      return false;
    }
  }
}

module.exports = new RazorpayService();
