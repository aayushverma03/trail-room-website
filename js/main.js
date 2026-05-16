/* ============================================================
   trial-rooms.ai — Site behaviour
   Lenis smooth scroll + GSAP scroll reveals + UI interactions
   ============================================================ */

/* ---------- 1. Lenis smooth scroll ---------- */
let lenis;
function initLenis() {
  if (typeof Lenis === 'undefined') { console.warn('Lenis not loaded'); return; }

  lenis = new Lenis({
    lerp: 0.065,          // lower = smoother / heavier
    wheelMultiplier: 1.0,
    smoothWheel: true,
    syncTouch: true,      // smooth touch too
    anchors: true,
  });
  console.log('Lenis initialised', lenis);

  if (typeof gsap !== 'undefined' && gsap.ticker) {
    lenis.on('scroll', () => {
      if (window.ScrollTrigger) ScrollTrigger.update();
    });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  window.__lenis = lenis;
}

/* Lenis-tied scroll parallax — visible motion across the page */
function initScrollParallax() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const registry = [
    { selector: '.hero-v2-video', factor: 0.16 },
    { selector: '.sub-hero-frame', factor: 0.14 },
    { selector: '.full-frame', factor: 0.12 },
    { selector: '.tech-104 .frame', factor: 0.14 },
    { selector: '.products-bento .ptile-frame', factor: 0.05 },
    { selector: '.bigstat .frame', factor: 0.10 },
  ];

  const items = [];
  registry.forEach(({ selector, factor }) => {
    document.querySelectorAll(selector).forEach((el) => items.push({ el, factor }));
  });
  if (!items.length) return;

  let pending = false;
  const update = () => {
    items.forEach(({ el, factor }) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      // skip while the element is still in its reveal animation (avoids fight with GSAP)
      if (parseFloat(getComputedStyle(el).opacity) < 0.95) return;
      const center = rect.top + rect.height / 2;
      const offset = (window.innerHeight / 2 - center) * factor;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
  };
  const onScroll = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { update(); pending = false; });
  };
  if (window.__lenis) window.__lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

/* ---------- 2. Navbar scrolled state ---------- */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile burger
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('mobile-open');
      burger.classList.toggle('active', open);
    });
  }

  // anchor links — let Lenis handle, but close mobile menu
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      links?.classList.remove('mobile-open');
      burger?.classList.remove('active');
      if (window.__lenis) {
        window.__lenis.scrollTo(target, { offset: -80 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ---------- 3. Scroll reveals ---------- */
function initReveals() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  // GSAP + ScrollTrigger path
  if (typeof gsap !== 'undefined' && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    els.forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    // hero load-in stagger
    gsap.from('[data-hero-stagger] > *', {
      yPercent: 110,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.08,
      delay: 0.15,
    });
    return;
  }

  // Fallback: IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}

/* ---------- 4. FAQ accordion ---------- */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
        }
      });
      item.classList.toggle('open', !open);
      a.style.maxHeight = open ? null : a.scrollHeight + 'px';
    });
  });
}

