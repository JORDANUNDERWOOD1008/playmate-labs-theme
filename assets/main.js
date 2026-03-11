/**
 * PLAYMATE LABS — GLOBAL JAVASCRIPT
 * Navigation, Cart, Animations, Utilities
 *
 * SHOPIFY VERSION:
 * The localStorage Cart object is preserved for compatibility but
 * is overridden by cart-api.js (Shopify AJAX Cart API).
 * CartDrawer.init() / Nav cart opener is handled by CartDrawerShopify in cart-api.js.
 */

// ============================================
//   UTILITIES
// ============================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function debounce(fn, wait) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
}

// ============================================
//   CART STATE
// ============================================

const Cart = {
  items: JSON.parse(localStorage.getItem('pl_cart') || '[]'),

  save() { localStorage.setItem('pl_cart', JSON.stringify(this.items)); },

  add(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) { existing.qty += (product.qty || 1); }
    else { this.items.push({ ...product, qty: product.qty || 1 }); }
    this.save();
    this.updateUI();
    // CartDrawer.open() — delegated to PLCartDrawer in cart-api.js
    if (window.PLCartDrawer) { window.PLCartDrawer.open(); } else { CartDrawer.open(); }
    showToast(`${product.name} added to cart`, 'success');
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.updateUI();
    CartDrawer.render();
  },

  updateQty(id, qty) {
    if (qty < 1) { this.remove(id); return; }
    const item = this.items.find(i => i.id === id);
    if (item) { item.qty = qty; this.save(); this.updateUI(); CartDrawer.render(); }
  },

  get count() { return this.items.reduce((s, i) => s + i.qty, 0); },
  get total() { return this.items.reduce((s, i) => s + (i.price * i.qty), 0); },

  updateUI() {
    const counts = $$('.cart-count');
    counts.forEach(el => {
      el.textContent = this.count;
      el.style.display = this.count > 0 ? 'flex' : 'none';
    });
  }
};

// ============================================
//   CART DRAWER
// ============================================

/**
 * CartDrawer in main.js is a legacy localStorage-based drawer.
 * On Shopify it is fully replaced by PLCartDrawer in cart-api.js.
 * This stub keeps any references alive without touching the DOM.
 */
const CartDrawer = {
  el: null,
  overlay: null,

  init() {
    /* Intentionally no-op — PLCartDrawer in cart-api.js owns all cart rendering.
       We do NOT call render() here; doing so would overwrite the Shopify cart
       with an empty localStorage-based view. */
    this.el = $('#cart-drawer');
    this.overlay = $('#cart-overlay');
  },

  open() {
    /* Delegate entirely to PLCartDrawer if available */
    if (window.PLCartDrawer) {
      window.PLCartDrawer.open();
    } else {
      this.el?.classList.add('open');
      this.overlay?.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }
  },

  close() {
    if (window.PLCartDrawer) {
      window.PLCartDrawer.close();
    } else {
      this.el?.classList.remove('open');
      this.overlay?.classList.remove('visible');
      document.body.style.overflow = '';
    }
  },

  /* render() disabled — PLCartDrawer uses Section Rendering API instead */
  render() {}
};

// ============================================
//   NAVIGATION
// ============================================

const Nav = {
  init() {
    const nav = $('nav.site-nav, .site-nav');
    if (!nav) return;

    // Scroll-based header switching removed — header always uses the solid design.
    // The .scrolled class is no longer toggled by JS.

    // Mobile toggle
    const toggle = $('.nav-toggle');
    const menu = $('.mobile-menu');
    const overlay = $('.mobile-menu-overlay');

    toggle?.addEventListener('click', () => {
      const open = menu?.classList.contains('open');
      toggle.classList.toggle('active', !open);
      menu?.classList.toggle('open', !open);
      overlay?.classList.toggle('visible', !open);
      document.body.style.overflow = open ? '' : 'hidden';
    });

    overlay?.addEventListener('click', () => {
      toggle?.classList.remove('active');
      menu?.classList.remove('open');
      overlay?.classList.remove('visible');
      document.body.style.overflow = '';
    });

    // Cart icon — delegated to PLCartDrawer (cart-api.js) to avoid conflicts
    // $$('[data-cart-open]') is handled by cart-api.js PLCartDrawer.init()

    Cart.updateUI();
  }
};

// ============================================
//   SCROLL REVEAL
// ============================================

const ScrollReveal = {
  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal, .reveal-left, .reveal-right').forEach((el, i) => {
      el.style.transitionDelay = `${(el.dataset.delay || 0) * 0.1}s`;
      observer.observe(el);
    });
  }
};

// ============================================
//   SCROLL TO TOP
// ============================================

