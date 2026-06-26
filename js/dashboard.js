/**
 * NexSite - Merchant Dashboard & Real-time CMS Controller
 */

let myWebsites = [];
let activeEditingSite = null;

window.onload = function() {
  const token = API.getToken();
  const user = API.getUser();

  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('user-email-display').textContent = user.email;

  // Initialize view
  switchDashboardTab('sites');
};

/**
 * Handle Tab navigation
 */
async function switchDashboardTab(tabId) {
  // Reset active menu styles
  document.querySelectorAll('.dash-menu-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

  // Set active
  const menuEl = document.getElementById(`menu-${tabId}`);
  if (menuEl) menuEl.classList.add('active');

  const tabEl = document.getElementById(`tab-${tabId}`);
  if (tabEl) tabEl.classList.add('active');

  // Trigger loads
  if (tabId === 'sites') {
    await loadWebsites();
  } else if (tabId === 'leads') {
    await loadLeads();
  } else if (tabId === 'billing') {
    await loadBilling();
  } else if (tabId === 'cms-editor') {
    // Handled via edit button
    document.getElementById('tab-cms-editor').classList.add('active');
  }
}

/**
 * Fetch and list merchant websites
 */
async function loadWebsites() {
  const container = document.getElementById('sites-list-container');
  container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><ion-icon name="sync-outline" style="animation: spin 1s linear infinite; font-size: 2rem;"></ion-icon><p style="margin-top: 10px;">Loading your sites...</p></div>`;

  try {
    const response = await API.getMyWebsites();
    myWebsites = response.websites || [];

    if (myWebsites.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;" class="glass-panel">
          <ion-icon name="alert-circle-outline" style="font-size: 3rem; color: var(--text-muted);"></ion-icon>
          <h3 style="margin-top: 16px;">No websites generated yet</h3>
          <p style="color: var(--text-secondary); margin-top: 8px;">Create your first professional landing page now using our chatbot builder.</p>
          <a href="chat.html" class="btn btn-primary" style="margin-top: 20px;">Launch Builder</a>
        </div>
      `;
      return;
    }

    container.innerHTML = myWebsites.map(site => {
      const planBadge = site.plan === 'premium' 
        ? '<span class="status-badge paid">Premium Plan</span>'
        : '<span class="status-badge draft">Starter Plan</span>';
      
      const linkUrl = `site.html?slug=${site.slug}`;

      return `
        <div class="glass-panel feature-card" style="padding: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 15px;">
            <div class="feature-icon" style="margin: 0; background:rgba(99, 102, 241, 0.1);"><ion-icon name="globe"></ion-icon></div>
            ${planBadge}
          </div>
          <h3 style="font-size: 1.2rem; margin-bottom: 4px;">${site.business_name}</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">Category: ${site.category}</p>
          
          <div style="display:flex; flex-direction:column; gap: 8px;">
            <a href="${linkUrl}" target="_blank" class="btn btn-secondary" style="padding: 8px 12px; font-size: 0.85rem; width:100%; justify-content:center;">
              <ion-icon name="open-outline"></ion-icon> View Live Site
            </a>
            <button class="btn btn-primary" style="padding: 8px 12px; font-size: 0.85rem; width:100%; justify-content:center;" onclick="openCmsEditor('${site.id}')">
              <ion-icon name="create-outline"></ion-icon> Edit Content (CMS)
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error(error);
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger-accent); padding: 40px;"><p>Failed to retrieve sites. Please retry.</p></div>`;
  }
}

/**
 * Load Leads Collected across all sites
 */
async function loadLeads() {
  const tbody = document.getElementById('leads-list-tbody');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px;"><ion-icon name="sync-outline" style="animation: spin 1s linear infinite;"></ion-icon> Loading leads...</td></tr>`;

  try {
    const allLeads = [];
    
    // Fetch leads for all user websites
    for (const site of myWebsites) {
      const response = await API.request(`/api/leads/by-website/${site.id}`, 'GET', null, true);
      if (response.success && response.leads) {
        response.leads.forEach(lead => {
          allLeads.push({
            ...lead,
            siteName: site.business_name
          });
        });
      }
    }

    // Sort by date desc
    allLeads.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    if (allLeads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">No customer leads received yet. Forms submitted on your landing pages will show up here.</td></tr>`;
      return;
    }

    tbody.innerHTML = allLeads.map(lead => `
      <tr>
        <td style="font-weight:600;">${lead.name}</td>
        <td><a href="mailto:${lead.email}" style="color:var(--primary-accent); text-decoration:underline;">${lead.email}</a></td>
        <td>${lead.phone || '-'}</td>
        <td style="max-width: 250px; white-space: normal;">${lead.message}</td>
        <td style="color:var(--text-secondary);">${lead.siteName}</td>
        <td style="font-size:0.8rem; color:var(--text-muted);">${new Date(lead.created_at).toLocaleString()}</td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error fetching dashboard leads:', error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger-accent); padding: 30px;">Error loading leads directory.</td></tr>`;
  }
}

/**
 * Load billing sub-page details
 */
async function loadBilling() {
  const container = document.getElementById('billing-plans-container');
  container.innerHTML = '';

  myWebsites.forEach(site => {
    const isPremium = site.plan === 'premium';
    const setupFee = isPremium ? 999 : 299;
    const monthlyFee = isPremium ? 99 : 59;
    
    const card = document.createElement('div');
    card.className = 'glass-panel pricing-card';
    card.style.maxWidth = '100%';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h3>${site.business_name}</h3>
        <span class="status-badge paid">Paid</span>
      </div>
      <div class="price" style="font-size:2rem;">₹${setupFee}<span> setup paid</span></div>
      <p style="color:var(--text-secondary); font-size:0.9rem; margin-top:8px;">Plan: <b>${site.plan.toUpperCase()}</b></p>
      <p style="color:var(--text-muted); font-size:0.8rem; margin-top:4px;">Billing cycle: ₹${monthlyFee}/month recurring</p>
    `;
    container.appendChild(card);
  });
}

/**
 * Switch CMS editor devices
 */
function switchCmsDevice(device) {
  const frame = document.getElementById('cms-preview-frame');
  const desktopBtn = document.getElementById('cms-device-desktop');
  const mobileBtn = document.getElementById('cms-device-mobile');

  if (device === 'mobile') {
    frame.classList.add('mobile-view');
    mobileBtn.classList.add('active');
    desktopBtn.classList.remove('active');
  } else {
    frame.classList.remove('mobile-view');
    desktopBtn.classList.add('active');
    mobileBtn.classList.remove('active');
  }
}

/**
 * Load the CMS Forms with website details
 */
function openCmsEditor(siteId) {
  activeEditingSite = myWebsites.find(w => w.id === siteId);
  if (!activeEditingSite) return;

  switchDashboardTab('cms-editor');

  document.getElementById('edit-site-id').value = activeEditingSite.id;
  document.getElementById('edit-business-name').value = activeEditingSite.business_name;
  document.getElementById('edit-template').value = activeEditingSite.template;
  document.getElementById('edit-phone').value = activeEditingSite.phone || '';
  document.getElementById('edit-email').value = activeEditingSite.email || '';
  document.getElementById('edit-address').value = activeEditingSite.address || '';
  document.getElementById('edit-logo-url').value = activeEditingSite.logo_url || '';

  const cjson = activeEditingSite.content_json;
  
  // Hero
  document.getElementById('edit-hero-title').value = cjson.heroTitle || '';
  document.getElementById('edit-hero-subtitle').value = cjson.heroSubtitle || '';
  document.getElementById('edit-hero-cta').value = cjson.heroCTA || '';

  // About
  document.getElementById('edit-about-title').value = cjson.aboutTitle || '';
  document.getElementById('edit-about-description').value = cjson.aboutDescription || '';
  document.getElementById('edit-about-story').value = cjson.aboutStory || '';

  // Dynamic Services Outlines
  const servicesContainer = document.getElementById('cms-services-fields');
  servicesContainer.innerHTML = (cjson.services || []).map((svc, i) => `
    <div style="background: rgba(0,0,0,0.15); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <h4 style="font-size: 0.9rem; margin-bottom:12px; color:var(--primary-accent)">Service #${i+1}</h4>
      <div class="form-group">
        <label class="form-label">Service Title</label>
        <input class="text-input service-title-field" type="text" data-index="${i}" value="${svc.title}" oninput="triggerCmsPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="textarea-input service-desc-field" data-index="${i}" oninput="triggerCmsPreview()">${svc.description}</textarea>
      </div>
    </div>
  `).join('');

  // Dynamic FAQs
  const faqsContainer = document.getElementById('cms-faqs-fields');
  faqsContainer.innerHTML = (cjson.faq || []).map((faqItem, i) => `
    <div style="background: rgba(0,0,0,0.15); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <h4 style="font-size: 0.9rem; margin-bottom:12px; color:var(--primary-accent)">FAQ #${i+1}</h4>
      <div class="form-group">
        <label class="form-label">Question</label>
        <input class="text-input faq-question-field" type="text" data-index="${i}" value="${faqItem.question}" oninput="triggerCmsPreview()">
      </div>
      <div class="form-group">
        <label class="form-label">Answer</label>
        <textarea class="textarea-input faq-answer-field" data-index="${i}" oninput="triggerCmsPreview()">${faqItem.answer}</textarea>
      </div>
    </div>
  `).join('');

  // Initial Preview render
  triggerCmsPreview();
}

/**
 * Gathers active CMS edit fields and writes to Iframe in real-time
 */
function triggerCmsPreview() {
  if (!activeEditingSite) return;

  const template = document.getElementById('edit-template').value;
  const businessName = document.getElementById('edit-business-name').value;
  const phone = document.getElementById('edit-phone').value;
  const email = document.getElementById('edit-email').value;
  const address = document.getElementById('edit-address').value;
  const logoUrl = document.getElementById('edit-logo-url').value;

  // Build services array
  const services = [];
  document.querySelectorAll('.service-title-field').forEach((el, idx) => {
    const descEl = document.querySelector(`.service-desc-field[data-index="${idx}"]`);
    services.push({
      title: el.value,
      description: descEl ? descEl.value : '',
      iconName: activeEditingSite.content_json.services[idx]?.iconName || 'briefcase'
    });
  });

  // Build FAQ array
  const faq = [];
  document.querySelectorAll('.faq-question-field').forEach((el, idx) => {
    const ansEl = document.querySelector(`.faq-answer-field[data-index="${idx}"]`);
    faq.push({
      question: el.value,
      answer: ansEl ? ansEl.value : ''
    });
  });

  // Formulate complete updated JSON structure
  const updatedContent = {
    heroTitle: document.getElementById('edit-hero-title').value,
    heroSubtitle: document.getElementById('edit-hero-subtitle').value,
    heroCTA: document.getElementById('edit-hero-cta').value,
    aboutTitle: document.getElementById('edit-about-title').value,
    aboutDescription: document.getElementById('edit-about-description').value,
    aboutStory: document.getElementById('edit-about-story').value,
    services,
    faq,
    ctaTitle: activeEditingSite.content_json.ctaTitle,
    ctaText: activeEditingSite.content_json.ctaText,
    seoTitle: document.getElementById('edit-hero-title').value,
    seoDescription: document.getElementById('edit-hero-subtitle').value
  };

  // Render to editor iframe
  const html = window.nexsiteTemplates.render(template, updatedContent, {
    business_name: businessName,
    phone,
    email,
    address,
    logo_url: logoUrl
  });

  const frame = document.getElementById('cms-preview-frame');
  const doc = frame.contentDocument || frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

/**
 * Save CMS Edits back to Supabase
 */
async function saveCmsEdits() {
  const siteId = document.getElementById('edit-site-id').value;
  if (!siteId) return;

  const businessName = document.getElementById('edit-business-name').value.trim();
  const template = document.getElementById('edit-template').value;
  const phone = document.getElementById('edit-phone').value.trim();
  const email = document.getElementById('edit-email').value.trim();
  const address = document.getElementById('edit-address').value.trim();
  const logoUrl = document.getElementById('edit-logo-url').value.trim();

  // Build services
  const services = [];
  document.querySelectorAll('.service-title-field').forEach((el, idx) => {
    const descEl = document.querySelector(`.service-desc-field[data-index="${idx}"]`);
    services.push({
      title: el.value.trim(),
      description: descEl ? descEl.value.trim() : '',
      iconName: activeEditingSite.content_json.services[idx]?.iconName || 'briefcase'
    });
  });

  // Build FAQ
  const faq = [];
  document.querySelectorAll('.faq-question-field').forEach((el, idx) => {
    const ansEl = document.querySelector(`.faq-answer-field[data-index="${idx}"]`);
    faq.push({
      question: el.value.trim(),
      answer: ansEl ? ansEl.value.trim() : ''
    });
  });

  const payload = {
    business_name: businessName,
    template,
    phone,
    email,
    address,
    logo_url: logoUrl,
    content_json: {
      ...activeEditingSite.content_json,
      heroTitle: document.getElementById('edit-hero-title').value.trim(),
      heroSubtitle: document.getElementById('edit-hero-subtitle').value.trim(),
      heroCTA: document.getElementById('edit-hero-cta').value.trim(),
      aboutTitle: document.getElementById('edit-about-title').value.trim(),
      aboutDescription: document.getElementById('edit-about-description').value.trim(),
      aboutStory: document.getElementById('edit-about-story').value.trim(),
      services,
      faq,
      seoTitle: document.getElementById('edit-hero-title').value.trim(),
      seoDescription: document.getElementById('edit-hero-subtitle').value.trim()
    }
  };

  try {
    const response = await API.updateWebsite(siteId, payload);
    if (response.success) {
      API.showToast('Website content updated successfully!');
      setTimeout(() => {
        switchDashboardTab('sites');
      }, 1000);
    }
  } catch (error) {
    API.showToast(error.message || 'Failed to save CMS edits.', 'error');
  }
}
