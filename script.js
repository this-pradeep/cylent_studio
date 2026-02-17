/* ============================================================
   CYLENT STUDIO — Main Script
   Interactions, Animations & Functionality
   ============================================================ */

'use strict';

/* ── Aperture Loader ────────────────────────────────────────── */
(function initLoader() {
  const loader     = document.getElementById('loader');
  const svg        = document.getElementById('apertureSvg');
  const maskRect   = document.getElementById('aMaskRect');
  const aOverlay   = document.getElementById('aOverlay');
  const hole       = document.getElementById('aHole');
  const glow       = document.getElementById('aGlow');
  const bladesGrp  = document.getElementById('aBlades');
  const logoCenter = document.getElementById('apertureLogoCenter');

  if (!loader) return;
  document.body.style.overflow = 'hidden';

  // Graceful fallback if SVG is not available
  if (!svg || !hole) {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
      initScrollAnimations();
      initCounters();
    }, 1600);
    return;
  }

  const W   = window.innerWidth;
  const H   = window.innerHeight;
  const cx  = W / 2;
  const cy  = H / 2;
  // Radius that fully covers all four corners
  const maxR = Math.sqrt(cx * cx + cy * cy) * 1.18;
  const N   = 8; // number of aperture blades

  // Configure SVG coordinate space to match viewport
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  maskRect.setAttribute('width', W);
  maskRect.setAttribute('height', H);
  aOverlay.setAttribute('width', W);
  aOverlay.setAttribute('height', H);

  /* Build a 2N-point star polygon simulating overlapping iris blades.
     Outer vertices = blade tips; inner vertices = blade notches.
     As the aperture opens, the inner radius merges toward the outer
     radius, softening the notches into a smooth circle. */
  function buildPoints(outerR, innerR, rotDeg) {
    const pts = [];
    const rot = rotDeg * Math.PI / 180;
    for (let i = 0; i < N * 2; i++) {
      const angle = (i / (N * 2)) * Math.PI * 2 + rot - Math.PI / 2;
      const r     = i % 2 === 0 ? outerR : innerR;
      pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  /* Build decorative blade lines from center to each outer vertex */
  function buildBladeLines(outerR, rotDeg) {
    bladesGrp.innerHTML = '';
    const rot = rotDeg * Math.PI / 180;
    for (let i = 0; i < N; i++) {
      const angle = (i / N) * Math.PI * 2 + rot - Math.PI / 2;
      const line  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', (cx + outerR * Math.cos(angle)).toFixed(1));
      line.setAttribute('y2', (cy + outerR * Math.sin(angle)).toFixed(1));
      bladesGrp.appendChild(line);
    }
  }

  // Initialise as a single centre point (fully closed)
  hole.setAttribute('points', `${cx},${cy}`);
  glow.setAttribute('points', `${cx},${cy}`);

  /* ── Phase 1: Show branding for ~1 s, then open the aperture ── */
  setTimeout(() => {

    // Fade the wordmark out as blades swing open
    if (logoCenter) logoCenter.style.opacity = '0';

    const OPEN_DURATION = 1500; // ms for iris to fully open
    const startTime = performance.now();

    function step(now) {
      const t      = Math.min((now - startTime) / OPEN_DURATION, 1);
      // Ease-in-out cubic — slow start, fast middle, slow finish
      const eased  = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const outerR = eased * maxR;
      // innerScale: starts at 0.60 (deep blade notches → iris look)
      // then rises to 1.0 (no notch → smooth iris fully open)
      const innerScale = 0.60 + 0.40 * eased;
      const innerR     = outerR * innerScale;
      // Slight counter-clockwise rotation mimics real aperture blade motion
      const rotation   = eased * -22.5;

      const pts = buildPoints(outerR, innerR, rotation);
      hole.setAttribute('points', pts);
      glow.setAttribute('points', pts);
      // Blade lines fade out as aperture opens
      const bladeOpacity = Math.max(0, 1 - eased * 2).toFixed(2);
      bladesGrp.setAttribute('stroke-opacity', bladeOpacity);
      buildBladeLines(outerR, rotation);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // Iris fully open — hide loader overlay
        setTimeout(() => {
          loader.classList.add('hidden');
          document.body.style.overflow = '';
          initScrollAnimations();
          initCounters();
        }, 250);
      }
    }

    requestAnimationFrame(step);

  }, 1100); // logo display duration

})();

