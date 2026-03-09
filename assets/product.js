/**
 * PLAYMATE LABS — Product Page JavaScript
 */
document.addEventListener('DOMContentLoaded', () => {

  // Variant selection
  document.querySelectorAll('.pdp-variant-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pdp-variant-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Purchase type selection updates price
  document.querySelectorAll('.purchase-option input').forEach(radio => {
    radio.addEventListener('change', () => {
      const isSubscribe = radio.value === 'subscribe';
      const priceEl = document.querySelector('.pdp-price-current');
      const atcBtn = document.querySelector('.pdp-atc');
      const mobilePrice = document.querySelector('.pdp-sticky-mobile p:last-of-type');
      
      if (isSubscribe) {
        if (priceEl) priceEl.textContent = '£58';
        if (atcBtn) {
          atcBtn.textContent = 'Subscribe — £58/mo';
          atcBtn.dataset.productPrice = '58';
        }
        if (mobilePrice) mobilePrice.textContent = '£58/mo';
      } else {
        if (priceEl) priceEl.textContent = '£68';
        if (atcBtn) {
          atcBtn.innerHTML = '<i class="fas fa-shopping-bag"></i> Add to Cart — £68';
          atcBtn.dataset.productPrice = '68';
        }
        if (mobilePrice) mobilePrice.textContent = '£68';
      }
    });
  });

  // Gallery thumbnails
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const mainGallery = document.getElementById('gallery-main');
  
  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      
      // Fade transition
      if (mainGallery) {
        mainGallery.style.opacity = '0';
        mainGallery.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
          // In a real app, swap the image src here
          mainGallery.style.opacity = '1';
        }, 200);
      }
    });
  });

  // Sticky ATC — show on mobile scroll
  const stickyATC = document.querySelector('.pdp-sticky-mobile');
  const mainATC = document.querySelector('.pdp-atc');
  
  if (stickyATC && mainATC) {
    const observer = new IntersectionObserver(([entry]) => {
      // Hide sticky when main ATC is visible
      stickyATC.style.display = entry.isIntersecting ? 'none' : 'flex';
    }, { threshold: 0.1 });
    
    observer.observe(mainATC);
  }

  // ATC with quantity
  const atcBtn = document.querySelector('.pdp-atc');
  if (atcBtn) {
    atcBtn.addEventListener('click', () => {
      const qtyEl = document.querySelector('.qty-value');
      const qty = parseInt(qtyEl?.textContent) || 1;
      
      Cart.add({
        id: atcBtn.dataset.productId,
        name: atcBtn.dataset.productName,
        price: parseFloat(atcBtn.dataset.productPrice),
        icon: atcBtn.dataset.productIcon,
        qty: qty
      });
    });
  }

  // Re-init qty selectors
  initQtySelectors();

});
