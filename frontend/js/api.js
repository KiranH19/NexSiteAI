// js/api.js - Central API helper for all frontend pages

const API_BASE = window.location.origin;  // Same server serves frontend

const API = {

  // ── AI Generation ──────────────────────────────────────────────────────────
  async generate(businessData) {
    // Pass auth token if user is logged in, so website gets linked to their account
    const token = localStorage.getItem('nexsite_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/generate`, {
      method:  'POST',
      headers: headers,
      body:    JSON.stringify({ businessData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  // ── Websites ───────────────────────────────────────────────────────────────
  async getWebsite(slug) {
    return await API._get(`/api/websites/${slug}`);
  },

  async getWebsiteById(id) {
    return await API._get(`/api/websites/id/${id}`);
  },

  async updateTemplate(sessionId, template) {
    return await API._patch(`/api/websites/session/${sessionId}/template`, { template });
  },

  // ── Leads ──────────────────────────────────────────────────────────────────
  async submitLead(websiteId, name, phone, email, message) {
    return await API._post('/api/leads', { websiteId, name, phone, email, message });
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  async createOrder(plan, sessionId) {
    return await API._post('/api/payments/create-order', { plan, sessionId });
  },

  async verifyPayment(payload) {
    return await API._post('/api/payments/verify', payload);
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  async adminWebsites() {
    return await API._get('/api/admin/websites');
  },

  async adminLeads() {
    return await API._get('/api/admin/leads');
  },

  async adminStats() {
    return await API._get('/api/admin/stats');
  },

  // ── Core HTTP helpers ──────────────────────────────────────────────────────
  async _get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  async _post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },

  async _patch(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }
};

// ── Toast notification system (used across all pages) ─────────────────────────
function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  // Auto-remove after 4s
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Session storage helpers ────────────────────────────────────────────────────
const Store = {
  set(key, val) { try { sessionStorage.setItem(`nexsite_${key}`, JSON.stringify(val)); } catch (_) {} },
  get(key)      { try { return JSON.parse(sessionStorage.getItem(`nexsite_${key}`)); } catch (_) { return null; } },
  clear(key)    { try { sessionStorage.removeItem(`nexsite_${key}`); } catch (_) {} }
};
