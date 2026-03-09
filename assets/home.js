/**
 * PLAYMATE LABS — Homepage JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {

  // Parallax subtle effect on hero
  const hero = document.querySelector('.hero-section');
  const heroContent = document.querySelector('.hero-content-wrap');
  
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        const speed = 0.3;
        if (heroContent) {
          heroContent.style.transform = `translateY(${scrolled * speed}px)`;
        }
      }
    }, { passive: true });
  }

  // Animate stats numbers on scroll
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = el.textContent;
        
        // Simple number animation
        if (target.includes('k')) {
          const num = parseFloat(target);
          animateNumber(el, 0, num, 1500, 'k+');
        } else if (target.includes('.')) {
          animateNumber(el, 0, parseFloat(target), 1000, '', 1);
        } else if (target.includes('+')) {
          animateNumber(el, 0, parseInt(target), 1200, '+');
        }
        
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  
  statNumbers.forEach(el => statsObserver.observe(el));
  
  function animateNumber(el, start, end, duration, suffix = '', decimals = 0) {
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = start + (end - start) * eased;
      
      el.textContent = current.toFixed(decimals) + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  // Product card hover enhancement
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.zIndex = '2';
    });
    card.addEventListener('mouseleave', () => {
      card.style.zIndex = '';
    });
  });

  // UGC grid item hover
  document.querySelectorAll('.ugc-item').forEach(item => {
    item.addEventListener('click', () => {
      showToast('Follow #PlaymateLabs on Instagram for more', 'info');
    });
  });

});
