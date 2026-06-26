/**
 * NexSite - Frontend API Client
 * Wraps HTTP communication with the Express backend and manages Supabase user sessions.
 */

const API = {
  baseUrl: window.location.origin, // Since server serves files statically, host and port match

  /**
   * Saves JWT auth token to localStorage.
   */
  setToken(token) {
    localStorage.setItem('nexsite_token', token);
  },

  /**
   * Retrieves JWT auth token.
   */
  getToken() {
    return localStorage.getItem('nexsite_token');
  },

  /**
   * Clears auth token on Logout.
   */
  logout() {
    localStorage.removeItem('nexsite_token');
    localStorage.removeItem('nexsite_user');
    window.location.href = 'index.html';
  },

  /**
   * Saves current user object metadata.
   */
  setUser(user) {
    localStorage.setItem('nexsite_user', JSON.stringify(user));
  },

  /**
   * Gets current user object metadata.
   */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('nexsite_user'));
    } catch {
      return null;
    }
  },

  /**
   * Standard request wrapper.
   */
  async request(endpoint, method = 'GET', body = null, requireAuth = false) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requireAuth) {
      const token = this.getToken();
      if (!token) {
        throw new Error('You must be logged in to perform this action.');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Pass error codes like USER_EXISTS or AUTH_REQUIRED
        const err = new Error(data.message || 'Request failed');
        err.code = data.code;
        throw err;
      }

      return data;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  },

  // --- Auth API ---
  async login(email, password) {
    const data = await this.request('/api/auth/login', 'POST', { email, password });
    if (data.success) {
      this.setToken(data.token);
      this.setUser(data.user);
    }
    return data;
  },

  async register(email, password) {
    const data = await this.request('/api/auth/register', 'POST', { email, password });
    if (data.success) {
      this.setToken(data.token);
      this.setUser(data.user);
    }
    return data;
  },

  // --- Generation API ---
  async generateWebsite(businessData) {
    return await this.request('/api/generate', 'POST', { businessData });
  },

  // --- Websites CRUD & Publish ---
  async publishWebsite(publishData) {
    // publishData: { sessionId, template, plan, paymentId, email, password, token }
    return await this.request('/api/websites/publish', 'POST', publishData);
  },

  async updateWebsite(websiteId, updates) {
    // updates: { business_name, template, design_style, content_json, phone, email, address, logo_url }
    return await this.request('/api/websites/update', 'POST', { websiteId, ...updates }, true);
  },

  async getMyWebsites() {
    return await this.request('/api/websites/my-sites', 'GET', null, true);
  },

  async getWebsiteBySlug(slug) {
    return await this.request(`/api/websites/by-slug/${slug}`, 'GET');
  },

  // --- Payments API ---
  async createRazorpayOrder(plan, sessionId) {
    return await this.request('/api/payments/create-order', 'POST', { plan, sessionId });
  },

  async verifyRazorpayPayment(paymentVerificationData) {
    // paymentVerificationData: { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId, plan, template, email, password, token }
    return await this.request('/api/payments/verify', 'POST', paymentVerificationData);
  },

  // --- Admin API ---
  async getAdminStats() {
    return await this.request('/api/admin/stats', 'GET', null, true);
  },

  async getAdminWebsites() {
    return await this.request('/api/admin/websites', 'GET', null, true);
  },

  async getAdminLeads() {
    return await this.request('/api/admin/leads', 'GET', null, true);
  },

  async getAdminPayments() {
    return await this.request('/api/admin/payments', 'GET', null, true);
  },

  // --- Toast/Notification UI Helper ---
  showToast(message, type = 'success') {
    // Check if toast element exists
    let toast = document.querySelector('.toast');
    if (toast) toast.remove();

    toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'checkmark-circle-outline';
    if (type === 'error') icon = 'alert-circle-outline';
    
    toast.innerHTML = `
      <ion-icon name="${icon}" style="font-size: 1.4rem;"></ion-icon>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};
