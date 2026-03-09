/**
 * PLAYMATE LABS — Shop JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {

  // Mobile Filter Toggle
  const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
  const sidebar = document.querySelector('.shop-sidebar');
  
  mobileFilterToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    if (sidebar?.classList.contains('open')) {
      // Add overlay
      const overlay = document.createElement('div');
      overlay.id = 'filter-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1099;';
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.remove();
        document.body.style.overflow = '';
      });
    } else {
      document.getElementById('filter-overlay')?.remove();
      document.body.style.overflow = '';
    }
  });

  // Sort functionality
  const sortSelect = document.getElementById('sort-select');
  const productsGrid = document.getElementById('products-grid');

  sortSelect?.addEventListener('change', () => {
    const value = sortSelect.value;
    const cards = [...document.querySelectorAll('.product-card')];
    
    cards.sort((a, b) => {
      if (value === 'price-low') {
        const priceA = parseFloat(a.querySelector('.product-card-price')?.textContent?.replace('£','') || 0);
        const priceB = parseFloat(b.querySelector('.product-card-price')?.textContent?.replace('£','') || 0);
        return priceA - priceB;
      }
      if (value === 'price-high') {
        const priceA = parseFloat(a.querySelector('.product-card-price')?.textContent?.replace('£','') || 0);
        const priceB = parseFloat(b.querySelector('.product-card-price')?.textContent?.replace('£','') || 0);
        return priceB - priceA;
      }
      return 0;
    });
    
    // Re-insert sorted cards
    const labels = [...document.querySelectorAll('.shop-section-label')];
    if (productsGrid && value !== 'featured') {
      cards.forEach(card => {
        // Animate out
        card.style.opacity = '0';
        card.style.transform = 'scale(0.97)';
        card.style.transition = 'all 0.2s ease';
      });
      
      setTimeout(() => {
        cards.forEach(card => {
          card.style.opacity = '1';
          card.style.transform = '';
        });
      }, 200);
    }
  });

  // Sidebar radio filters
  document.querySelectorAll('input[name="cat"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const value = radio.value;
      filterProducts(value);
    });
  });

  function filterProducts(category) {
    const cards = document.querySelectorAll('.product-card');
    let count = 0;
    
    cards.forEach(card => {
      const cats = card.dataset.category || '';
      const show = category === 'all' || cats.includes(category);
      
      card.style.transition = 'opacity 0.3s, transform 0.3s';
      
      if (show) {
        card.style.display = '';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = '';
        }, 10);
        count++;
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.96)';
        setTimeout(() => { card.style.display = 'none'; }, 300);
      }
    });
    
    const countEl = document.getElementById('product-count');
    if (countEl) {
      setTimeout(() => {
        countEl.textContent = `Showing ${count} product${count !== 1 ? 's' : ''}`;
      }, 300);
    }
  }

  // Page number clicks
  document.querySelectorAll('.page-num').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.page-num').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.scrollTo({ top: document.querySelector('.shop-main')?.offsetTop - 80, behavior: 'smooth' });
    });
  });

});
