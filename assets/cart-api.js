/**
 * PLAYMATE LABS — SHOPIFY AJAX CART API  (v2 — complete rewrite)
 * File: assets/cart-api.js
 *
 * Fixes:
 *  1. Intercepts BOTH #add-to-cart-form (product.liquid) AND
 *     #pdp-product-form (legacy) and any [data-add-to-cart] button
 *  2. Refreshes cart drawer HTML via Section Rendering API after every mutation
 *  3. Single source of truth for open/close — no conflict with main.js
 *  4. Handles selling_plan field correctly (subscription purchases)
 *  5. Wires up qty +/- and remove in the drawer after every refresh
 *  6. Works on the full cart page too (cart-page-inc / cart-page-dec)
 */

/* ─────────────────────────────────────────────
   SHOPIFY CART API WRAPPER
   ───────────────────────────────────────────── */
const ShopifyCart = {

  /** Add item(s) to cart */
  async add(variantId, quantity = 1, sellingPlanId = null, properties = {}) {
    const item = { id: parseInt(variantId, 10), quantity };
    if (sellingPlanId) item.selling_plan = parseInt(sellingPlanId, 10);
    if (Object.keys(properties).length) item.properties = properties;

    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: [item] })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.description || 'Could not add to cart');
    }
    return res.json();
  },

  /** Update line item quantity by key */
  async update(key, quantity) {
    const res = await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity })
    });
    if (!res.ok) throw new Error('Cart update failed');
    return res.json();
  },

  /** Get current cart JSON */
  async get() {
    const res = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
    return res.json();
  }
};

/* ─────────────────────────────────────────────
   CART DRAWER
   ───────────────────────────────────────────── */
const PLCartDrawer = {

  drawer:  null,
  overlay: null,
  inner:   null,
  _refreshing: false,

  init() {
    this.drawer  = document.getElementById('cart-drawer');
    this.overlay = document.getElementById('cart-overlay');
    this.inner   = document.getElementById('cart-drawer-inner');
    if (!this.drawer) return;

    /* Close triggers */
    this.overlay?.addEventListener('click', () => this.close());
    document.getElementById('cart-close')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    /* Open triggers — every [data-cart-open] element */
    document.querySelectorAll('[data-cart-open]').forEach(el =>
      el.addEventListener('click', () => this.open())
    );

    /* Delegated qty / remove inside drawer (re-bound after refresh) */
    this.drawer.addEventListener('click', e => this._handleDrawerClick(e));

    /* Quick-add buttons anywhere on page */
    document.addEventListener('click', e => {
      const btn = e.target.closest('.quick-add-to-cart, [data-add-to-cart]');
      if (!btn) return;
      e.preventDefault();
      const vid = btn.dataset.variantId || btn.dataset.addToCart;
      if (!vid) return;
      this._quickAdd(btn, vid);
    });

    /* Cart page qty/remove buttons */
    this._bindCartPage();

    /* Initial count refresh (no HTML refresh needed — Liquid already rendered it) */
    this._refreshCount();
  },

  open() {
    if (!this.drawer) return;
    this.drawer.classList.add('open');
    this.overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.drawer) return;
    this.drawer.classList.remove('open');
    this.overlay?.classList.remove('visible');
    document.body.style.overflow = '';
  },

  /* Refresh inner HTML via Section Rendering API, then re-bind qty buttons */
  async refresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    try {
      /* Section Rendering API: GET /?section_id=cart-drawer */
      const res = await fetch('/?section_id=cart-drawer', {
        headers: { Accept: 'text/html' }
      });
      if (!res.ok) throw new Error('Section render failed');
      const html  = await res.text();
      const parser = new DOMParser();
      const doc    = parser.parseFromString(html, 'text/html');

      /* Swap #cart-drawer-inner */
      const newInner = doc.getElementById('cart-drawer-inner');
      if (newInner && this.inner) {
        this.inner.innerHTML = newInner.innerHTML;
      }

      /* Swap item count in header */
      const newCount = doc.getElementById('cart-item-count');
      const curCount = document.getElementById('cart-item-count');
      if (newCount && curCount) curCount.textContent = newCount.textContent;

    } catch (err) {
      /* Fallback: just refresh the count badge */
      console.warn('[PLCartDrawer] Section refresh failed, falling back to count only:', err);
    } finally {
      this._refreshing = false;
    }
    await this._refreshCount();
  },

  async _refreshCount() {
    try {
      const cart = await ShopifyCart.get();
      const count = cart.item_count || 0;
      document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
      });
    } catch (e) { /* silent */ }
  },

  _handleDrawerClick(e) {
    const el = e.target.closest('[data-key]');
    if (!el) return;
    const key = el.dataset.key;

    if (e.target.closest('.cart-qty-inc')) {
      e.preventDefault();
      const valEl = el.closest('.cart-item')?.querySelector('.qty-value');
      const qty   = parseInt(valEl?.textContent || '1', 10);
      this._mutate(() => ShopifyCart.update(key, qty + 1));

    } else if (e.target.closest('.cart-qty-dec')) {
      e.preventDefault();
      const valEl = el.closest('.cart-item')?.querySelector('.qty-value');
      const qty   = parseInt(valEl?.textContent || '1', 10);
      this._mutate(() => ShopifyCart.update(key, Math.max(0, qty - 1)));

    } else if (e.target.closest('.cart-item-remove')) {
      e.preventDefault();
      this._mutate(() => ShopifyCart.update(key, 0));
    }
  },

  async _mutate(apiFn) {
    try {
      await apiFn();
      await this.refresh();
      /* If cart page is open, reload it to reflect changes */
      if (window.location.pathname === '/cart') window.location.reload();
    } catch (err) {
      PLToast.show('Something went wrong. Please try again.', 'error');
    }
  },

  async _quickAdd(btn, variantId) {
    const original = btn.innerHTML;
    btn.disabled  = true;
    btn.textContent = '…';
    try {
      const data = await ShopifyCart.add(variantId, 1);
      const name = data?.items?.[0]?.product_title || 'Item';
      PLToast.show(`${name} added to cart ✓`, 'success');
      await this.refresh();
      this.open();
    } catch (err) {
      PLToast.show(err.message || 'Could not add item', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  },

  _bindCartPage() {
    /* Cart page — delegated to document since items may not exist yet */
    document.querySelectorAll('.cart-page-dec').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key   = btn.dataset.key;
        const input = document.getElementById(`updates_${key}`);
        const newQty = Math.max(0, parseInt(input?.value || '1', 10) - 1);
        if (input) input.value = newQty;
        try { await ShopifyCart.update(key, newQty); window.location.reload(); }
        catch(e) { PLToast.show('Update failed', 'error'); }
      });
    });

    document.querySelectorAll('.cart-page-inc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key   = btn.dataset.key;
        const input = document.getElementById(`updates_${key}`);
        const newQty = parseInt(input?.value || '1', 10) + 1;
        if (input) input.value = newQty;
        try { await ShopifyCart.update(key, newQty); window.location.reload(); }
        catch(e) { PLToast.show('Update failed', 'error'); }
      });
    });

    document.querySelectorAll('.cart-page-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await ShopifyCart.update(btn.dataset.key, 0); window.location.reload(); }
        catch(e) { PLToast.show('Remove failed', 'error'); }
      });
    });
  }
};