const ScrollTop = {
  init() {
    const btn = $('.scroll-top-btn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};

// ============================================
//   TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info', duration = 3000) {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: '→', cart: '🛒' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '→'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse both';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================
//   NEWSLETTER POPUP
// ============================================

const NewsletterPopup = {
  init() {
    const popup = $('#newsletter-popup');
    if (!popup) return;

    // Never show if already subscribed
    try {
      if (localStorage.getItem('pl_popup_subscribed')) return;
    } catch(e) {}

    // 14-day cooldown after dismiss
    try {
      var dismissed = localStorage.getItem('pl_popup_dismissed');
      if (dismissed && (Date.now() - parseInt(dismissed)) < 14 * 24 * 60 * 60 * 1000) return;
    } catch(e) {}

    // Trigger: 30s delay OR 50% scroll (whichever first)
    var triggered = false;
    var triggerOnce = () => {
      if (triggered) return;
      triggered = true;
      this.show();
    };

    setTimeout(triggerOnce, 30000);

    var scrollHandler = () => {
      var scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPct >= 0.5) {
        triggerOnce();
        window.removeEventListener('scroll', scrollHandler);
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Exit intent (desktop only) — fires separate discount popup if main was dismissed
    if (window.innerWidth > 768) {
      document.addEventListener('mouseout', (e) => {
        if (e.clientY <= 0 && !triggered) {
          triggerOnce();
        } else if (e.clientY <= 0 && triggered) {
          this.showExitIntent();
        }
      });
    }

    // Event listeners
    $('#newsletter-popup-close')?.addEventListener('click', () => this.hide());
    $('#newsletter-popup-overlay')?.addEventListener('click', () => this.hide());
    $('#exit-popup-close')?.addEventListener('click', () => this.hideExit());
    $('#exit-popup-overlay')?.addEventListener('click', () => this.hideExit());

    $('#newsletter-popup-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit(e.target);
    });
  },

  show() {
    var popup = $('#newsletter-popup');
    if (!popup) return;
    popup.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  hide() {
    var popup = $('#newsletter-popup');
    if (!popup) return;
    popup.classList.remove('visible');
    document.body.style.overflow = '';
    try { localStorage.setItem('pl_popup_dismissed', String(Date.now())); } catch(e) {}
  },

  showExitIntent() {
    // Only show if main popup was dismissed and exit popup not shown this session
    try {
      if (localStorage.getItem('pl_popup_subscribed')) return;
      if (sessionStorage.getItem('pl_exit_shown')) return;
      var dismissed = localStorage.getItem('pl_popup_dismissed');
      if (!dismissed) return;
      // Don't show exit popup if dismissed less than 5 seconds ago (just closed main)
      if (Date.now() - parseInt(dismissed) < 5000) return;
      // 7-day cooldown for exit popup
      var exitDismissed = localStorage.getItem('pl_exit_dismissed');
      if (exitDismissed && (Date.now() - parseInt(exitDismissed)) < 7 * 24 * 60 * 60 * 1000) return;
    } catch(e) { return; }

    var exitPopup = $('#exit-intent-popup');
    if (!exitPopup) return;
    exitPopup.classList.add('visible');
    document.body.style.overflow = 'hidden';
    try { sessionStorage.setItem('pl_exit_shown', '1'); } catch(e) {}
  },

  hideExit() {
    var exitPopup = $('#exit-intent-popup');
    if (!exitPopup) return;
    exitPopup.classList.remove('visible');
    document.body.style.overflow = '';
    try { localStorage.setItem('pl_exit_dismissed', String(Date.now())); } catch(e) {}
  },

  submit(form) {
    const email = form.querySelector('[name="email"]')?.value;
    const phone = form.querySelector('[name="phone"]')?.value;
    try { localStorage.setItem('pl_popup_subscribed', '1'); } catch(e) {}
    showToast('Welcome to Playmate Labs! Check your inbox.', 'success');
    this.hide();
  }
};

// ============================================
//   ACCORDIONS
// ============================================

const Accordion = {
  init(container = document) {
    $$('.accordion-trigger', container).forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        const isOpen = item.classList.contains('open');
        // Close siblings
        const siblings = $$('.accordion-item', item.parentElement);
        siblings.forEach(s => s.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }
};

// ============================================
//   TABS
// ============================================

const Tabs = {
  init(container = document) {
    $$('.tab-btn', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        const parent = btn.closest('[data-tabs]') || document;

        $$('.tab-btn', parent).forEach(b => b.classList.remove('active'));
        $$('.tab-panel', parent).forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        $(`[data-panel="${target}"]`, parent)?.classList.add('active');
      });
    });
  }
};

// ============================================
//   FILTER SYSTEM
// ============================================

const FilterSystem = {
  init() {
    $$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        const value = btn.dataset.filter;

        // Update active state
        $$(`[data-group="${group}"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filter items
        const items = $$('[data-category]');
        items.forEach(item => {
          if (value === 'all' || item.dataset.category?.includes(value)) {
            item.style.display = '';
            setTimeout(() => item.style.opacity = '1', 10);
          } else {
            item.style.opacity = '0';
            setTimeout(() => item.style.display = 'none', 300);
          }
        });
      });
    });
  }
};

// ============================================
//   COUNTDOWN TIMER
// ============================================

function initCountdown(endDate, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function update() {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) {
      container.innerHTML = '<p class="label">This drop has ended</p>';
      return;
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const d = n => String(n).padStart(2, '0');

    container.innerHTML = `
      <div class="countdown">
        <div class="countdown-unit">
          <span class="countdown-number">${d(days)}</span>
          <span class="countdown-label">Days</span>
        </div>
        <span class="countdown-divider">:</span>
        <div class="countdown-unit">
          <span class="countdown-number">${d(hours)}</span>
          <span class="countdown-label">Hours</span>
        </div>
        <span class="countdown-divider">:</span>
        <div class="countdown-unit">
          <span class="countdown-number">${d(minutes)}</span>
          <span class="countdown-label">Mins</span>
        </div>
        <span class="countdown-divider">:</span>
        <div class="countdown-unit">
          <span class="countdown-number">${d(seconds)}</span>
          <span class="countdown-label">Secs</span>
        </div>
      </div>`;
  }

  update();
  setInterval(update, 1000);
}

// ============================================
//   IMAGE GALLERY (PDP)
// ============================================

const Gallery = {
  init() {
    const thumbs = $$('.gallery-thumb');
    const main = $('.gallery-main img');
    if (!thumbs.length || !main) return;

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const src = thumb.querySelector('img')?.src;
        if (src) main.src = src;
      });
    });
  }
};

// ============================================
//   QTY SELECTORS
// ============================================

function initQtySelectors() {
  $$('.qty-btn').forEach(btn => {
    if (btn.dataset.qtyInit) return;
    btn.dataset.qtyInit = '1';
    btn.addEventListener('click', () => {
      const selector = btn.closest('.qty-selector');
      const valueEl = selector?.querySelector('.qty-value');
      if (!valueEl) return;
      let val = parseInt(valueEl.textContent) || 1;
      val = btn.textContent.includes('−') ? Math.max(1, val - 1) : val + 1;
      valueEl.textContent = val;
    });
  });
}

// ============================================
//   FORM HANDLING (GENERIC)
// ============================================

function initForms() {
  $$('form[data-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const type = form.dataset.form;

      const submitBtn = form.querySelector('[type="submit"]');
      const origText = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
      }

      // Simulate API call
      setTimeout(() => {
        const messages = {
          'newsletter': 'You\'re on the list! Welcome to Playmate Labs.',
          'rsvp': 'RSVP confirmed! We\'ll see you there.',
          'experience': 'Your 5-day experience is on its way. Check your inbox!',
          'community': 'Welcome to the community! Expect an invitation soon.',
          'waitlist': 'You\'re on the waitlist. We\'ll notify you first.'
        };

        showToast(messages[type] || 'Submitted successfully!', 'success', 5000);

        // Show success state
        const successEl = form.nextElementSibling;
        if (successEl?.classList.contains('form-success')) {
          form.style.display = 'none';
          successEl.style.display = 'block';
        }

        if (submitBtn) {
          submitBtn.textContent = origText;
          submitBtn.disabled = false;
        }

        form.reset();
      }, 1200);
    });
  });
}

// ============================================
//   ADD TO CART BUTTONS
// ============================================

function initAddToCart() {
  $$('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.productId || 'product-' + Math.random();
      const name  = btn.dataset.productName || 'Product';
      const price = parseFloat(btn.dataset.productPrice) || 29.99;
      const icon  = btn.dataset.productIcon || '🌹';

      Cart.add({ id, name, price, icon });
    });
  });
}

// ============================================
//   SMOOTH ANCHOR SCROLL
// ============================================

function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 80; // nav height
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth'
      });
    });
  });
}

// ============================================
//   ACTIVE NAV LINK
// ============================================

function setActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
      link.style.color = 'var(--gold)';
    }
  });
}

// ============================================
//   INIT ALL
// ============================================

// ============================================
//   SEARCH BAR TOGGLE
// ============================================

const SearchBar = {
  init() {
    const searchBar = document.getElementById('search-bar');
    const searchToggle = document.getElementById('search-toggle');
    const searchClose = document.getElementById('search-close');
    if (!searchBar || !searchToggle) return;

    searchToggle.addEventListener('click', () => {
      searchBar.classList.toggle('open');
      if (searchBar.classList.contains('open')) {
        searchBar.querySelector('input')?.focus();
      }
    });

    searchClose?.addEventListener('click', () => {
      searchBar.classList.remove('open');
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') searchBar.classList.remove('open');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Nav.init();
  CartDrawer.init();
  ScrollReveal.init();
  ScrollTop.init();
  NewsletterPopup.init();
  Accordion.init();
  Tabs.init();
  FilterSystem.init();
  Gallery.init();
  SearchBar.init();
  initQtySelectors();
  initForms();
  initAddToCart();
  initSmoothScroll();
  setActiveNavLink();
});
