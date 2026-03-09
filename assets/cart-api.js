/**
 * PLAYMATE LABS — SHOPIFY AJAX CART API
 * File: assets/cart-api.js
 * 
 * Replaces the localStorage cart from main.js.
 * All cart actions call the Shopify /cart/ AJAX API.
 * Cart drawer is server-rendered via snippets/cart-drawer.liquid
 * and refreshed by fetching /cart.js for counts.
 */

const ShopifyCart = {

  /**
   * Add a variant to the cart
   * @param {number} variantId  - Shopify variant ID
   * @param {number} quantity   - Quantity to add
   * @param {object} properties - Line item properties (optional)
   */
  async add(variantId, quantity = 1, properties = {}) {
    try {
      const body = {
        items: [{ id: variantId, quantity, properties }]
      };
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Add to cart failed');
      const data = await res.json();
      await this.refreshDrawer();
      CartDrawerShopify.open();
      showToast(`${data.items[0].product_title} added to cart`, 'success');
      return data;
    } catch (err) {
      showToast('Could not add to cart. Please try again.', 'error');
      console.error('[ShopifyCart.add]', err);
    }
  },

  /**
   * Update a line item quantity by key
   */
  async updateItem(key, quantity) {
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      if (!res.ok) throw new Error('Update failed');
      const cart = await res.json();
      await this.refreshDrawer();
      return cart;
    } catch (err) {
      console.error('[ShopifyCart.updateItem]', err);
    }
  },

  /**
   * Remove a line item by key
   */
  async removeItem(key) {
    return this.updateItem(key, 0);
  },

  /**
   * Fetch the current cart state
   */
  async get() {
    const res = await fetch('/cart.js');
    return res.json();
  },

  /**
   * Refresh the cart count badge in the nav
   */
  async refreshCount() {
    const cart = await this.get();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = cart.item_count;
      el.style.display = cart.item_count > 0 ? 'flex' : 'none';
    });
    // Also update cart drawer item count text
    const countEl = document.getElementById('cart-item-count');
    if (countEl) {
      countEl.textContent = `${cart.item_count} ${cart.item_count === 1 ? 'item' : 'items'}`;
    }
    return cart;
  },

  /**
   * Refresh the cart drawer HTML via fetch
   */
  async refreshDrawer() {
    try {
      const res = await fetch('/?section_id=cart-drawer-content');
      if (!res.ok) return this.refreshCount();
      // Refresh count minimally (full section refresh may not be set up)
      await this.refreshCount();
    } catch (e) {
      await this.refreshCount();
    }
  }
};

/**
 * Cart Drawer Controller (Shopify version)
 * Works with the server-rendered snippets/cart-drawer.liquid
 */
const CartDrawerShopify = {
  el: null,
  overlay: null,

  init() {
    this.el = document.getElementById('cart-drawer');
    this.overlay = document.getElementById('cart-overlay');
    if (!this.el) return;

    // Close triggers
    this.overlay?.addEventListener('click', () => this.close());
    document.getElementById('cart-close')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    // Open triggers
    document.querySelectorAll('[data-cart-open]').forEach(el => {
      el.addEventListener('click', () => this.open());
    });

    // Quantity buttons in drawer
    this.el.addEventListener('click', async (e) => {
      const key = e.target.closest('[data-key]')?.dataset.key;
      if (!key) return;

      if (e.target.closest('.cart-qty-inc')) {
        const qty = parseInt(e.target.closest('.cart-item')?.querySelector('.qty-value')?.textContent || '1');
        await ShopifyCart.updateItem(key, qty + 1);
      } else if (e.target.closest('.cart-qty-dec')) {
        const qty = parseInt(e.target.closest('.cart-item')?.querySelector('.qty-value')?.textContent || '1');
        await ShopifyCart.updateItem(key, qty - 1);
      } else if (e.target.closest('.cart-item-remove')) {
        await ShopifyCart.removeItem(key);
      }
    });

    // Quick add to cart buttons (cross-sells, product cards)
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.quick-add-to-cart, [data-add-to-cart]');
      if (!btn) return;
      e.preventDefault();

      const variantId = btn.dataset.variantId || btn.dataset.productId;
      if (!variantId) return;

      btn.disabled = true;
      btn.textContent = 'Adding…';

      const qty = parseInt(document.getElementById('qty-value')?.textContent || '1');
      await ShopifyCart.add(parseInt(variantId), qty);

      btn.disabled = false;
      btn.textContent = '+ Add';
    });

    // Cart page qty buttons
    document.querySelectorAll('.cart-page-dec').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const input = document.getElementById(`updates_${key}`);
        if (!input) return;
        const newQty = Math.max(0, parseInt(input.value) - 1);
        input.value = newQty;
        await ShopifyCart.updateItem(key, newQty);
        if (newQty === 0) window.location.reload();
      });
    });

    document.querySelectorAll('.cart-page-inc').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const input = document.getElementById(`updates_${key}`);
        if (!input) return;
        const newQty = parseInt(input.value) + 1;
        input.value = newQty;
        await ShopifyCart.updateItem(key, newQty);
        window.location.reload(); // Reload to refresh totals on cart page
      });
    });

    document.querySelectorAll('.cart-page-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await ShopifyCart.removeItem(btn.dataset.key);
        window.location.reload();
      });
    });

    ShopifyCart.refreshCount();
  },

  open() {
    this.el?.classList.add('open');
    this.overlay?.classList.add('visible');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.el?.classList.remove('open');
    this.overlay?.classList.remove('visible');
    document.body.style.overflow = '';
  }
};