/* ── Custom Cursor ──────────────────────────────────────────── */
(function initCursor() {
  const cursor   = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!cursor || !follower || window.matchMedia('(hover: none)').matches) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  (function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top  = followerY + 'px';
    requestAnimationFrame(animateFollower);
  })();

  document.addEventListener('mouseleave', () => {
    cursor.style.opacity   = '0';
    follower.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursor.style.opacity   = '1';
    follower.style.opacity = '1';
  });
})();

/* ── Navigation ─────────────────────────────────────────────── */
(function initNav() {
  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  if (!nav) return;

  // Scroll class
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === `#${id}` ? 'var(--gold)' : '';
        });
      }
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));
})();

/* ── Smooth Scroll ──────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    window.scrollTo({
      top: target.offsetTop - navH,
      behavior: 'smooth'
    });
  });
});

/* ── Scroll Reveal Animations ───────────────────────────────── */
function initScrollAnimations() {
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));
}

/* ── Animated Counters ──────────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      const duration = 1800;
      const startTime = performance.now();

      const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const update = (currentTime) => {
        const elapsed  = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        el.textContent = Math.round(ease(progress) * target);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ── Portfolio Filter ───────────────────────────────────────── */
(function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.portfolio-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      items.forEach(item => {
        const cats = item.dataset.category || '';
        const show = filter === 'all' || cats.split(' ').includes(filter);

        item.style.transition = 'opacity 0.4s, transform 0.4s';
        if (show) {
          item.classList.remove('hidden');
          requestAnimationFrame(() => {
            item.style.opacity   = '1';
            item.style.transform = 'scale(1)';
          });
        } else {
          item.style.opacity   = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.classList.add('hidden');
          }, 400);
        }
      });
    });
  });
})();

/* ── Testimonials (Editorial Split) ─────────────────────────── */
(function initTestimonials() {
  const items    = document.querySelectorAll('.testi-index-item');
  const quote    = document.getElementById('testiQuote');
  const avatar   = document.getElementById('testiAvatar');
  const nameEl   = document.getElementById('testiName');
  const roleEl   = document.getElementById('testiRole');
  const pauseBtn = document.getElementById('testiPauseBtn');
  if (!items.length || !quote) return;

  let current  = 0;
  let autoTimer;
  let isPaused = false;
  const total  = items.length;
  const DELAY  = 5000;

  function getActiveFill() {
    return items[current].querySelector('.tii-fill');
  }

  function resetFill(item) {
    const fill = item.querySelector('.tii-fill');
    if (!fill) return;
    fill.style.animation = 'none';
    fill.getBoundingClientRect(); // force reflow
    fill.style.animation = '';
    fill.style.animationPlayState = isPaused ? 'paused' : 'running';
  }

  function goTo(index) {
    const next = (index + total) % total;
    if (next === current) return;

    // Fade out text
    quote.classList.add('fading');
    nameEl.classList.add('fading');
    roleEl.classList.add('fading');

    // Deactivate old item and stop its fill
    items[current].classList.remove('active');
    const oldFill = items[current].querySelector('.tii-fill');
    if (oldFill) { oldFill.style.animation = 'none'; }

    current = next;
    const item = items[current];

    setTimeout(() => {
      // Swap content
      quote.textContent  = item.dataset.quote;
      nameEl.textContent = item.dataset.name;
      roleEl.textContent = item.dataset.role;
      avatar.textContent = item.dataset.init;
      avatar.style.background = item.dataset.grad;

      // Fade in
      quote.classList.remove('fading');
      nameEl.classList.remove('fading');
      roleEl.classList.remove('fading');

      // Activate new item + restart fill
      item.classList.add('active');
      resetFill(item);
    }, 320);

    if (!isPaused) resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    if (!isPaused) {
      autoTimer = setInterval(() => goTo(current + 1), DELAY);
    }
  }

  function setPaused(state) {
    isPaused = state;

    // Freeze or resume the progress bar animation
    const fill = getActiveFill();
    if (fill) fill.style.animationPlayState = isPaused ? 'paused' : 'running';

    // Toggle timer
    if (isPaused) {
      clearInterval(autoTimer);
    } else {
      resetAuto();
    }

    // Update button appearance and icons
    if (pauseBtn) {
      pauseBtn.classList.toggle('paused', isPaused);
      pauseBtn.setAttribute('aria-label', isPaused ? 'Resume testimonials' : 'Pause testimonials');
      pauseBtn.querySelector('.tpb-pause').style.display = isPaused ? 'none' : 'block';
      pauseBtn.querySelector('.tpb-play').style.display  = isPaused ? 'block' : 'none';
    }
  }

  // Click on index item
  items.forEach((item, i) => {
    item.addEventListener('click', () => { if (i !== current) goTo(i); });
  });

  // Pause / resume button
  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => setPaused(!isPaused));
  }

  // Kick off the first fill animation and auto-rotate
  resetFill(items[0]);
  resetAuto();
})();

