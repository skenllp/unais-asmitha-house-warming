document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================
     AUDIO — floating music FAB
  ========================================== */
  const bgAudio = document.getElementById('bg-audio');
  const audioToggle = document.getElementById('audio-toggle');

  function setAudioPlaying(playing) {
    if (!audioToggle) return;
    audioToggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    audioToggle.setAttribute('title', playing ? 'Pause background music' : 'Play background music');
    audioToggle.classList.toggle('is-playing', playing);
  }

  if (audioToggle && bgAudio) {
    audioToggle.addEventListener('click', () => {
      if (bgAudio.paused) {
        bgAudio.play().then(() => setAudioPlaying(true)).catch(() => {});
      } else {
        bgAudio.pause();
        setAudioPlaying(false);
      }
    });
    bgAudio.addEventListener('pause', () => setAudioPlaying(false));
    bgAudio.addEventListener('play', () => setAudioPlaying(true));
  }


  /* ==========================================
     0. INTRO SEQUENCE — loader -> opening doors (wait for tap) -> hero
     Flow: page loads -> loader animation plays -> loader hides ->
           opening screen shows and waits for user tap ->
           doors animate open -> music starts -> hero reveals
  ========================================== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = document.getElementById('loader');
  const opening = document.getElementById('opening');

  // Prevent scrolling during intro
  document.body.style.overflow = 'hidden';

  function playHeroIntro() {
    document.querySelectorAll('.hero [data-reveal]').forEach((el, i) => {
      window.setTimeout(() => el.classList.add('is-visible'), i * 90);
    });
    const frame = document.querySelector('.hero-frame[data-reveal]');
    if (frame) window.setTimeout(() => frame.classList.add('is-visible'), 0);
  }

  function finishIntro() {
    if (opening) opening.classList.add('is-done');
    document.body.style.overflow = '';
    playHeroIntro();
  }

  function openDoors() {
    if (!opening || opening.classList.contains('is-open')) return;
    opening.classList.add('is-open');
    opening.removeEventListener('click', openDoors);
    opening.removeEventListener('keydown', onOpeningKey);

    // Auto-play music when doors open
    if (bgAudio) {
      bgAudio.play()
        .then(() => setAudioPlaying(true))
        .catch(() => { /* autoplay blocked — user can tap FAB */ });
    }

    window.setTimeout(finishIntro, prefersReducedMotion ? 0 : 1150);
  }

  function onOpeningKey(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDoors(); }
  }

  // After the loader hides, attach tap/click listeners to the opening screen
  // and wait for the user — do NOT auto-open the doors
  function showOpening() {
    if (loader) loader.classList.add('is-hidden');
    if (opening) {
      opening.addEventListener('click', openDoors);
      opening.addEventListener('keydown', onOpeningKey);
    }
  }

  if (prefersReducedMotion) {
    showOpening();
  } else {
    // Let the loader animation play (~1.9 s), then reveal the opening screen
    const doShow = () => {
      if (loader && !loader.classList.contains('is-hidden')) showOpening();
    };
    window.setTimeout(doShow, 1900);
    window.addEventListener('load', () => window.setTimeout(doShow, 400));
  }

  /* ==========================================
     1. STICKY NAV + MOBILE MENU
  ========================================== */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 30);
  }, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ==========================================
     2. LIVE COUNTDOWN TIMER
     Target: 28 October 2026, 05:00 PM IST
  ========================================== */
  const targetDate = new Date('2026-10-28T17:00:00+05:30').getTime();
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  const countdownTimer = setInterval(() => {
    const diff = targetDate - Date.now();

    if (diff <= 0) {
      clearInterval(countdownTimer);
      [daysEl, hoursEl, minutesEl, secondsEl].forEach(el => { if (el) el.innerText = '00'; });
      const label = document.querySelector('.countdown-label');
      if (label) label.innerText = 'The ceremony has begun!';
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.innerText = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.innerText = String(seconds).padStart(2, '0');
  }, 1000);

  /* ==========================================
     3. SCROLL REVEAL (IntersectionObserver)
  ========================================== */
  const revealEls = document.querySelectorAll('[data-reveal]:not(.hero [data-reveal])');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ==========================================
     4. PARALLAX — Home Tour image
  ========================================== */
  const parallaxMedia = document.querySelector('[data-parallax] img');
  const parallaxSection = document.querySelector('.home-tour');
  let ticking = false;

  function updateParallax() {
    if (!parallaxMedia || !parallaxSection) return;
    const rect = parallaxSection.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) { ticking = false; return; }
    const progress = (vh - rect.top) / (vh + rect.height);
    const shift = (progress - 0.5) * 60; // -30px..30px
    parallaxMedia.style.transform = `translateY(${shift.toFixed(1)}px)`;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
  updateParallax();

  /* ==========================================
     5. BUTTON RIPPLE EFFECT
  ========================================== */
  document.querySelectorAll('[data-ripple]').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      this.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 650);
    });
  });

});