/* ---------- 5. Animated count-up for stats ---------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dur = 1600;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => io.observe(c));
}

/* ---------- 6. Build the Frame skeleton visual ---------- */
function buildSkeleton() {
  const hosts = document.querySelectorAll('.viz-skeleton');
  if (!hosts.length) return;
  // normalised joint coords (0-1) within each host box
  const joints = [
    [0.5, 0.06], [0.5, 0.20],                       // head, neck
    [0.28, 0.24], [0.72, 0.24],                     // shoulders
    [0.16, 0.44], [0.84, 0.44],                     // elbows
    [0.10, 0.62], [0.90, 0.62],                     // wrists
    [0.38, 0.50], [0.62, 0.50],                     // hips
    [0.34, 0.74], [0.66, 0.74],                     // knees
    [0.32, 0.96], [0.68, 0.96],                     // ankles
  ];
  const bones = [
    [0,1],[1,2],[1,3],[2,4],[3,5],[4,6],[5,7],
    [1,8],[1,9],[8,9],[8,10],[9,11],[10,12],[11,13],
  ];
  hosts.forEach((host) => {
    if (host.dataset.built) return;
    host.dataset.built = '1';
    const W = host.offsetWidth || 160;
    const H = host.offsetHeight || 300;
    bones.forEach(([a, b], i) => {
      const [x1, y1] = joints[a], [x2, y2] = joints[b];
      const dx = (x2 - x1) * W, dy = (y2 - y1) * H;
      const len = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      const bone = document.createElement('div');
      bone.className = 'bone';
      bone.style.left = x1 * W + 'px';
      bone.style.top = y1 * H + 'px';
      bone.style.width = len + 'px';
      bone.style.transform = `rotate(${ang}deg)`;
      bone.style.animation = `bonePulse 3s ${i * 0.12}s ease-in-out infinite`;
      host.appendChild(bone);
    });
    joints.forEach(([x, y], i) => {
      const j = document.createElement('div');
      j.className = 'joint';
      j.style.left = x * W + 'px';
      j.style.top = y * H + 'px';
      j.style.animation = `jointPulse 2.4s ${i * 0.08}s ease-in-out infinite`;
      host.appendChild(j);
    });
  });
}

/* ---------- 7. Animate the Vitals ring(s) ---------- */
function initVitalRing() {
  const rings = document.querySelectorAll('.vr-progress');
  if (!rings.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const r = en.target;
      const pct = parseFloat(r.dataset.pct || 82) / 100;
      r.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)';
      r.style.strokeDashoffset = parseFloat(r.dataset.len) * (1 - pct);
      io.unobserve(r);
    });
  }, { threshold: 0.5 });
  rings.forEach((ring) => {
    const len = ring.getTotalLength();
    ring.dataset.len = len;
    ring.style.strokeDasharray = len;
    ring.style.strokeDashoffset = len;
    io.observe(ring);
  });
}

/* ---------- 9. Demo form (Formspree) ---------- */
function initDemoForm() {
  document.querySelectorAll('.demo-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const action = form.getAttribute('action') || '';
      if (action.includes('REPLACE_ME')) {
        showFormMsg(form, 'Form endpoint not configured — replace REPLACE_ME with your Formspree URL.', 'err');
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      const original = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      try {
        const res = await fetch(action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          showFormMsg(form, 'Got it — we will be in touch shortly.', 'ok');
          form.reset();
        } else {
          showFormMsg(form, 'Something went wrong. Please try again.', 'err');
        }
      } catch {
        showFormMsg(form, 'Network error. Please try again.', 'err');
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
      }
    });
  });
}
function showFormMsg(form, msg, type) {
  let el = form.querySelector('.demo-form-msg');
  if (!el) {
    el = document.createElement('span');
    el.className = 'demo-form-msg';
    form.appendChild(el);
  }
  el.textContent = msg;
  el.className = `demo-form-msg ${type}`;
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initNav();
  initReveals();
  initFaq();
  initCounters();
  buildSkeleton();
  initVitalRing();
  initScrollParallax();
  initDemoForm();
  document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
});

/* keyframes injected for the skeleton/ring (kept here so CSS file stays static) */
const kf = document.createElement('style');
kf.textContent = `
@keyframes bonePulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
@keyframes jointPulse { 0%,100%{transform:translate(-4.5px,-4.5px) scale(1)} 50%{transform:translate(-4.5px,-4.5px) scale(1.5)} }
.nav-links.mobile-open {
  display: flex; position: fixed; inset: 64px 0 auto 0;
  flex-direction: column; gap: 0; background: var(--bg-elev);
  border-bottom: 1px solid var(--line); padding: 1rem var(--gut) 2rem;
}
.nav-links.mobile-open a { padding-block: 1rem; border-bottom: 1px solid var(--line); width: 100%; }
.nav-burger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav-burger.active span:nth-child(2) { opacity: 0; }
.nav-burger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
`;
document.head.appendChild(kf);