/* ─────────────────────────────────────────────
   PRODUCT PAGE — ADD TO CART
   Handles: #add-to-cart-form (product.liquid)
            #pdp-product-form  (legacy / other templates)
   ───────────────────────────────────────────── */
const PLProductPage = {

  init() {
    /* Support both form IDs */
    const form = document.getElementById('add-to-cart-form')
               || document.getElementById('pdp-product-form');
    if (!form) return;

    const btn         = document.getElementById('atc-btn')
                      || document.getElementById('pdp-add-to-cart');
    const variantInput = document.getElementById('variant-id')
                       || document.getElementById('selected-variant-id');
    const qtyInput    = document.getElementById('cart-qty')
                      || document.getElementById('quantity-input');
    const planInput   = document.getElementById('selling-plan-id'); /* may be null */

    form.addEventListener('submit', async e => {
      e.preventDefault();

      const variantId = parseInt(variantInput?.value || '0', 10);
      if (!variantId) {
        PLToast.show('Please select a variant', 'error');
        return;
      }

      const quantity   = parseInt(qtyInput?.value || '1', 10) || 1;
      const sellingPlan = planInput?.value ? planInput.value : null;

      /* Disable button, show loading state */
      const originalHTML = btn?.innerHTML || '';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:0.5rem;"></i>Adding…';
      }

      try {
        const data = await ShopifyCart.add(variantId, quantity, sellingPlan);
        const name = data?.items?.[0]?.product_title || 'Item';

        if (btn) {
          btn.innerHTML = '<i class="fas fa-check" style="margin-right:0.5rem;"></i>Added to cart!';
          btn.style.background = '#2d7a3a';
        }

        PLToast.show(`${name} added to cart`, 'success');

        /* Refresh drawer then open it */
        await PLCartDrawer.refresh();
        PLCartDrawer.open();

      } catch (err) {
        PLToast.show(err.message || 'Could not add to cart. Please try again.', 'error');
        if (btn) {
          btn.disabled  = false;
          btn.innerHTML = originalHTML;
          btn.style.background = '';
        }
        return;
      }

      /* Reset button after 2.5s */
      setTimeout(() => {
        if (btn) {
          btn.disabled  = false;
          btn.innerHTML = originalHTML;
          btn.style.background = '';
        }
      }, 2500);
    });

    /* Variant buttons — update price + variant ID display */
    this._bindVariantButtons(variantInput);

    /* Quantity adjuster */
    this._bindQtyAdjuster();
  },

  _bindVariantButtons(variantInput) {
    document.querySelectorAll('.variant-btn, .pdp-variant-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        /* Un-select siblings in same group */
        const group = this.closest('[data-option-group], .pdp-option-group, div')
                    || this.parentElement;
        group.querySelectorAll('.variant-btn, .pdp-variant-btn').forEach(b => {
          b.classList.remove('active');
          b.style.borderColor = '';
          b.style.background  = '';
          b.style.color       = '';
        });
        this.classList.add('active');
        this.style.borderColor = 'var(--burgundy, #6B2737)';
        this.style.background  = 'var(--burgundy, #6B2737)';
        this.style.color       = '#fff';

        /* Match variant */
        const variants = window.playmatelabsVariants || [];
        if (!variants.length) return;

        const selectedOptions = [];
        document.querySelectorAll('[data-option-group], .pdp-option-group').forEach(grp => {
          const active = grp.querySelector('.variant-btn.active, .pdp-variant-btn.active');
          if (active) selectedOptions.push(active.dataset.value || active.dataset.optionValue);
        });

        /* Fallback: collect all active variant-btn values */
        if (!selectedOptions.length) {
          document.querySelectorAll('.variant-btn.active').forEach(b => {
            selectedOptions.push(b.dataset.value);
          });
        }

        const matched = variants.find(v =>
          v.options.length === selectedOptions.length &&
          v.options.every((opt, i) => opt === selectedOptions[i])
        ) || variants.find(v => v.options.some(opt => selectedOptions.includes(opt)));

        if (matched && variantInput) {
          variantInput.value = matched.id;

          /* Update price displays */
          const price = (matched.price / 100).toFixed(2);
          const fmt   = `£${price}`;
          const priceEls = document.querySelectorAll(
            '#onetime-price, .product-price-amount, #pdp-price-display, [data-variant-price]'
          );
          priceEls.forEach(el => { el.textContent = fmt; });

          /* Update ATC button label */
          const lbl = document.getElementById('atc-label');
          if (lbl) lbl.textContent = `Add to Cart — ${fmt}`;

          /* Availability */
          const atcBtn = document.getElementById('atc-btn')
                       || document.getElementById('pdp-add-to-cart');
          if (atcBtn) {
            atcBtn.disabled = !matched.available;
            if (!matched.available) atcBtn.innerHTML = 'Sold Out';
          }
        }
      });
    });
  },

  _bindQtyAdjuster() {
    /* Already bound inline for #quantity / adjustQty() in product.liquid — just patch cart-qty sync */
    const quantityInput = document.getElementById('quantity');
    const cartQtyInput  = document.getElementById('cart-qty');
    if (quantityInput && cartQtyInput) {
      quantityInput.addEventListener('input', () => {
        cartQtyInput.value = quantityInput.value;
      });
    }
  }
};

