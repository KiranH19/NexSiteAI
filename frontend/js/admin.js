// js/admin.js - Admin dashboard data loading

document.addEventListener('DOMContentLoaded', async () => {

  const tabBtns     = document.querySelectorAll('.tab-btn');
  const tabPanels   = document.querySelectorAll('.tab-panel');

  // ── Tab switching ──────────────────────────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${btn.dataset.tab}`)?.classList.add('active');
    });
  });

  // ── Load stats ─────────────────────────────────────────────────────────────
  async function loadStats() {
    try {
      const { stats } = await API.adminStats();
      document.getElementById('stat-total').textContent   = stats.totalWebsites;
      document.getElementById('stat-leads').textContent   = stats.totalLeads;
      document.getElementById('stat-paid').textContent    = stats.paidWebsites;
      document.getElementById('stat-pending').textContent = stats.pendingWebsites;
    } catch (err) {
      console.error('Stats load failed:', err.message);
    }
  }

  // ── Load websites ──────────────────────────────────────────────────────────
  async function loadWebsites() {
    const tbody = document.getElementById('websites-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888">Loading...</td></tr>';

    try {
      const { websites } = await API.adminWebsites();

      if (!websites.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:#888">No websites yet</td></tr>';
        return;
      }

      tbody.innerHTML = websites.map(w => `
        <tr>
          <td><strong>${escHtml(w.business_name)}</strong></td>
          <td><code>${escHtml(w.slug)}</code></td>
          <td>${escHtml(w.category || '-')}</td>
          <td>${escHtml(w.plan || '-')}</td>
          <td>${statusBadge(w.payment_status)}</td>
          <td>${statusBadge(w.status, 'status')}</td>
          <td>
            ${w.status === 'published'
              ? `<a href="/site.html?slug=${w.slug}" target="_blank" class="admin-link">View →</a>`
              : '<span style="color:#666">Not published</span>'
            }
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#FF4D6D">Error: ${err.message}</td></tr>`;
    }
  }

  // ── Load leads ─────────────────────────────────────────────────────────────
  async function loadLeads() {
    const tbody = document.getElementById('leads-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:#888">Loading...</td></tr>';

    try {
      const { leads } = await API.adminLeads();

      if (!leads.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:#888">No leads yet</td></tr>';
        return;
      }

      tbody.innerHTML = leads.map(l => `
        <tr>
          <td><strong>${escHtml(l.name)}</strong></td>
          <td>${escHtml(l.phone || '-')}</td>
          <td>${escHtml(l.email || '-')}</td>
          <td>${escHtml(l.websites?.business_name || 'Unknown')}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(l.message || '-')}</td>
          <td style="color:#888;font-size:13px">${formatDate(l.created_at)}</td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#FF4D6D">Error: ${err.message}</td></tr>`;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function statusBadge(val, type = 'payment') {
    const map = {
      paid:      'badge-success',
      published: 'badge-success',
      pending:   'badge-warning',
      draft:     'badge-warning',
      failed:    'badge-error',
      active:    'badge-green'
    };
    return `<span class="badge ${map[val] || 'badge-primary'}">${val || 'unknown'}</span>`;
  }

  function formatDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  loadStats();
  loadWebsites();
  loadLeads();
});
