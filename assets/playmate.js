/* ============================================
   PLAYMATE LABS — MAIN JAVASCRIPT
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ============================================
  // HEADER SCROLL BEHAVIOR
  // ============================================
  const header = document.querySelector('.site-header');
  const announcement = document.querySelector('.announcement-bar');

  function handleScroll() {
    if (window.scrollY > 60) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Announcement bar close
  document.querySelector('.announcement-bar__close')?.addEventListener('click', function () {
    announcement?.remove();
    header?.classList.remove('has-announcement');
  });

  // ============================================
  // MOBILE NAV
  // ============================================
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const drawerOverlay = document.querySelector('.drawer-overlay');

  hamburger?.addEventListener('click', function () {
    hamburger.classList.toggle('active');
    mobileNav?.classList.toggle('open');
    drawerOverlay?.classList.toggle('active');
    document.body.style.overflow = mobileNav?.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile nav on overlay click
  drawerOverlay?.addEventListener('click', function () {
    hamburger?.classList.remove('active');
    mobileNav?.classList.remove('open');
    cartDrawer?.classList.remove('open');
    drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  // ============================================
  // CART DRAWER
  // ============================================
  const cartDrawer = document.querySelector('.cart-drawer');
  const cartBtns = document.querySelectorAll('[data-open-cart]');
  const cartClose = document.querySelector('.cart-drawer__close');

  function openCart() {
    cartDrawer?.classList.add('open');
    drawerOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    cartDrawer?.classList.remove('open');
    drawerOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  cartBtns.forEach(btn => btn.addEventListener('click', openCart));
  cartClose?.addEventListener('click', closeCart);

  // ============================================
  // COUNTDOWN TIMER
  // ============================================
  function startCountdown(targetEl, endDate) {
    if (!targetEl) return;

    function update() {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        targetEl.innerHTML = '<span style="color: var(--color-warm-grey); font-size: 0.9rem;">This drop has ended.</span>';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const dEl = targetEl.querySelector('[data-cd-days]');
      const hEl = targetEl.querySelector('[data-cd-hours]');
      const mEl = targetEl.querySelector('[data-cd-mins]');
      const sEl = targetEl.querySelector('[data-cd-secs]');

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  const countdownEl = document.querySelector('[data-countdown]');
  if (countdownEl) {
    const endDate = countdownEl.dataset.countdown || '2025-04-01T00:00:00';
    startCountdown(countdownEl, endDate);
  }

  // ============================================
  // SHOP CATEGORY TABS
  // ============================================
  const catTabs = document.querySelectorAll('.shop-cat-tab');
  catTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      catTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      // In live Shopify: filter products by category
      const cat = this.dataset.cat;
      console.log('Filter by:', cat);
    });
  });

  // ============================================
  // FILTER OPTIONS (SHOP)
  // ============================================
  document.querySelectorAll('.filter-option').forEach(opt => {
    opt.addEventListener('click', function () {
      this.classList.toggle('active');
    });
  });

  // ============================================
  // CITY FILTER (EVENTS)
  // ============================================
  document.querySelectorAll('.city-pill').forEach(pill => {
    pill.addEventListener('click', function () {
      document.querySelectorAll('.city-pill').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ============================================
  // FORM SELECTORS (Experience page)
  // ============================================
  document.querySelectorAll('.form-selector').forEach(sel => {
    sel.addEventListener('click', function () {
      const group = this.closest('.form-selectors');
      group?.querySelectorAll('.form-selector').forEach(s => s.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ============================================
  // PURCHASE OPTIONS (PDP)
  // ============================================
  document.querySelectorAll('.purchase-option').forEach(opt => {
    opt.addEventListener('click', function () {
      const group = this.closest('.pdp__purchase-box');
      group?.querySelectorAll('.purchase-option').forEach(o => o.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ============================================
  // PDP ACCORDIONS
  // ============================================
  document.querySelectorAll('.pdp-accordion__header').forEach(header => {
    header.addEventListener('click', function () {
      const accordion = this.closest('.pdp-accordion');
      accordion?.classList.toggle('open');
    });
  });

  // ============================================
  // QTY CONTROLS
  // ============================================
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const control = this.closest('.qty-control, .qty-control--large');
      const numEl = control?.querySelector('.qty-num');
      if (!numEl) return;
      let qty = parseInt(numEl.textContent) || 1;
      if (this.dataset.action === 'decrease') qty = Math.max(1, qty - 1);
      if (this.dataset.action === 'increase') qty = Math.min(99, qty + 1);
      numEl.textContent = qty;
    });
  });

  // ============================================
  // PDP THUMBNAIL GALLERY
  // ============================================
  document.querySelectorAll('.pdp__thumb').forEach(thumb => {
    thumb.addEventListener('click', function () {
      const gallery = this.closest('.pdp__gallery');
      gallery?.querySelectorAll('.pdp__thumb').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const src = this.querySelector('img')?.src;
      const mainImg = gallery?.querySelector('.pdp__main-image img');
      if (src && mainImg) mainImg.src = src;
    });
  });

  // ============================================
  // LEAD CAPTURE FORMS
  // ============================================
  document.querySelectorAll('[data-form="lead"]').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = this.querySelector('[name="email"]')?.value;
      const phone = this.querySelector('[name="phone"]')?.value;
      if (!email) { alert('Please enter your email address.'); return; }

      // Show success state
      const successEl = document.querySelector('[data-form-success]');
      if (successEl) {
        this.style.display = 'none';
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        showToast('🎉 You\'re in! Check your inbox for Day 1.', 'success');
      }
    });
  });

  // ============================================
  // ADD TO CART
  // ============================================
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const productName = this.dataset.productName || 'Product';

      // Animate button
      const original = this.textContent;
      this.textContent = 'Added ✓';
      this.style.background = 'var(--color-gold)';
      this.style.color = 'var(--color-espresso)';
      this.style.borderColor = 'var(--color-gold)';

      setTimeout(() => {
        this.textContent = original;
        this.style.background = '';
        this.style.color = '';
        this.style.borderColor = '';
      }, 2000);

      // Update cart count
      const badge = document.querySelector('.nav-action-btn__badge');
      if (badge) {
        const count = parseInt(badge.textContent) || 0;
        badge.textContent = count + 1;
        badge.style.animation = 'none';
        badge.offsetHeight; // reflow
        badge.style.animation = 'pulse-glow 0.5s ease';
      }

      showToast(`"${productName}" added to your cart`, 'success');
      openCart();
    });
  });

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%) translateY(20px);
      background: ${type === 'success' ? 'var(--color-espresso)' : 'var(--color-burgundy)'};
      color: var(--color-cream); padding: 0.85rem 1.75rem;
      border-radius: 100px; font-size: 0.85rem; font-weight: 500;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25); z-index: 9999;
      opacity: 0; transition: all 0.3s ease; white-space: nowrap;
      border: 1px solid rgba(201,169,110,0.25);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ============================================
  // INTERSECTION OBSERVER — FADE IN ANIMATIONS
  // ============================================
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.product-card, .event-card, .journal-card, .step, .benefit-card, .day-card, .timeline-day').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(25px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Stagger children
  document.querySelectorAll('.shop-highlights__grid, .events-preview__grid, .events-listing__grid, .how-it-works__steps, .testimonials-grid, .community-benefits__grid').forEach(grid => {
    const children = grid.querySelectorAll(':scope > *');
    children.forEach((child, i) => {
      child.style.transitionDelay = `${i * 0.1}s`;
    });
  });

  // ============================================
  // SMOOTH SCROLL
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================
  // RSVP BUTTON INTERACTION
  // ============================================
  document.querySelectorAll('[data-rsvp]').forEach(btn => {
    btn.addEventListener('click', function () {
      const event = this.dataset.rsvp || 'this event';
      const original = this.textContent;
      this.textContent = '✓ RSVP Confirmed!';
      this.style.background = 'var(--color-gold)';
      this.style.color = 'var(--color-espresso)';
      setTimeout(() => {
        this.textContent = original;
        this.style.background = '';
        this.style.color = '';
      }, 3000);
      showToast(`You're on the list for ${event}! Details coming soon.`, 'success');
    });
  });

  console.log('🎭 Playmate Labs — Phase 1 MVP initialized');
});
