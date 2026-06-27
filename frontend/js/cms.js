// js/cms.js - CMS auth helpers, API calls, shared utilities for dashboard

// ── Auth token management ─────────────────────────────────────────────────────
const Auth = {
  getToken()  { return localStorage.getItem('nexsite_token'); },
  getUser()   { try { return JSON.parse(localStorage.getItem('nexsite_user')); } catch(_){ return null; } },
  isLoggedIn(){ return !!this.getToken(); },

  logout() {
    localStorage.removeItem('nexsite_token');
    localStorage.removeItem('nexsite_refresh');
    localStorage.removeItem('nexsite_user');
    window.location.href = 'login.html';
  },

  // Attach auth header to every CMS request
  headers() {
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
  },

  // Redirect to login if not authenticated
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};

// ── CMS API calls ─────────────────────────────────────────────────────────────
const CMS = {

  async myWebsites() {
    return await CMS._get('/api/cms/my-websites');
  },

  async getWebsite(id) {
    return await CMS._get(`/api/cms/${id}`);
  },

  async updateHero(id, heroTitle, heroSubtitle) {
    return await CMS._patch(`/api/cms/${id}/hero`, { heroTitle, heroSubtitle });
  },

  async updateAbout(id, aboutTitle, aboutDescription) {
    return await CMS._patch(`/api/cms/${id}/about`, { aboutTitle, aboutDescription });
  },

  async updateServices(id, services) {
    return await CMS._put(`/api/cms/${id}/services`, { services });
  },

  async updateFAQ(id, faq) {
    return await CMS._put(`/api/cms/${id}/faq`, { faq });
  },

  async updateContact(id, phone, email, address) {
    return await CMS._patch(`/api/cms/${id}/contact`, { phone, email, address });
  },

  async updateBranding(id, businessName, logoUrl) {
    return await CMS._patch(`/api/cms/${id}/branding`, { businessName, logoUrl });
  },

  async updateSEO(id, seoTitle, seoDescription, ctaTitle, ctaText) {
    return await CMS._patch(`/api/cms/${id}/seo`, { seoTitle, seoDescription, ctaTitle, ctaText });
  },

  async getHistory(id) {
    return await CMS._get(`/api/cms/${id}/history`);
  },

  // ── HTTP helpers ────────────────────────────────────────────────────────────
  async _get(path) {
    const res = await fetch(path, { headers: Auth.headers() });
    if (res.status === 401) { Auth.logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  async _patch(path, body) {
    const res = await fetch(path, {
      method: 'PATCH',
      headers: Auth.headers(),
      body: JSON.stringify(body)
    });
    if (res.status === 401) { Auth.logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  async _put(path, body) {
    const res = await fetch(path, {
      method: 'PUT',
      headers: Auth.headers(),
      body: JSON.stringify(body)
    });
    if (res.status === 401) { Auth.logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }
};

// ── Save button helper: shows loading → success/error ─────────────────────────
async function saveSection(btnId, saveFn) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const original = btn.textContent;
  btn.disabled    = true;
  btn.textContent = 'Saving...';

  try {
    await saveFn();
    btn.textContent = '✅ Saved!';
    btn.style.background = 'linear-gradient(135deg,#00C896,#00A07A)';
    showToast('Changes saved and live!', 'success');
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    btn.textContent = '❌ Failed';
    btn.style.background = 'linear-gradient(135deg,#FF4D6D,#CC2255)';
    showToast(err.message || 'Save failed', 'error');
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.disabled = false;
    }, 2500);
  }
}
