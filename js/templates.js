/**
 * NexSite - Premium HTML Templating Engine
 * Generates full, production-ready, responsive, multi-section landing pages.
 */

const templates = {
  /**
   * Renders the complete HTML content of a generated website.
   * 
   * @param {string} templateId - 'coaching' | 'medical' | 'fitness' | 'restaurant' | 'corporate'
   * @param {object} content - The validated generated AI JSON content
   * @param {object} meta - Contact details: { id, business_name, phone, email, address, logo_url, design_style }
   * @returns {string} Fully functional HTML string
   */
  render(templateId, content, meta) {
    const brandColorVars = {
      coaching: '#3b82f6',
      medical: '#0d9488',
      fitness: '#ea580c',
      restaurant: '#d97706',
      corporate: '#6366f1'
    };

    const activeColor = brandColorVars[templateId] || '#6366f1';
    const logoHtml = meta.logo_url 
      ? `<img src="${meta.logo_url}" alt="${meta.business_name}">`
      : `<span>${meta.business_name}</span>`;

    // Map template labels for CSS scoping
    const templateClassMap = {
      coaching: 'tpl-coaching',
      medical: 'tpl-medical',
      fitness: 'tpl-fitness',
      restaurant: 'tpl-restaurant',
      corporate: 'tpl-corporate'
    };

    const bodyClass = templateClassMap[templateId] || 'tpl-corporate';

    // Renders the services lists
    const servicesHtml = content.services.map((svc, i) => {
      // Set icons based on index/contents
      const icons = ['school', 'people', 'document-text', 'briefcase', 'settings', 'pulse', 'flask', 'shield', 'fitness', 'flash', 'nutrition', 'restaurant', 'beer', 'bicycle', 'trending-up', 'code-working', 'cog'];
      const icon = svc.iconName || icons[i % icons.length];
      return `
        <div class="service-card">
          <div class="tpl-info-icon" style="font-size: 2rem; margin-bottom: 20px;">
            <ion-icon name="${icon}"></ion-icon>
          </div>
          <h3>${svc.title}</h3>
          <p style="margin-top: 10px; color: #4b5563; font-size: 0.95rem;">${svc.description}</p>
        </div>
      `;
    }).join('');

    // Renders testimonials
    const testimonialsHtml = (content.testimonials || []).map(test => `
      <div class="service-card" style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; background: #fff;">
        <p style="font-style: italic; color: #4b5563; line-height: 1.6; margin-bottom: 20px;">"${test.text}"</p>
        <h4 style="font-size: 1.05rem; color: #111827;">${test.name}</h4>
        <span style="font-size: 0.85rem; color: #6b7280;">${test.role}</span>
      </div>
    `).join('');

    // Renders FAQs
    const faqHtml = content.faq.map((faqItem, i) => {
      if (templateId === 'coaching' || templateId === 'fitness') {
        // details accordion mode
        return `
          <details>
            <summary>${faqItem.question}</summary>
            <div class="faq-content">
              <p>${faqItem.answer}</p>
            </div>
          </details>
        `;
      } else {
        // card list mode
        return `
          <div class="faq-item">
            <h4>${faqItem.question}</h4>
            <p style="color: #4b5563; margin-top: 8px; line-height: 1.5;">${faqItem.answer}</p>
          </div>
        `;
      }
    }).join('');

    // Clean phone number for WhatsApp API
    const waPhone = meta.phone ? meta.phone.replace(/[^0-9]/g, '') : '';
    const waText = encodeURIComponent(`Hi, I am visiting your website "${meta.business_name}" and want to inquire about your services.`);
    const waLink = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : '#';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seoTitle || meta.business_name}</title>
  <meta name="description" content="${content.seoDescription || ''}">
  <link rel="stylesheet" href="css/templates.css">
  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
  <style>
    :root {
      --brand-color: ${activeColor};
      --brand-color-dark: ${activeColor}dd;
      --brand-bg-light: ${activeColor}15;
    }
    html {
      scroll-behavior: smooth;
    }
  </style>
</head>
<body class="${bodyClass} site-wrapper">

  <!-- 1. HEADER SECTION -->
  <header class="site-header">
    <a href="#" class="site-logo">
      ${logoHtml}
    </a>
    <nav class="site-nav">
      <ul>
        <li><a href="#hero">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <!-- 2. HERO SECTION -->
  <section id="hero" class="hero-bg">
    <div class="section-container hero-content">
      <h1>${content.heroTitle}</h1>
      <p>${content.heroSubtitle}</p>
      <a href="#contact" class="btn btn-brand">${content.heroCTA}</a>
    </div>
  </section>

  <!-- 3. ABOUT SECTION -->
  <section id="about" class="site-section">
    <div class="section-container" style="max-width: 900px;">
      <h2 class="section-heading">${content.aboutTitle}</h2>
      <p class="section-subheading" style="margin-bottom: 30px;">${content.aboutDescription}</p>
      <p style="text-align: center; font-size: 1.05rem; line-height: 1.8; color: #4b5563;">
        ${content.aboutStory}
      </p>
    </div>
  </section>

  <!-- 4. SERVICES SECTION -->
  <section id="services" class="site-section" style="background-color: #f9fafb;">
    <div class="section-container">
      <h2 class="section-heading">Our Services</h2>
      <p class="section-subheading">We offer a wide range of specialized services to satisfy your business needs.</p>
      <div class="grid-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
        ${servicesHtml}
      </div>
    </div>
  </section>

  <!-- 5. TESTIMONIALS SECTION -->
  <section id="testimonials" class="site-section">
    <div class="section-container">
      <h2 class="section-heading">What Our Clients Say</h2>
      <p class="section-subheading">Hear directly from the business owners and clients who trust us.</p>
      <div class="grid-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
        ${testimonialsHtml}
      </div>
    </div>
  </section>

  <!-- 6. FAQ SECTION -->
  <section id="faq" class="site-section" style="background-color: #f9fafb;">
    <div class="section-container" style="max-width: 800px;">
      <h2 class="section-heading">Frequently Asked Questions</h2>
      <p class="section-subheading">Find immediate answers to common questions about our services.</p>
      <div class="faq-accordion">
        ${faqHtml}
      </div>
    </div>
  </section>

  <!-- 7. CONTACT SECTION -->
  <section id="contact" class="site-section">
    <div class="section-container">
      <h2 class="section-heading">${content.contactTitle || 'Get in Touch'}</h2>
      <p class="section-subheading">${content.contactSubtitle || 'Have questions? Drop us a message below!'}</p>
      
      <div class="tpl-contact-grid">
        <div class="tpl-contact-info">
          <h3>Contact Details</h3>
          <p style="color: #6b7280; margin-bottom: 12px;">Reach out directly and our customer team will respond shortly.</p>
          
          ${meta.phone ? `
          <div class="tpl-info-item">
            <div class="tpl-info-icon"><ion-icon name="call"></ion-icon></div>
            <div class="tpl-info-text">
              <h4>Phone Number</h4>
              <p><a href="tel:${meta.phone}">${meta.phone}</a></p>
            </div>
          </div>` : ''}

          ${meta.email ? `
          <div class="tpl-info-item">
            <div class="tpl-info-icon"><ion-icon name="mail"></ion-icon></div>
            <div class="tpl-info-text">
              <h4>Email Address</h4>
              <p><a href="mailto:${meta.email}">${meta.email}</a></p>
            </div>
          </div>` : ''}

          ${meta.address ? `
          <div class="tpl-info-item">
            <div class="tpl-info-icon"><ion-icon name="pin"></ion-icon></div>
            <div class="tpl-info-text">
              <h4>Office Address</h4>
              <p>${meta.address}</p>
            </div>
          </div>` : ''}
        </div>

        <div class="tpl-form">
          <form id="public-lead-form">
            <input type="hidden" name="websiteId" value="${meta.id}">
            
            <div class="tpl-form-group">
              <label class="tpl-form-label" for="lead-name">Your Name</label>
              <input class="tpl-form-input" type="text" id="lead-name" name="name" required placeholder="John Doe">
            </div>

            <div class="tpl-form-group">
              <label class="tpl-form-label" for="lead-email">Email Address</label>
              <input class="tpl-form-input" type="email" id="lead-email" name="email" required placeholder="john@example.com">
            </div>

            <div class="tpl-form-group">
              <label class="tpl-form-label" for="lead-phone">Phone Number (Optional)</label>
              <input class="tpl-form-input" type="tel" id="lead-phone" name="phone" placeholder="+91 98765 43210">
            </div>

            <div class="tpl-form-group">
              <label class="tpl-form-label" for="lead-message">Message</label>
              <textarea class="tpl-form-textarea" id="lead-message" name="message" rows="4" required placeholder="Describe your inquiry..."></textarea>
            </div>

            <button type="submit" class="btn btn-brand" style="width: 100%; border: none; font-size: 1rem; cursor: pointer; color: white;">
              Send Message
            </button>
            <div id="form-feedback" style="margin-top: 15px; font-weight: 500; text-align: center; display: none;"></div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- 8. FOOTER SECTION -->
  <footer style="text-align: center; padding: 40px 8%; background-color: #111827; color: #9ca3af; font-size: 0.9rem;">
    <div style="margin-bottom: 20px;">
      <h3 style="color: #ffffff; margin-bottom: 10px;">${meta.business_name}</h3>
      <p style="max-width: 500px; margin: 0 auto;">${content.ctaText}</p>
    </div>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 24px 0;">
    <p>&copy; ${new Date().getFullYear()} ${meta.business_name}. Powered by NexSite AI. All rights reserved.</p>
  </footer>

  <!-- 9. WHATSAPP FLOATING BUTTON -->
  ${meta.phone ? `
  <a href="${waLink}" class="wa-float-btn" target="_blank" aria-label="Chat on WhatsApp">
    <ion-icon name="logo-whatsapp"></ion-icon>
  </a>` : ''}

  <!-- 10. LEADS FORM INTEGRATION SCRIPT -->
  <script>
    document.getElementById('public-lead-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const form = this;
      const feedback = document.getElementById('form-feedback');
      const submitBtn = form.querySelector('button[type="submit"]');

      const websiteId = form.websiteId.value;
      const name = form.name.value;
      const email = form.email.value;
      const phone = form.phone.value;
      const message = form.message.value;

      feedback.style.display = 'block';
      feedback.style.color = '#4b5563';
      feedback.textContent = 'Submitting your message...';
      submitBtn.disabled = true;

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteId, name, email, phone, message })
        });
        const result = await response.json();

        if (result.success) {
          feedback.style.color = '#059669';
          feedback.textContent = result.message || 'Form submitted successfully!';
          form.reset();
        } else {
          feedback.style.color = '#dc2626';
          feedback.textContent = result.message || 'Failed to submit form.';
        }
      } catch (err) {
        feedback.style.color = '#dc2626';
        feedback.textContent = 'Network error. Please try again later.';
      } finally {
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
  }
};

// Export to work inside browser script tags AND CommonJS Node backend
if (typeof module !== 'undefined' && module.exports) {
  module.exports = templates;
} else {
  window.nexsiteTemplates = templates;
}