/* ── Contact Form ────────────────────────────────────────────── */
(function initContactForm() {
  const form       = document.getElementById('contactForm');
  const submitBtn  = document.getElementById('submitBtn');
  const successMsg = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Animate button
    submitBtn.disabled   = true;
    submitBtn.innerHTML  = '<span class="btn-text">Sending…</span>';

    // Simulate send (replace with real endpoint)
    await new Promise(r => setTimeout(r, 1800));

    submitBtn.style.display = 'none';
    successMsg.classList.add('visible');
    form.reset();

    setTimeout(() => {
      submitBtn.style.display = '';
      submitBtn.disabled      = false;
      submitBtn.innerHTML     = '<span class="btn-text">Send Enquiry</span><span class="btn-icon">→</span>';
      successMsg.classList.remove('visible');
    }, 6000);
  });

  // Real-time input highlight
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', () => input.closest('.form-group')?.classList.add('focused'));
    input.addEventListener('blur',  () => input.closest('.form-group')?.classList.remove('focused'));
  });
})();

/* ── Parallax on hero bg strips ─────────────────────────────── */
(function initParallax() {
  const strips = document.querySelectorAll('.reel-strip');
  if (!strips.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        strips.forEach((strip, i) => {
          const speed = 0.08 + i * 0.04;
          strip.style.transform = `translateY(${scrollY * speed}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ── Magnetic Buttons ─────────────────────────────────────────── */
(function initMagneticBtns() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect   = btn.getBoundingClientRect();
      const cx     = rect.left + rect.width / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) * 0.25;
      const dy     = (e.clientY - cy) * 0.25;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ── Service card hover tilt ─────────────────────────────────── */
(function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.service-card, .portfolio-item').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = (e.clientX - rect.left) / rect.width  - 0.5;
      const y      = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ── Scroll-based section line ───────────────────────────────── */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position: fixed; top: 0; left: 0; height: 2px; z-index: 2000;
    background: linear-gradient(90deg, var(--gold-dim), var(--gold));
    width: 0%; transition: width 0.1s linear; pointer-events: none;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const doc    = document.documentElement;
    const pct    = (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
})();

/* ── Image grid stagger on scroll ────────────────────────────── */
(function initGridStagger() {
  const grid  = document.getElementById('portfolioGrid');
  if (!grid) return;
  const items = grid.querySelectorAll('.portfolio-item');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const i = entry.target.dataset.index || 0;
      entry.target.style.animationDelay = (i * 0.07) + 's';
      entry.target.classList.add('grid-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  // Add CSS for the class
  const style = document.createElement('style');
  style.textContent = `
    .portfolio-item {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
      transition-delay: var(--stagger, 0s);
    }
    .portfolio-item.grid-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  items.forEach((item, i) => {
    item.style.setProperty('--stagger', (i * 0.08) + 's');
    observer.observe(item);
  });
})();

/* ── Footer link hover underline ─────────────────────────────── */
(function initFooterLinks() {
  document.querySelectorAll('.footer-link').forEach(link => {
    link.style.backgroundImage   = 'linear-gradient(var(--gold), var(--gold))';
    link.style.backgroundRepeat  = 'no-repeat';
    link.style.backgroundSize    = '0% 1px';
    link.style.backgroundPosition = '0 100%';
    link.style.transition        = 'color 0.3s, background-size 0.3s';
    link.addEventListener('mouseenter', () => { link.style.backgroundSize = '100% 1px'; });
    link.addEventListener('mouseleave', () => { link.style.backgroundSize = '0% 1px'; });
  });
})();

/* ── Ticker pause on hover ───────────────────────────────────── */
(function initTicker() {
  const ticker = document.querySelector('.ticker');
  if (!ticker) return;
  ticker.addEventListener('mouseenter', () => { ticker.style.animationPlayState = 'paused'; });
  ticker.addEventListener('mouseleave', () => { ticker.style.animationPlayState = 'running'; });
})();