// ============================================
//   PRODUCT PAGE — ADD TO CART
// ============================================

const ProductPageShopify = {
  init() {
    const form = document.getElementById('pdp-product-form');
    if (!form) return;

    const btn = document.getElementById('pdp-add-to-cart');
    const qtyValue = document.getElementById('qty-value');
    const qtyInput = document.getElementById('quantity-input');
    const variantInput = document.getElementById('selected-variant-id');

    // Qty controls
    document.getElementById('qty-dec')?.addEventListener('click', () => {
      const current = parseInt(qtyValue.textContent || '1');
      if (current > 1) {
        qtyValue.textContent = current - 1;
        qtyInput.value = current - 1;
      }
    });

    document.getElementById('qty-inc')?.addEventListener('click', () => {
      const current = parseInt(qtyValue.textContent || '1');
      qtyValue.textContent = current + 1;
      qtyInput.value = current + 1;
    });

    // Variant buttons
    document.querySelectorAll('.pdp-variant-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const position = parseInt(this.dataset.optionPosition);
        const value = this.dataset.optionValue;

        // Update button states
        this.closest('.pdp-variant-btns')?.querySelectorAll('.pdp-variant-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Find matching variant
        const options = [];
        document.querySelectorAll('.pdp-option-group').forEach(group => {
          const activeBtn = group.querySelector('.pdp-variant-btn.active');
          if (activeBtn) options.push(activeBtn.dataset.optionValue);
        });

        // Match variant from window.playmatelabsVariants (injected below)
        const variants = window.playmatelabsVariants || [];
        const matched = variants.find(v =>
          v.options.every((opt, i) => opt === options[i])
        );

        if (matched) {
          variantInput.value = matched.id;
          // Update price display
          const priceEl = document.getElementById('pdp-price-display');
          const btnPriceEl = document.getElementById('pdp-btn-price');
          if (priceEl && matched.price) {
            const formatted = window.Shopify?.moneyFormat
              ? window.Shopify.moneyFormat.replace('{{amount}}', (matched.price / 100).toFixed(2))
              : `£${(matched.price / 100).toFixed(2)}`;
            priceEl.textContent = formatted;
            if (btnPriceEl) btnPriceEl.textContent = formatted;
          }
          // Availability
          const atcBtn = document.getElementById('pdp-add-to-cart');
          if (atcBtn) {
            atcBtn.disabled = !matched.available;
            atcBtn.textContent = matched.available ? `Add to Cart — ${priceEl?.textContent || ''}` : 'Sold Out';
          }
        }
      });
    });

    // Add to cart submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const variantId = parseInt(variantInput.value);
      const qty = parseInt(qtyInput.value || '1');

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span style="opacity:0.7">Adding…</span>';
      }

      await ShopifyCart.add(variantId, qty);

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:0.5rem;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Added ✓`;
        setTimeout(() => {
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:0.5rem;"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Add to Cart`;
        }, 2000);
      }
    });
  }
};

// ============================================
//   INIT ALL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  CartDrawerShopify.init();
  ProductPageShopify.init();
});
