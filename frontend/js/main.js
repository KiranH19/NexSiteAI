// js/main.js - Landing page interactions

document.addEventListener('DOMContentLoaded', () => {

  // ── Smart nav: show Dashboard if logged in, Sign In if not ────────────────
  const navLoginBtn = document.getElementById('nav-login-btn');
  if (navLoginBtn) {
    const token = localStorage.getItem('nexsite_token');
    if (token) {
      navLoginBtn.textContent = 'My Dashboard';
      navLoginBtn.href        = 'dashboard.html';
      navLoginBtn.classList.replace('btn-secondary', 'btn-primary');
    }
  }

  // ── Navbar scroll effect ───────────────────────────────────────────────────
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }, { passive: true });

  // ── Smooth scroll for anchor links ────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Intersection Observer for scroll animations ────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // ── CTA buttons → chat page ────────────────────────────────────────────────
  document.querySelectorAll('[data-action="create-website"]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'chat.html';
    });
  });

  // ── Counter animation for stats ────────────────────────────────────────────
  function animateCounter(el, target, duration = 1500) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = Math.floor(start).toLocaleString('en-IN') + (el.dataset.suffix || '');
      if (start >= target) clearInterval(timer);
    }, 16);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count || '0');
        animateCounter(el, target);
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    statsObserver.observe(el);
  });
});