/* ─────────────────────────────────────────────
   TOAST NOTIFICATIONS (fallback if main.js missing)
   ───────────────────────────────────────────── */
const PLToast = {
  show(msg, type = 'success') {
    /* Use existing showToast from main.js if available */
    if (typeof showToast === 'function') { showToast(msg, type); return; }

    const container = document.getElementById('toast-container')
                    || document.body;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.style.cssText = [
      'position:fixed', 'bottom:1.5rem', 'right:1.5rem', 'z-index:9999',
      'background:' + (type === 'success' ? '#2d7a3a' : '#cc3333'),
      'color:#fff', 'padding:0.75rem 1.25rem', 'border-radius:8px',
      'font-size:0.875rem', 'font-weight:500', 'box-shadow:0 4px 16px rgba(0,0,0,.2)',
      'transition:opacity 0.3s', 'max-width:320px'
    ].join(';');
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }
};

/* ─────────────────────────────────────────────
   BOOT
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  PLCartDrawer.init();
  PLProductPage.init();

  /* Neutralise main.js cart-open listener conflict:
     Override the old CartDrawer.open() to delegate to PLCartDrawer */
  if (window.CartDrawer) {
    window.CartDrawer.open  = () => PLCartDrawer.open();
    window.CartDrawer.close = () => PLCartDrawer.close();
  }
});
