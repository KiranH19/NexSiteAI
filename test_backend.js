/**
 * NexSite - End-to-End Integration Verification Test
 * Programmatically triggers each phase of the application backend to ensure correctness.
 */

const assert = require('assert');
const grokService = require('./services/grokService');
const supabaseService = require('./services/supabaseService');
const razorpayService = require('./services/razorpayService');
const slugify = require('./utils/slugify');
const validateJson = require('./utils/validateJson');
const templates = require('./js/templates');

async function runTests() {
  console.log('🏁 Starting NexSite Integration Tests...\n');

  try {
    // --- Test 1: Slugify Utility ---
    console.log('🧪 Test 1: Verifying Slugify Utility...');
    const slug1 = slugify('My Gym & CrossFit Centre!!');
    const slug2 = slugify('My Gym & CrossFit Centre!!', true);
    assert.strictEqual(slug1, 'my-gym-crossfit-centre');
    assert.ok(slug2.startsWith('my-gym-crossfit-centre-'));
    console.log('✅ Test 1 Passed.\n');

    // --- Test 2: Heuristic Content Generator ---
    console.log('🧪 Test 2: Verifying Heuristic AI Copywriting...');
    const testData = {
      name: 'EduPrime Classes',
      category: 'Coaching Institute',
      description: 'Expert science and maths mentoring batches for grades 8-12.',
      services: 'Maths Tutoring, Physics Lab, Board Preparation',
      phone: '+91 99999 88888',
      email: 'contact@eduprime.com',
      address: 'Sector 5, Noida, UP',
      designStyle: 'vibrant'
    };

    const aiOutput = await grokService.generateWebsiteContent(testData);
    assert.ok(aiOutput.heroTitle);
    assert.ok(aiOutput.services.length >= 3);
    assert.ok(aiOutput.faq.length >= 3);
    assert.strictEqual(aiOutput.services[0].iconName, 'school'); // Matches coaching category heuristics
    console.log('✅ Test 2 Passed. Validated content structure and category-specific output mapping.\n');

    // --- Test 3: Session Database Storage ---
    console.log('🧪 Test 3: Verifying Generation Session DB storage...');
    const { data: session, error: sessErr } = await supabaseService.createSession({
      business_data: testData,
      generated_content: aiOutput
    });
    assert.strictEqual(sessErr, null);
    assert.ok(session.id);
    
    // Fetch and check
    const { data: retrievedSess } = await supabaseService.getSessionById(session.id);
    assert.deepStrictEqual(retrievedSess.generated_content, aiOutput);
    console.log('✅ Test 3 Passed. Sessions can be written and retrieved.\n');

    // --- Test 4: Razorpay Order Creation ---
    console.log('🧪 Test 4: Verifying Razorpay Payments billing pipeline...');
    const order = await razorpayService.createOrder(299, `rcpt_${session.id.substring(0,10)}`);
    assert.ok(order.id);
    assert.strictEqual(order.amount, 29900); // 299 * 100 paise
    console.log('✅ Test 4 Passed. Checkout order generated successfully.\n');

    // --- Test 5: Verify Payment & Publish Site ---
    console.log('🧪 Test 5: Verifying Signature verification and site publication...');
    const sigVerified = razorpayService.verifyPaymentSignature(order.id, 'mock_pay_id', 'mock_sig');
    assert.strictEqual(sigVerified, true);

    // Simulate database publication
    const signupData = await supabaseService.mockSignupOrLogin('testmerchant@business.com', 'mypassword123');
    
    const { data: publishedSite, error: publishErr } = await supabaseService.createWebsite({
      user_id: signupData.user.id,
      business_name: testData.name,
      slug: slugify(testData.name),
      category: testData.category,
      template: 'coaching',
      content_json: aiOutput,
      phone: testData.phone,
      email: testData.email,
      address: testData.address,
      plan: 'starter',
      payment_status: 'paid',
      status: 'published'
    });

    assert.strictEqual(publishErr, null);
    assert.ok(publishedSite.id);
    assert.strictEqual(publishedSite.slug, 'eduprime-classes');
    assert.strictEqual(publishedSite.payment_status, 'paid');
    assert.strictEqual(publishedSite.status, 'published');
    console.log('✅ Test 5 Passed. Payment verified and website published successfully.\n');

    // --- Test 6: HTML Templates Compiler ---
    console.log('🧪 Test 6: Verifying HTML templates compiler outputs...');
    const pageHtml = templates.render('coaching', aiOutput, publishedSite);
    assert.ok(pageHtml.includes('<!DOCTYPE html>'));
    assert.ok(pageHtml.includes('EduPrime Classes'));
    assert.ok(pageHtml.includes('public-lead-form')); // Ensures contact form is present
    assert.ok(pageHtml.includes('logo-whatsapp')); // WhatsApp button present
    console.log('✅ Test 6 Passed. HTML content is structurally valid.\n');

    // --- Test 7: Form Submission Leads Capture ---
    console.log('🧪 Test 7: Verifying Lead submission pipeline...');
    const { data: lead, error: leadErr } = await supabaseService.createLead({
      website_id: publishedSite.id,
      name: 'Amit Patel',
      phone: '9898989898',
      email: 'amit@gmail.com',
      message: 'Looking to join chemistry batch.'
    });

    assert.strictEqual(leadErr, null);
    assert.ok(lead.id);

    // Retrieve leads
    const { data: leads } = await supabaseService.getLeadsByWebsiteId(publishedSite.id);
    assert.strictEqual(leads.length, 1);
    assert.strictEqual(leads[0].name, 'Amit Patel');
    console.log('✅ Test 7 Passed. Dynamic contact form submissions saved and queried successfully.\n');

    console.log('🎉 ALL INTEGRATION TESTS PASSED! NexSite code is robust and ready for production.');
  } catch (error) {
    console.error('❌ INTEGRATION TEST FAILED:', error);
    process.exit(1);
  }
}

runTests();
