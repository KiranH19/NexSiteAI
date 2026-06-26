/**
 * NexSite - Administration Dashboard Controller
 */

window.onload = function() {
  const token = API.getToken();
  const user = API.getUser();

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  // Ensure Administrator authority
  const isAdmin = user.user_metadata && user.user_metadata.role === 'admin';
  const isDefaultAdminEmail = user.email === 'admin@nexsite.com';
  
  if (!isAdmin && !isDefaultAdminEmail) {
    API.showToast('Access denied. Administrator session required.', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
    return;
  }

  // Load starting page
  switchAdminTab('stats');
};

/**
 * Switch Admin view tabs
 */
async function switchAdminTab(tabId) {
  document.querySelectorAll('.dash-menu-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

  const menuEl = document.getElementById(`menu-${tabId}`);
  if (menuEl) menuEl.classList.add('active');

  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) tabEl.classList.add('active');

  if (tabId === 'stats') {
    await loadAdminStats();
  } else if (tabId === 'websites') {
    await loadWebsitesTable();
  } else if (tabId === 'leads') {
    await loadLeadsTable();
  } else if (tabId === 'payments') {
    await loadPaymentsTable();
  }
}

/**
 * Gathers stats totals
 */
async function loadAdminStats() {
  try {
    const response = await API.getAdminStats();
    if (response.success && response.stats) {
      const stats = response.stats;
      document.getElementById('stat-total-sites').textContent = stats.totalSites;
      document.getElementById('stat-total-leads').textContent = stats.totalLeads;
      document.getElementById('stat-paid-sites').textContent = stats.paidSites;
      
      // Format revenue to currency
      document.getElementById('stat-total-revenue').textContent = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(stats.totalRevenue);
    }
  } catch (error) {
    console.error('Stats aggregation failed:', error);
    API.showToast('Failed to compile metric statistics.', 'error');
  }
}

/**
 * Populates websites directory table
 */
async function loadWebsitesTable() {
  const tbody = document.getElementById('admin-websites-tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px;"><ion-icon name="sync-outline" style="animation: spin 1s linear infinite;"></ion-icon> Retrieving sites...</td></tr>`;

  try {
    const response = await API.getAdminWebsites();
    const sites = response.websites || [];

    if (sites.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">No business websites generated in the system.</td></tr>`;
      return;
    }

    tbody.innerHTML = sites.map(site => {
      const siteUrl = `site.html?slug=${site.slug}`;
      const statusBadge = site.status === 'published' 
        ? '<span class="status-badge published">Published</span>'
        : '<span class="status-badge draft">Draft</span>';
      
      const payBadge = site.payment_status === 'paid' 
        ? '<span class="status-badge paid">Paid</span>'
        : '<span class="status-badge pending">Pending</span>';

      return `
        <tr>
          <td style="font-weight: 600;">${site.business_name}</td>
          <td><a href="${siteUrl}" target="_blank" style="color: var(--primary-accent); text-decoration: underline;">/site.html?slug=${site.slug}</a></td>
          <td>${site.category}</td>
          <td>${site.template}</td>
          <td style="text-transform: uppercase;">${site.plan}</td>
          <td>${payBadge}</td>
          <td>${statusBadge}</td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(site.created_at).toLocaleDateString()}</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger-accent); padding: 24px;">Failed to fetch websites directory list.</td></tr>`;
  }
}

/**
 * Populates leads tracking table
 */
async function loadLeadsTable() {
  const tbody = document.getElementById('admin-leads-tbody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;"><ion-icon name="sync-outline" style="animation: spin 1s linear infinite;"></ion-icon> Retrieving leads...</td></tr>`;

  try {
    const response = await API.getAdminLeads();
    const leads = response.leads || [];

    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No user leads captured.</td></tr>`;
      return;
    }

    tbody.innerHTML = leads.map(lead => `
      <tr>
        <td style="font-weight: 600;">${lead.name}</td>
        <td><a href="mailto:${lead.email}" style="color: var(--primary-accent); text-decoration: underline;">${lead.email}</a></td>
        <td>${lead.phone || '-'}</td>
        <td style="max-width: 300px; white-space: normal;">${lead.message}</td>
        <td>${lead.websites ? lead.websites.business_name : 'Unknown Site'}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(lead.created_at).toLocaleString()}</td>
      </tr>
    `).join('');

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger-accent); padding: 24px;">Failed to fetch leads list.</td></tr>`;
  }
}

/**
 * Populates payments log table
 */
async function loadPaymentsTable() {
  const tbody = document.getElementById('admin-payments-tbody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px;"><ion-icon name="sync-outline" style="animation: spin 1s linear infinite;"></ion-icon> Retrieving invoice transactions...</td></tr>`;

  try {
    const response = await API.getAdminPayments();
    const payments = response.payments || [];

    if (payments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">No transactions recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = payments.map(pay => `
      <tr>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${pay.id.substring(0, 8)}...</td>
        <td style="font-weight: 600;">${pay.websites ? pay.websites.business_name : 'Unknown Site'}</td>
        <td style="font-size: 0.85rem;">${pay.razorpay_order_id}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${pay.razorpay_payment_id || '-'}</td>
        <td style="font-weight: 600; color: var(--success-accent);">₹${(pay.amount / 100).toFixed(2)}</td>
        <td>${pay.currency}</td>
        <td><span class="status-badge paid">${pay.status}</span></td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(pay.created_at).toLocaleString()}</td>
      </tr>
    `).join('');

  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger-accent); padding: 24px;">Failed to fetch payments transaction logs.</td></tr>`;
  }
}
