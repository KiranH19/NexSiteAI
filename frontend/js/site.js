// js/site.js - Public site renderer + contact form + FAQ toggle

// ── FAQ accordion (used inside rendered templates) ─────────────────────────
function toggleFAQ(index) {
  const item = document.getElementById(`faq-${index}`);
  if (!item) return;
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.tpl-faq-item').forEach(el => el.classList.remove('open'));
  // Open clicked if it wasn't open
  if (!isOpen) item.classList.add('open');
}

// ── Contact form submission ────────────────────────────────────────────────
async function handleContactSubmit(event, websiteId) {
  event.preventDefault();

  const form   = event.target;
  const btn    = form.querySelector('#submit-lead-btn');
  const name   = form.querySelector('[name="name"]').value.trim();
  const phone  = form.querySelector('[name="phone"]').value.trim();
  const email  = form.querySelector('[name="email"]')?.value.trim() || '';
  const message= form.querySelector('[name="message"]')?.value.trim() || '';

  if (!name || !phone) {
    showInlineMsg(form, 'Please fill in your name and phone number.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Sending...';

  try {
    const API_BASE = window.location.origin;
    const res = await fetch(`${API_BASE}/api/leads`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ websiteId, name, phone, email, message })
    });
    const data = await res.json();

    if (data.success) {
      form.reset();
      btn.textContent = '✅ Message Sent!';
      btn.style.background = '#00C896';
      showInlineMsg(form, '✅ Thank you! We will get back to you soon.', 'success');
    } else {
      throw new Error(data.error || 'Submit failed');
    }
  } catch (err) {
    btn.disabled    = false;
    btn.textContent = 'Send Message →';
    showInlineMsg(form, `❌ ${err.message}. Please try again.`, 'error');
  }
}

// ── Inline message helper ──────────────────────────────────────────────────
function showInlineMsg(form, msg, type) {
  let el = form.querySelector('.form-msg');
  if (!el) {
    el = document.createElement('div');
    el.className = 'form-msg';
    el.style.cssText = 'padding:12px 16px;border-radius:8px;margin-top:12px;font-size:14px;font-weight:500';
    form.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = type === 'success' ? 'rgba(0,200,150,0.1)' : 'rgba(255,77,109,0.1)';
  el.style.color = type === 'success' ? '#00C896' : '#FF4D6D';
  el.style.border = `1px solid ${type === 'success' ? '#00C896' : '#FF4D6D'}`;
}

// ── Toast for site pages ───────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:9999;
    background:${type === 'success' ? '#00C896' : type === 'error' ? '#FF4D6D' : '#FFB347'};
    color:white;padding:14px 20px;border-radius:12px;
    font-size:14px;font-weight:600;
    box-shadow:0 4px 20px rgba(0,0,0,0.3);
    animation:slideInRight 0.3s ease;
  `;
  toast.textContent = `${icons[type] || ''} ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Site page loader (site.html) ───────────────────────────────────────────
// Only runs on site.html — checks for a slug param and fetches + renders
if (document.getElementById('site-root')) {
  (async () => {
    const params = new URLSearchParams(window.location.search);
    const slug   = params.get('slug');
    const root   = document.getElementById('site-root');
    const loader = document.getElementById('site-loader');

    if (!slug) {
      root.innerHTML = `
        <div style="text-align:center;padding:80px 24px;font-family:Inter,sans-serif">
          <h1 style="font-size:48px;margin-bottom:16px">🌐</h1>
          <h2>No website found</h2>
          <p style="color:#666;margin-top:8px">The URL is missing a slug parameter.</p>
          <a href="/" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#6C63FF;color:white;border-radius:12px;font-weight:600;text-decoration:none">← Back to NexSite</a>
        </div>`;
      if (loader) loader.style.display = 'none';
      return;
    }

    try {
      const API_BASE = window.location.origin;
      const res  = await fetch(`${API_BASE}/api/websites/${slug}`);
      const data = await res.json();

      if (!data.success || !data.website) {
        throw new Error(data.error || 'Website not found');
      }

      const website  = data.website;
      document.title = website.content_json?.seoTitle || website.business_name;

      // Render template HTML into root
      const html = renderTemplate(website.template || 'business', website);
      root.innerHTML = html;
      if (loader) loader.style.display = 'none';

      // Re-run scripts inside the rendered HTML by eval (for FAQ/form)
      // Actually they rely on globally defined functions above — no re-eval needed

    } catch (err) {
      if (loader) loader.style.display = 'none';
      root.innerHTML = `
        <div style="text-align:center;padding:80px 24px;font-family:Inter,sans-serif">
          <h1 style="font-size:48px;margin-bottom:16px">😕</h1>
          <h2>Website not found</h2>
          <p style="color:#666;margin-top:8px">${err.message}</p>
          <a href="/" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#6C63FF;color:white;border-radius:12px;font-weight:600;text-decoration:none">← Back to NexSite</a>
        </div>`;
    }
  })();
}
