/* ============================================================
   SD&G Contracting — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     NAVBAR — scroll effect & mobile toggle
  ---------------------------------------------------------- */
  const navbar    = document.querySelector('.navbar');
  const toggle    = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.nav-mobile');

  if (navbar) {
    const handleScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run on load
  }

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    // Close mobile nav when a link is clicked
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Highlight active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ----------------------------------------------------------
     FADE-UP ANIMATION on scroll
  ---------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-up');

  if (fadeEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    fadeEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all immediately
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ----------------------------------------------------------
     COUNTER ANIMATION (stats bar)
  ---------------------------------------------------------- */
  function animateCounter(el) {
    const target  = parseFloat(el.dataset.target);
    const suffix  = el.dataset.suffix || '';
    const prefix  = el.dataset.prefix || '';
    const duration = 1600;
    const start    = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = eased * target;

      if (Number.isInteger(target)) {
        el.textContent = prefix + Math.round(value).toLocaleString() + suffix;
      } else {
        el.textContent = prefix + value.toFixed(1) + suffix;
      }

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => counterObserver.observe(el));
  }

  /* ----------------------------------------------------------
     PROJECT FILTER
  ---------------------------------------------------------- */
  const filterBtns    = document.querySelectorAll('.filter-btn');
  const projectCards  = document.querySelectorAll('.project-card');

  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        projectCards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = '';
            setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 10);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => { card.style.display = 'none'; }, 300);
          }
        });
      });
    });
  }

  /* ----------------------------------------------------------
     CONTACT FORM — basic client-side validation
  ---------------------------------------------------------- */
  const contactForm = document.querySelector('.js-contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      const fields = contactForm.querySelectorAll('[required]');
      let valid = true;

      fields.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#e53e3e';
          valid = false;
        }
      });

      if (!valid) {
        e.preventDefault();
        return;
      }

      const btn = contactForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Sending...';
        btn.disabled = true;
      }
    });
  }

  /* ----------------------------------------------------------
     SMOOTH ANCHOR SCROLL (for in-page links)
  ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 90;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

});
