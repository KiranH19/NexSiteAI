// js/templates.js - 5 complete website template renderers

/**
 * Shared WhatsApp button HTML
 */
function whatsappFAB(phone) {
  const clean = phone?.replace(/\D/g, '') || '';
  const link  = clean ? `https://wa.me/${clean}` : '#';
  return `
    <a href="${link}" class="whatsapp-fab" target="_blank" title="Chat on WhatsApp" aria-label="WhatsApp">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>`;
}

/**
 * Shared contact form HTML
 */
function contactForm(websiteId) {
  return `
    <form class="tpl-contact-form" id="contact-form" onsubmit="handleContactSubmit(event, '${websiteId}')">
      <div class="form-group">
        <input type="text"  name="name"    placeholder="Your Name *"    required>
      </div>
      <div class="form-group">
        <input type="tel"   name="phone"   placeholder="Phone Number *" required>
      </div>
      <div class="form-group">
        <input type="email" name="email"   placeholder="Email Address">
      </div>
      <div class="form-group">
        <textarea name="message" placeholder="Your Message..."></textarea>
      </div>
      <button type="submit" class="submit-btn" id="submit-lead-btn">Send Message →</button>
    </form>`;
}

/**
 * Shared FAQ accordion items
 */
function faqItems(faqs) {
  return faqs.map((f, i) => `
    <div class="tpl-faq-item" id="faq-${i}">
      <div class="tpl-faq-q" onclick="toggleFAQ(${i})">
        <span>${f.question}</span>
        <span class="faq-icon">+</span>
      </div>
      <div class="tpl-faq-a">${f.answer}</div>
    </div>`).join('');
}

/**
 * Shared service cards
 */
function serviceCards(services, icons = ['🎯','⭐','🔥','💡','✨','🚀','💎','🎨']) {
  return services.map((s, i) => `
    <div class="tpl-service-card">
      <div class="tpl-service-icon">${icons[i % icons.length]}</div>
      <h3>${s.title}</h3>
      <p>${s.description}</p>
    </div>`).join('');
}

/**
 * Logo or business name nav brand
 */
