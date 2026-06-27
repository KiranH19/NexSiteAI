// js/preview.js - Preview page logic: template selector, plan picker, payment

document.addEventListener('DOMContentLoaded', async () => {

  // ── Load session data ──────────────────────────────────────────────────────
  const sessionId        = Store.get('sessionId');
  const generatedContent = Store.get('generatedContent');
  const businessData     = Store.get('businessData');

  if (!sessionId || !generatedContent) {
    showToast('Session expired. Please start again.', 'error');
    setTimeout(() => window.location.href = 'chat.html', 2000);
    return;
  }

  // Build a mock websiteData object for preview rendering
  const mockWebsite = {
    id:            'preview',
    business_name: businessData.businessName,
    slug:          'preview',
    category:      businessData.category,
    template:      'business',
    phone:         businessData.phone,
    email:         businessData.email || '',
    address:       businessData.address || '',
    logo_url:      businessData.logoUrl || '',
    content_json:  generatedContent
  };

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const previewIframe   = document.getElementById('preview-iframe');
  const templateBtns    = document.querySelectorAll('.template-btn');
  const planCards       = document.querySelectorAll('.plan-card');
  const publishBtn      = document.getElementById('publish-btn');
  const businessNameEl  = document.getElementById('preview-business-name');
  const previewLoading  = document.getElementById('preview-loading');

  if (businessNameEl) businessNameEl.textContent = businessData.businessName;

  let selectedTemplate = 'business';
  let selectedPlan     = 'starter';

  // ── Initial preview render ─────────────────────────────────────────────────
  function renderPreview(template) {
    if (!previewIframe) return;
    previewLoading?.classList.remove('hidden');
    setTimeout(() => {
      mockWebsite.template = template;
      injectPreview(previewIframe, template, mockWebsite);
      previewLoading?.classList.add('hidden');
    }, 200);
  }

  renderPreview(selectedTemplate);

  // ── Template selector ──────────────────────────────────────────────────────
  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      templateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTemplate = btn.dataset.template;
      renderPreview(selectedTemplate);
      API.updateTemplate(sessionId, selectedTemplate).catch(console.warn);
    });
  });

  // ── Plan selector ──────────────────────────────────────────────────────────
  planCards.forEach(card => {
    card.addEventListener('click', () => {
      planCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedPlan = card.dataset.plan;
      updatePublishBtn();
    });
  });

  function updatePublishBtn() {
    if (!publishBtn) return;
    const prices = { starter: '₹299', premium: '₹999' };
    publishBtn.textContent = `🚀 Publish for ${prices[selectedPlan] || '₹299'}`;
  }
  updatePublishBtn();

  // ── Publish button → payment flow ─────────────────────────────────────────
  if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
      publishBtn.disabled    = true;
      publishBtn.textContent = 'Creating order...';

      try {
        // 1. Create Razorpay order
        const orderRes = await API.createOrder(selectedPlan, sessionId);

        // 2. Open Razorpay checkout
        const options = {
          key:         orderRes.keyId,
          amount:      orderRes.amount,
          currency:    orderRes.currency,
          name:        'NexSite',
          description: `${orderRes.planName} - Website for ${businessData.businessName}`,
          order_id:    orderRes.orderId,
          prefill: {
            name:  businessData.businessName,
            email: businessData.email  || '',
            contact: businessData.phone || ''
          },
          theme: { color: '#6C63FF' },
          handler: async (response) => {
            await handlePaymentSuccess(response, orderRes);
          },
          modal: {
            ondismiss: () => {
              publishBtn.disabled    = false;
              updatePublishBtn();
              showToast('Payment cancelled. You can try again.', 'warning');
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();

      } catch (err) {
        console.error('Order error:', err);
        showToast(`Failed to create order: ${err.message}`, 'error');
        publishBtn.disabled    = false;
        updatePublishBtn();
      }
    });
  }

  // ── Handle successful payment ──────────────────────────────────────────────
  async function handlePaymentSuccess(response, orderRes) {
    publishBtn.textContent = 'Verifying payment...';

    try {
      const verifyRes = await API.verifyPayment({
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        sessionId:           sessionId,
        plan:                selectedPlan,
        template:            selectedTemplate
      });

      if (verifyRes.verified) {
        Store.set('publishedSlug',    verifyRes.slug);
        Store.set('publishedWebsite', verifyRes.websiteId);

        showToast('🎉 Website published successfully!', 'success');

        // If user is logged in → go to their dashboard, else view the live site
        const isLoggedIn = !!localStorage.getItem('nexsite_token');
        setTimeout(() => {
          window.location.href = isLoggedIn
            ? 'dashboard.html'
            : `site.html?slug=${verifyRes.slug}`;
        }, 1500);
      } else {
        showToast('Payment could not be verified. Contact support.', 'error');
        publishBtn.disabled    = false;
        updatePublishBtn();
      }
    } catch (err) {
      console.error('Verify error:', err);
      showToast(`Verification failed: ${err.message}`, 'error');
      publishBtn.disabled    = false;
      updatePublishBtn();
    }
  }
});
