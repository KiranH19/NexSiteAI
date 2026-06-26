/**
 * NexSite - Preview & Payment Checkout Coordinator
 */

let sessionId = '';
let contentData = null;
let businessMeta = null;

const iframe = document.getElementById('preview-frame');
const templateSelect = document.getElementById('template-select');
const planSelect = document.getElementById('plan-select');
const emailInput = document.getElementById('account-email');
const passwordInput = document.getElementById('account-password');

window.onload = async function() {
  const urlParams = new URLSearchParams(window.location.search);
  sessionId = urlParams.get('session_id') || localStorage.getItem('nexsite_session_id');

  if (!sessionId) {
    API.showToast('No active session found. Redirecting to generator...', 'error');
    setTimeout(() => window.location.href = 'chat.html', 1500);
    return;
  }

  // Check auth state
  const user = API.getUser();
  const token = API.getToken();
  if (user && token) {
    document.getElementById('auth-status-logged-in').style.display = 'block';
    document.getElementById('logged-in-email').textContent = user.email;
    document.getElementById('auth-fields').style.display = 'none';
    
    // Autofill email
    emailInput.value = user.email;
  }

  // Pre-fill plan if passed from landing chat
  const sessionMeta = localStorage.getItem('nexsite_business_meta');
  if (sessionMeta) {
    businessMeta = JSON.parse(sessionMeta);
    if (businessMeta.plan) {
      planSelect.value = businessMeta.plan;
    }
  }

  // Load session from cache or fetch from DB
  const cachedContent = localStorage.getItem('nexsite_session_data');
  if (cachedContent) {
    contentData = JSON.parse(cachedContent);
    // Autofill business template suggestions
    autoselectTemplateByCategory(businessMeta.category);
    updatePreview();
  } else {
    // If not in cache, we could fetch from server
    API.showToast('Fetching website copy...', 'success');
  }
};

/**
 * Automatically sets the template based on category string
 */
function autoselectTemplateByCategory(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('coach') || cat.includes('edu') || cat.includes('school')) {
    templateSelect.value = 'coaching';
  } else if (cat.includes('clinic') || cat.includes('doc') || cat.includes('health') || cat.includes('dentist')) {
    templateSelect.value = 'medical';
  } else if (cat.includes('gym') || cat.includes('fit') || cat.includes('yoga')) {
    templateSelect.value = 'fitness';
  } else if (cat.includes('rest') || cat.includes('cafe') || cat.includes('food')) {
    templateSelect.value = 'restaurant';
  } else {
    templateSelect.value = 'corporate';
  }
}

/**
 * Updates the contents of the preview Iframe
 */
function updatePreview() {
  if (!contentData || !businessMeta) return;

  const templateId = templateSelect.value;
  document.getElementById('preview-site-title').textContent = businessMeta.name;

  // Use templates.js renderer
  const html = window.nexsiteTemplates.render(templateId, contentData, {
    business_name: businessMeta.name,
    phone: businessMeta.phone,
    email: businessMeta.email,
    address: businessMeta.address,
    logo_url: businessMeta.logoUrl
  });

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

/**
 * Switches device layouts
 */
function switchDevice(device) {
  const desktopBtn = document.getElementById('device-desktop');
  const mobileBtn = document.getElementById('device-mobile');

  if (device === 'mobile') {
    iframe.classList.add('mobile-view');
    mobileBtn.classList.add('active');
    desktopBtn.classList.remove('active');
  } else {
    iframe.classList.remove('mobile-view');
    desktopBtn.classList.add('active');
    mobileBtn.classList.remove('active');
  }
}

function handlePlanChange() {
  const plan = planSelect.value;
  const publishBtn = document.getElementById('publish-btn');
  
  if (plan === 'premium') {
    publishBtn.innerHTML = `<ion-icon name="rocket-outline"></ion-icon> Pay ₹999 & Publish (Premium)`;
  } else {
    publishBtn.innerHTML = `<ion-icon name="rocket-outline"></ion-icon> Pay ₹299 & Publish (Starter)`;
  }
}

/**
 * Main action launcher for Publishing
 */
async function initiatePublish() {
  const plan = planSelect.value;
  const templateChoice = templateSelect.value;
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const token = API.getToken();

  // Validate credentials if not logged in
  if (!token && (!email || !password)) {
    API.showToast('Please enter an Admin Email and CMS Password to register your account.', 'error');
    emailInput.focus();
    return;
  }

  const publishBtn = document.getElementById('publish-btn');
  publishBtn.disabled = true;
  publishBtn.textContent = 'Contacting Payment Gateway...';

  try {
    // 1. Create Razorpay order on backend
    const response = await API.createRazorpayOrder(plan, sessionId);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create payment order.');
    }

    const order = response.order;

    // Check if running in local Mock Mode
    if (order.isMock) {
      API.showToast('Demo payment mode active. Simulated checkout launching...');
      setTimeout(async () => {
        const confirmPay = confirm(`[DEMO CHECKOUT]\nPlan: ${plan.toUpperCase()}\nAmount: ₹${order.amount/100}\nClick OK to simulate successful payment.`);
        if (confirmPay) {
          await verifyPaymentAndPublish({
            razorpay_order_id: order.id,
            razorpay_payment_id: 'mock_pay_id',
            razorpay_signature: 'mock_sig',
            sessionId,
            plan,
            template: templateChoice,
            email,
            password,
            token
          });
        } else {
          publishBtn.disabled = false;
          handlePlanChange();
        }
      }, 500);
      return;
    }

    // 2. Open Real Razorpay Checkout Overlay
    const options = {
      key: order.keyId || 'rzp_test_default',
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'NexSite AI Website SaaS',
      description: `Setup & Publish fee for ${businessMeta.name}`,
      order_id: order.id,
      handler: async function(paymentResponse) {
        await verifyPaymentAndPublish({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          sessionId,
          plan,
          template: templateChoice,
          email,
          password,
          token
        });
      },
      prefill: {
        email: email || '',
        contact: businessMeta.phone || ''
      },
      theme: {
        color: '#6366f1'
      },
      modal: {
        ondismiss: function() {
          publishBtn.disabled = false;
          handlePlanChange();
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error('Publish setup error:', error);
    API.showToast(error.message || 'Payment initiation failed.', 'error');
    publishBtn.disabled = false;
    handlePlanChange();
  }
}

/**
 * Verifies signature on server, registers account, redirects to dynamic site
 */
async function verifyPaymentAndPublish(paymentData) {
  const publishBtn = document.getElementById('publish-btn');
  publishBtn.textContent = 'Verifying Transaction...';

  try {
    const result = await API.verifyRazorpayPayment(paymentData);

    if (result.success && result.verified) {
      API.showToast('🎉 Website Published Successfully!');
      
      // If payment resulted in a automatic signup, store their token
      if (result.token) {
        API.setToken(result.token);
        API.setUser(result.user);
      }

      // Redirect to dynamic site rendering page
      setTimeout(() => {
        window.location.href = `site.html?slug=${result.slug}&published=true`;
      }, 1500);
    } else {
      throw new Error(result.message || 'Payment verification failed.');
    }
  } catch (err) {
    // If auth conflict occurred (e.g. user already exists)
    if (err.code === 'USER_EXISTS') {
      alert('This email is already registered. Please log in first by clicking the Login button at the bottom of the page, then proceed to publish.');
      window.location.href = 'login.html';
      return;
    }
    
    API.showToast(err.message || 'Publishing failed.', 'error');
    publishBtn.disabled = false;
    handlePlanChange();
  }
}