function navBrand(name, logoUrl) {
  const img = logoUrl ? `<img src="${logoUrl}" alt="${name}" loading="lazy">` : '';
  return `${img}<span>${name}</span>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1: Coaching / Education
// ─────────────────────────────────────────────────────────────────────────────
function renderCoachingTemplate(data, biz) {
  const c = data.content_json;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.seoTitle}</title>
  <meta name="description" content="${c.seoDescription}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/templates.css">
</head>
<body class="tpl-site tpl-coaching">

  <!-- Nav -->
  <nav class="tpl-nav">
    <div class="tpl-container">
      <div class="tpl-nav-logo">${navBrand(biz.business_name, biz.logo_url)}</div>
      <ul class="tpl-nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#services">Courses</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </div>
  </nav>

  <!-- Hero -->
  <section class="tpl-hero">
    <div class="tpl-container">
      <h1>${c.heroTitle}</h1>
      <p>${c.heroSubtitle}</p>
      <div class="tpl-hero-btns">
        <a href="#contact" class="hero-btn-primary">Enroll Now →</a>
        <a href="#services" style="padding:14px 32px;border-radius:12px;border:2px solid #6C63FF;color:#6C63FF;font-weight:600;">View Courses</a>
      </div>
    </div>
  </section>

  <!-- About -->
  <section class="tpl-section" id="about">
    <div class="tpl-container">
      <h2 class="tpl-section-title">${c.aboutTitle}</h2>
      <p class="tpl-section-sub">${c.aboutDescription}</p>
    </div>
  </section>

  <!-- Services / Courses -->
  <section class="tpl-section-alt" id="services">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Our Courses</h2>
      <p class="tpl-section-sub">Expertly designed programs to accelerate your growth</p>
      <div class="tpl-services-grid">${serviceCards(c.services, ['📚','🎓','✏️','🔬','📐','🌟'])}</div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="tpl-section" id="faq">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Frequently Asked Questions</h2>
      <p class="tpl-section-sub">Everything you need to know before enrolling</p>
      <div class="tpl-faq-list">${faqItems(c.faq)}</div>
    </div>
  </section>

  <!-- CTA -->
  <section class="tpl-section-alt">
    <div class="tpl-container">
      <div class="tpl-cta">
        <h2>${c.ctaTitle}</h2>
        <p>${c.ctaText}</p>
        <a href="#contact" class="cta-btn">Get Started Today →</a>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section class="tpl-section" id="contact">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Contact Us</h2>
      <div class="tpl-contact-grid">
        <div class="tpl-contact-info">
          <h3>Get In Touch</h3>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📞</span><span>${biz.phone}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📧</span><span>${biz.email || 'info@' + biz.slug + '.com'}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📍</span><span>${biz.address}</span></div>
        </div>
        <div>${contactForm(biz.id)}</div>
      </div>
    </div>
  </section>

  <footer class="tpl-footer">© ${new Date().getFullYear()} ${biz.business_name}. All rights reserved. Powered by NexSite.</footer>
  ${whatsappFAB(biz.phone)}
  <script src="/js/site.js"></script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2: Clinic / Diagnostic
// ─────────────────────────────────────────────────────────────────────────────
function renderClinicTemplate(data, biz) {
  const c = data.content_json;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.seoTitle}</title>
  <meta name="description" content="${c.seoDescription}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/templates.css">
</head>
<body class="tpl-site tpl-clinic">

  <nav class="tpl-nav">
    <div class="tpl-container">
      <div class="tpl-nav-logo">${navBrand(biz.business_name, biz.logo_url)}</div>
      <ul class="tpl-nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Book Appointment</a></li>
      </ul>
    </div>
  </nav>

  <section class="tpl-hero">
    <div class="tpl-container">
      <h1>${c.heroTitle}</h1>
      <p>${c.heroSubtitle}</p>
      <div class="tpl-hero-btns">
        <a href="#contact" class="hero-btn-primary">Book Appointment</a>
        <a href="tel:${biz.phone}" style="padding:14px 32px;border-radius:12px;border:2px solid #0EA5E9;color:#0EA5E9;font-weight:600;">📞 Call Now</a>
      </div>
    </div>
  </section>

  <section class="tpl-section" id="about">
    <div class="tpl-container">
      <h2 class="tpl-section-title">${c.aboutTitle}</h2>
      <p class="tpl-section-sub">${c.aboutDescription}</p>
    </div>
  </section>

  <section class="tpl-section-alt" id="services">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Our Services</h2>
      <p class="tpl-section-sub">Comprehensive healthcare services under one roof</p>
      <div class="tpl-services-grid">${serviceCards(c.services, ['🩺','💊','🔬','🩻','🏥','❤️'])}</div>
    </div>
  </section>

  <section class="tpl-section" id="faq">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Patient FAQs</h2>
      <div class="tpl-faq-list">${faqItems(c.faq)}</div>
    </div>
  </section>

  <section class="tpl-section-alt">
    <div class="tpl-container">
      <div class="tpl-cta">
        <h2>${c.ctaTitle}</h2>
        <p>${c.ctaText}</p>
        <a href="#contact" class="cta-btn">Book Now →</a>
      </div>
    </div>
  </section>

  <section class="tpl-section" id="contact">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Book an Appointment</h2>
      <div class="tpl-contact-grid">
        <div class="tpl-contact-info">
          <h3>Contact Us</h3>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📞</span><span>${biz.phone}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📧</span><span>${biz.email || ''}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📍</span><span>${biz.address}</span></div>
        </div>
        <div>${contactForm(biz.id)}</div>
      </div>
    </div>
  </section>

  <footer class="tpl-footer">© ${new Date().getFullYear()} ${biz.business_name}. All rights reserved. Powered by NexSite.</footer>
  ${whatsappFAB(biz.phone)}
  <script src="/js/site.js"></script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3: Gym / Fitness
// ─────────────────────────────────────────────────────────────────────────────
function renderGymTemplate(data, biz) {
  const c = data.content_json;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.seoTitle}</title>
  <meta name="description" content="${c.seoDescription}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/templates.css">
</head>
<body class="tpl-site tpl-gym">

  <nav class="tpl-nav">
    <div class="tpl-container">
      <div class="tpl-nav-logo" style="color:#FF4500">${navBrand(biz.business_name, biz.logo_url)}</div>
      <ul class="tpl-nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#services">Programs</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Join Now</a></li>
      </ul>
    </div>
  </nav>

  <section class="tpl-hero" style="position:relative">
    <div class="tpl-container" style="position:relative;z-index:1">
      <h1 style="text-transform:uppercase;letter-spacing:-0.02em">${c.heroTitle}</h1>
      <p>${c.heroSubtitle}</p>
      <div class="tpl-hero-btns">
        <a href="#contact" class="hero-btn-primary">JOIN NOW 💪</a>
        <a href="tel:${biz.phone}" style="padding:14px 32px;border-radius:12px;border:2px solid #FF4500;color:#FF4500;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Call Us</a>
      </div>
    </div>
  </section>

  <section class="tpl-section" id="about">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="color:#FFF;text-transform:uppercase">${c.aboutTitle}</h2>
      <p class="tpl-section-sub" style="color:#aaa">${c.aboutDescription}</p>
    </div>
  </section>

  <section class="tpl-section-alt" id="services">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="color:#FFF;text-transform:uppercase">Training Programs</h2>
      <div class="tpl-services-grid">${serviceCards(c.services, ['🏋️','🥊','🧘','🏃','🚴','💪'])}</div>
    </div>
  </section>

  <section class="tpl-section" id="faq">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="color:#FFF">FAQs</h2>
      <div class="tpl-faq-list">${faqItems(c.faq)}</div>
    </div>
  </section>

  <section class="tpl-section-alt">
    <div class="tpl-cta" style="background:linear-gradient(135deg,#FF4500,#CC2200);color:white;border-radius:24px;margin:0 24px">
      <h2>${c.ctaTitle}</h2>
      <p>${c.ctaText}</p>
      <a href="#contact" class="cta-btn" style="background:white;color:#FF4500;font-weight:800;text-transform:uppercase;letter-spacing:.05em">Start Training →</a>
    </div>
  </section>

  <section class="tpl-section" id="contact">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="color:#FFF">GET IN TOUCH</h2>
      <div class="tpl-contact-grid">
        <div class="tpl-contact-info">
          <h3 style="color:#FF4500">Contact Info</h3>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📞</span><span>${biz.phone}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📧</span><span>${biz.email || ''}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📍</span><span>${biz.address}</span></div>
        </div>
        <div>${contactForm(biz.id)}</div>
      </div>
    </div>
  </section>

  <footer class="tpl-footer">© ${new Date().getFullYear()} ${biz.business_name}. All rights reserved. Powered by NexSite.</footer>
  ${whatsappFAB(biz.phone)}
  <script src="/js/site.js"></script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4: Restaurant / Cafe
// ─────────────────────────────────────────────────────────────────────────────
function renderRestaurantTemplate(data, biz) {
  const c = data.content_json;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.seoTitle}</title>
  <meta name="description" content="${c.seoDescription}">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/templates.css">
</head>
<body class="tpl-site tpl-restaurant">

  <nav class="tpl-nav">
    <div class="tpl-container">
      <div class="tpl-nav-logo" style="font-family:'Playfair Display',serif">${navBrand(biz.business_name, biz.logo_url)}</div>
      <ul class="tpl-nav-links">
        <li><a href="#about">Our Story</a></li>
        <li><a href="#services">Menu</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Reserve</a></li>
      </ul>
    </div>
  </nav>

  <section class="tpl-hero">
    <div class="tpl-container">
      <h1 style="font-family:'Playfair Display',serif">${c.heroTitle}</h1>
      <p>${c.heroSubtitle}</p>
      <div class="tpl-hero-btns">
        <a href="#contact" class="hero-btn-primary">Reserve a Table</a>
        <a href="#services" style="padding:14px 32px;border-radius:12px;border:2px solid #D2691E;color:#D2691E;font-weight:600">View Menu</a>
      </div>
    </div>
  </section>

  <section class="tpl-section" id="about">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="font-family:'Playfair Display',serif">${c.aboutTitle}</h2>
      <p class="tpl-section-sub">${c.aboutDescription}</p>
    </div>
  </section>

  <section class="tpl-section-alt" id="services">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="font-family:'Playfair Display',serif">Our Menu</h2>
      <p class="tpl-section-sub">Crafted with love and the finest ingredients</p>
      <div class="tpl-services-grid">${serviceCards(c.services, ['🍽️','🥘','🍜','🍛','☕','🍰'])}</div>
    </div>
  </section>

  <section class="tpl-section" id="faq">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="font-family:'Playfair Display',serif">Questions?</h2>
      <div class="tpl-faq-list">${faqItems(c.faq)}</div>
    </div>
  </section>

  <section class="tpl-section-alt">
    <div class="tpl-container">
      <div class="tpl-cta">
        <h2 style="font-family:'Playfair Display',serif">${c.ctaTitle}</h2>
        <p>${c.ctaText}</p>
        <a href="#contact" class="cta-btn">Make a Reservation →</a>
      </div>
    </div>
  </section>

  <section class="tpl-section" id="contact">
    <div class="tpl-container">
      <h2 class="tpl-section-title" style="font-family:'Playfair Display',serif">Find Us</h2>
      <div class="tpl-contact-grid">
        <div class="tpl-contact-info">
          <h3 style="font-family:'Playfair Display',serif">Visit Us</h3>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📞</span><span>${biz.phone}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📧</span><span>${biz.email || ''}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📍</span><span>${biz.address}</span></div>
        </div>
        <div>${contactForm(biz.id)}</div>
      </div>
    </div>
  </section>

  <footer class="tpl-footer">© ${new Date().getFullYear()} ${biz.business_name}. All rights reserved. Powered by NexSite.</footer>
  ${whatsappFAB(biz.phone)}
  <script src="/js/site.js"></script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5: Business / Agency
// ─────────────────────────────────────────────────────────────────────────────
function renderBusinessTemplate(data, biz) {
  const c = data.content_json;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.seoTitle}</title>
  <meta name="description" content="${c.seoDescription}">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/templates.css">
</head>
<body class="tpl-site tpl-business">

  <nav class="tpl-nav">
    <div class="tpl-container">
      <div class="tpl-nav-logo">${navBrand(biz.business_name, biz.logo_url)}</div>
      <ul class="tpl-nav-links">
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </div>
  </nav>

  <section class="tpl-hero">
    <div class="tpl-container">
      <h1>${c.heroTitle}</h1>
      <p>${c.heroSubtitle}</p>
      <div class="tpl-hero-btns">
        <a href="#contact" class="hero-btn-primary">Get Started →</a>
        <a href="#services" style="padding:14px 32px;border-radius:12px;border:2px solid #059669;color:#059669;font-weight:600">Our Services</a>
      </div>
    </div>
  </section>

  <section class="tpl-section" id="about">
    <div class="tpl-container">
      <h2 class="tpl-section-title">${c.aboutTitle}</h2>
      <p class="tpl-section-sub">${c.aboutDescription}</p>
    </div>
  </section>

  <section class="tpl-section-alt" id="services">
    <div class="tpl-container">
      <h2 class="tpl-section-title">What We Offer</h2>
      <p class="tpl-section-sub">Solutions tailored to grow your business</p>
      <div class="tpl-services-grid">${serviceCards(c.services, ['💼','📊','🎯','🔧','📱','🌐'])}</div>
    </div>
  </section>

  <section class="tpl-section" id="faq">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Frequently Asked Questions</h2>
      <div class="tpl-faq-list">${faqItems(c.faq)}</div>
    </div>
  </section>

  <section class="tpl-section-alt">
    <div class="tpl-container">
      <div class="tpl-cta">
        <h2>${c.ctaTitle}</h2>
        <p>${c.ctaText}</p>
        <a href="#contact" class="cta-btn">Start Now →</a>
      </div>
    </div>
  </section>

  <section class="tpl-section" id="contact">
    <div class="tpl-container">
      <h2 class="tpl-section-title">Contact Us</h2>
      <div class="tpl-contact-grid">
        <div class="tpl-contact-info">
          <h3>Let's Talk</h3>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📞</span><span>${biz.phone}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📧</span><span>${biz.email || ''}</span></div>
          <div class="tpl-contact-item"><span class="tpl-contact-item-icon">📍</span><span>${biz.address}</span></div>
        </div>
        <div>${contactForm(biz.id)}</div>
      </div>
    </div>
  </section>

  <footer class="tpl-footer">© ${new Date().getFullYear()} ${biz.business_name}. All rights reserved. Powered by NexSite.</footer>
  ${whatsappFAB(biz.phone)}
  <script src="/js/site.js"></script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main renderer — pick template by name
// ─────────────────────────────────────────────────────────────────────────────
function renderTemplate(templateName, websiteData) {
  const biz = websiteData;

  switch (templateName) {
    case 'coaching':    return renderCoachingTemplate(biz, biz);
    case 'clinic':      return renderClinicTemplate(biz, biz);
    case 'gym':         return renderGymTemplate(biz, biz);
    case 'restaurant':  return renderRestaurantTemplate(biz, biz);
    case 'business':
    default:            return renderBusinessTemplate(biz, biz);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview renderer — inline iframe inject
// ─────────────────────────────────────────────────────────────────────────────
function injectPreview(iframeEl, templateName, websiteData) {
  const html = renderTemplate(templateName, websiteData);
  const doc  = iframeEl.contentDocument || iframeEl.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}
