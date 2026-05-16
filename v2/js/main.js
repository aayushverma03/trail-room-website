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
    { selector: '.hero-trail-stage', factor: 0.14 },
    { selector: '.sub-hero-frame', factor: 0.18 },
    { selector: '.full-frame', factor: 0.16 },
    { selector: '.tech-104 .frame', factor: 0.14 },
    { selector: '.products-bento .ptile-frame', factor: 0.06 },
    { selector: '.bigstat .frame', factor: 0.12 },
    { selector: '.voice', factor: 0.04 },
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

/* ---------- 10. Hero cursor-trail scout deck ---------- */
function initHeroTrail() {
  const stage = document.querySelector('.hero-trail-stage');
  if (!stage) return;

  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const variants = ['skel', 'ring', 'score', 'rank', 'chip'];
  const names = ['M. Aydin', 'R. Adebayo', 'J. Vargas', 'L. Petrov', 'K. Tanaka', 'D. Silva', 'A. Castillo', 'J. Okafor'];
  const positions = ['CM', 'ST', 'CB', 'RB', 'LW', 'GK'];
  const cities = ['IST', 'LAG', 'BCN', 'KIE', 'TYO', 'SAO', 'MAD', 'LIS'];
  const metrics = ['knee · 142°', '8.42 m/s', 'stride · 1.78 m', 'flight · 0.61 s', 'asym · 4%', 'contact · 92 ms', 'jump · 52 cm'];

  let counter = 0;
  let lastSpawn = 0;

  function skelMarkup() {
    return `<span class="t-corner">POSE</span>
      <svg viewBox="0 0 90 130" width="56" height="80">
        <circle cx="48" cy="14" r="5" fill="#F4F5F7"/>
        <path d="M 46 21 L 38 50 L 26 80" stroke="#F4F5F7" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 38 50 L 54 60 L 62 80" stroke="#F4F5F7" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 43 32 L 28 38" stroke="#F4F5F7" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 45 32 L 56 28" stroke="#F4F5F7" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="66" cy="80" r="3.5" fill="#FFD23F"/>
      </svg>`;
  }
  function ringMarkup(pct) {
    const C = 2 * Math.PI * 32;
    const off = (C * (1 - pct / 100)).toFixed(1);
    return `<span class="t-corner">READINESS</span>
      <svg viewBox="0 0 80 80" width="64" height="64">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#1F2530" stroke-width="5"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="#FFD23F" stroke-width="5" stroke-linecap="round"
          stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off}" transform="rotate(-90 40 40)"/>
      </svg>
      <span class="t-num">${pct}</span>`;
  }
  function scoreMarkup(score) {
    return `<span class="t-corner">TEST SCORE</span>
      <span class="t-num">${score}<span>/100</span></span>`;
  }
  function rankMarkup(rank, name, meta, score) {
    return `<span class="t-rank-num">${rank}</span>
      <div class="t-name">${name}</div>
      <div class="t-meta">${meta}</div>
      <div class="t-bar" style="--w:${score}%"></div>
      <div class="t-score">${score}</div>`;
  }
  function chipMarkup(metric) {
    return `<span class="t-corner">METRIC</span>
      <span class="t-chip-text">${metric}</span>`;
  }

  function cardMarkup(variant, idx) {
    if (variant === 'skel') return skelMarkup();
    if (variant === 'ring') return ringMarkup(72 + (idx * 7) % 24);
    if (variant === 'score') return scoreMarkup(85 + (idx * 3) % 14);
    if (variant === 'rank') {
      const rank = String(((idx % 9) + 1)).padStart(2, '0');
      const name = names[idx % names.length];
      const meta = `${positions[idx % positions.length]} · ${15 + (idx % 4)} · ${cities[idx % cities.length]}`;
      const score = 78 + (idx * 5) % 18;
      return rankMarkup(rank, name, meta, score);
    }
    return chipMarkup(metrics[idx % metrics.length]);
  }

  function spawn(x, y) {
    const variant = variants[counter % variants.length];
    const card = document.createElement('div');
    card.className = `trail-card t-${variant}`;
    card.style.left = (x - 65) + 'px';
    card.style.top = (y - 82) + 'px';
    card.style.setProperty('--rot', (Math.random() * 14 - 7).toFixed(1) + 'deg');
    card.innerHTML = cardMarkup(variant, counter);
    stage.appendChild(card);
    if (!stage.classList.contains('has-cards')) stage.classList.add('has-cards');
    counter++;
    setTimeout(() => card.remove(), 1750);
  }

  stage.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - lastSpawn < 55) return;
    lastSpawn = now;
    const rect = stage.getBoundingClientRect();
    spawn(e.clientX - rect.left, e.clientY - rect.top);
  });

  // Touch: tap and drag spawn cards
  const handleTouch = (e) => {
    const t = e.touches && e.touches[0];
    if (!t) return;
    const now = performance.now();
    if (now - lastSpawn < 80) return;
    lastSpawn = now;
    const rect = stage.getBoundingClientRect();
    spawn(t.clientX - rect.left, t.clientY - rect.top);
  };
  stage.addEventListener('touchstart', handleTouch, { passive: true });
  stage.addEventListener('touchmove', handleTouch, { passive: true });

  // Seed initial cards so the stage doesn't look empty
  requestAnimationFrame(() => {
    const rect = stage.getBoundingClientRect();
    const seeds = [
      [rect.width * 0.32, rect.height * 0.32],
      [rect.width * 0.62, rect.height * 0.5],
      [rect.width * 0.42, rect.height * 0.68],
    ];
    seeds.forEach(([sx, sy], i) => setTimeout(() => spawn(sx, sy), i * 280));
  });

  // On touch / reduced-motion-off, auto-cycle so the stage stays alive
  if (isTouch && !reduced) {
    setInterval(() => {
      const rect = stage.getBoundingClientRect();
      if (rect.width === 0) return;
      const x = rect.width * (0.18 + Math.random() * 0.64);
      const y = rect.height * (0.2 + Math.random() * 0.6);
      spawn(x, y);
    }, 1100);
  }
}

/* ---------- 12. Pipeline (4-step scroll-scrub on desktop, vertical stack on mobile) ---------- */
function initPipeline() {
  const pipeline = document.querySelector('.pipeline');
  if (!pipeline) return;

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const steps = pipeline.querySelectorAll('.pipeline-step');
  const scenes = pipeline.querySelectorAll('.pipeline-scene');
  const ppFill = pipeline.querySelector('.pp-fill');
  const ppCur = pipeline.querySelector('.pp-current');

  // Scene 1 — Capture: prep draw-on paths
  scenes[0].querySelectorAll('[data-draw]').forEach((p) => {
    const len = p.getTotalLength ? p.getTotalLength() : 100;
    p.dataset.len = len;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });

  // Scene 2 — Tag: generate 104 dots over a humanoid silhouette
  const tagSvg = scenes[1].querySelector('svg');
  if (tagSvg) {
    // body strokes (light skeleton outline)
    const strokes = [
      'M 100 22 L 100 64',                // neck
      'M 100 64 L 70 80 L 60 120 L 50 170', // L arm
      'M 100 64 L 130 80 L 140 120 L 150 170', // R arm
      'M 100 64 L 100 156',               // spine
      'M 100 156 L 80 200 L 70 260',     // L leg
      'M 100 156 L 120 200 L 130 260',   // R leg
    ];
    strokes.forEach((d) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', 'ps-figure-stroke');
      tagSvg.appendChild(p);
    });
    // head outline
    const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    head.setAttribute('cx', '100'); head.setAttribute('cy', '20'); head.setAttribute('r', '12');
    head.setAttribute('class', 'ps-figure-stroke');
    tagSvg.appendChild(head);

    // 104 landmark dot positions (procedural — distributed across the figure)
    const dots = [];
    // head (8 dots)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      dots.push([100 + Math.cos(a) * 10, 20 + Math.sin(a) * 10]);
    }
    // spine (10)
    for (let i = 0; i < 10; i++) dots.push([100, 36 + i * 12]);
    // shoulders to wrists L (10), R (10)
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      dots.push([100 - t * 50, 70 + t * 100]);
      dots.push([100 + t * 50, 70 + t * 100]);
    }
    // chest sides (8)
    for (let i = 0; i < 4; i++) {
      dots.push([85 - i * 3, 80 + i * 16]);
      dots.push([115 + i * 3, 80 + i * 16]);
    }
    // hips (4)
    dots.push([90, 156], [110, 156], [85, 160], [115, 160]);
    // legs L and R (20 each)
    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      dots.push([90 - t * 25, 160 + t * 100]);
      dots.push([110 + t * 25, 160 + t * 100]);
    }
    // foot details (4)
    dots.push([60, 268], [78, 268], [122, 268], [140, 268]);

    dots.slice(0, 104).forEach(([cx, cy], i) => {
      const d = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      d.setAttribute('cx', cx); d.setAttribute('cy', cy); d.setAttribute('r', '2.4');
      d.setAttribute('class', 'ps-dot');
      d.dataset.idx = i;
      tagSvg.appendChild(d);
    });
  }

  // Scene 3 — Score: ring + counter
  const ring = scenes[2].querySelector('.ps-ring');
  let ringLen = 0;
  if (ring) {
    ringLen = ring.getTotalLength();
    ring.style.strokeDasharray = ringLen;
    ring.style.strokeDashoffset = ringLen;
  }
  const scoreNum = scenes[2].querySelector('.ps-score-num b');

  // Scene 4 — Share: rows
  const shareRows = scenes[3].querySelectorAll('.ps-list-row');

  const setLocal = (sceneIdx, local) => {
    // Scene 1: draw-on paths in order with small staggered delay
    if (sceneIdx === 0) {
      const paths = scenes[0].querySelectorAll('[data-draw]');
      paths.forEach((p, i) => {
        const start = i / (paths.length + 0.5);
        const lp = Math.max(0, Math.min(1, (local - start) * 2.4));
        const len = parseFloat(p.dataset.len);
        p.style.strokeDashoffset = (len * (1 - lp)).toFixed(1);
      });
      const ball = scenes[0].querySelector('[data-draw-fill]');
      if (ball) ball.style.opacity = local > 0.85 ? 1 : 0;
    }
    // Scene 2: dots cascade in
    if (sceneIdx === 1) {
      const dots = scenes[1].querySelectorAll('.ps-dot');
      const shown = Math.floor(local * dots.length);
      dots.forEach((d, i) => d.classList.toggle('is-on', i < shown));
      const counter = scenes[1].querySelector('.ps-dot-count b');
      if (counter) counter.textContent = Math.min(104, shown);
    }
    // Scene 3: ring + counter
    if (sceneIdx === 2 && ring) {
      const target = 86;
      const cur = target * local;
      ring.style.strokeDashoffset = (ringLen * (1 - cur / 100)).toFixed(1);
      if (scoreNum) scoreNum.textContent = Math.round(cur);
    }
    // Scene 4: rows fade/slide in
    if (sceneIdx === 3) {
      const total = shareRows.length;
      shareRows.forEach((r, i) => {
        const start = (i + 1) / (total + 1);
        r.classList.toggle('is-on', local > start * 0.7);
      });
      scenes[3].style.setProperty('--p', Math.min(1, local * 1.4));
    }
  };

  if (isMobile) {
    // ---- Mobile path: vertical stack, IO-driven per-scene playback ----
    pipeline.classList.add('is-mobile');

    // Restructure DOM: pair each step's text next to its scene
    const captions = ['Capture', 'Tag', 'Score', 'Share'];
    const stage = pipeline.querySelector('.pipeline-stage');
    scenes.forEach((scene, idx) => {
      const cap = document.createElement('div');
      cap.className = 'pipeline-m-caption';
      const step = steps[idx];
      const num = step.querySelector('.ps-num')?.textContent || String(idx + 1).padStart(2, '0');
      const body = step.querySelector('.ps-body')?.innerHTML || '';
      cap.innerHTML = `<span class="ps-num">${num} · ${captions[idx]}</span>
        <span class="ps-body">${body}</span>`;
      // Insert caption right after the scene
      scene.insertAdjacentElement('afterend', cap);
    });

    // Activate scenes immediately (mobile shows them all)
    scenes.forEach((s) => s.classList.add('is-active'));

    // Play each scene's animation on enter
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = Array.prototype.indexOf.call(scenes, entry.target);
        if (idx < 0) return;
        if (entry.target.dataset.played) return;
        entry.target.dataset.played = '1';

        const start = performance.now();
        const dur = 1400;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          setLocal(idx, p);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    scenes.forEach((s) => io.observe(s));

    return;
  }

  // ---- Desktop path: pinned scroll-scrub ----
  if (typeof gsap === 'undefined' || !window.ScrollTrigger) return;

  ScrollTrigger.create({
    trigger: pipeline,
    start: 'top top',
    end: '+=400%',
    pin: '.pipeline-pin',
    scrub: 0.7,
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      const idx = Math.min(3, Math.floor(p * 4));
      const local = Math.max(0, Math.min(1, (p * 4) % 1 + (p === 1 ? 1 : 0)));

      steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      scenes.forEach((s, i) => s.classList.toggle('is-active', i === idx));

      if (ppFill) ppFill.style.width = (p * 100).toFixed(1) + '%';
      if (ppCur) ppCur.textContent = String(idx + 1).padStart(2, '0');

      setLocal(idx, local);
    },
  });
}

/* ---------- 13. 104pts progressive dot reveal ---------- */
function initTech104() {
  const section = document.querySelector('.tech-104-section');
  if (!section) return;
  if (typeof gsap === 'undefined' || !window.ScrollTrigger) return;

  const svg = section.querySelector('.t104-figure');
  const numEl = section.querySelector('.t104-num');
  const fillEl = section.querySelector('.t104-progress-fill');
  if (!svg) return;

  // Build the figure: light strokes + 104 dots
  const NS = 'http://www.w3.org/2000/svg';
  const strokes = [
    'M 110 30 L 110 72',
    'M 110 72 L 78 92 L 66 138 L 56 192',
    'M 110 72 L 142 92 L 154 138 L 164 192',
    'M 110 72 L 110 176',
    'M 110 176 L 86 224 L 72 290',
    'M 110 176 L 134 224 L 148 290',
  ];
  strokes.forEach((d) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('class', 'ps-figure-stroke');
    svg.appendChild(p);
  });
  const head = document.createElementNS(NS, 'circle');
  head.setAttribute('cx', '110'); head.setAttribute('cy', '26'); head.setAttribute('r', '14');
  head.setAttribute('class', 'ps-figure-stroke');
  svg.appendChild(head);

  // 104 dot positions
  const dotPts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    dotPts.push([110 + Math.cos(a) * 12, 26 + Math.sin(a) * 12]);
  }
  for (let i = 0; i < 12; i++) dotPts.push([110, 42 + i * 12]);
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    dotPts.push([110 - t * 56, 76 + t * 116]);
    dotPts.push([110 + t * 56, 76 + t * 116]);
  }
  for (let i = 0; i < 5; i++) {
    dotPts.push([92 - i * 4, 88 + i * 20]);
    dotPts.push([128 + i * 4, 88 + i * 20]);
  }
  dotPts.push([98, 176], [122, 176], [92, 180], [128, 180]);
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    dotPts.push([100 - t * 30, 180 + t * 110]);
    dotPts.push([120 + t * 30, 180 + t * 110]);
  }
  dotPts.push([66, 296], [80, 296], [140, 296], [154, 296]);
  while (dotPts.length < 104) dotPts.push([110, 200 + Math.random() * 80]);

  const dots = [];
  dotPts.slice(0, 104).forEach(([cx, cy], i) => {
    const d = document.createElementNS(NS, 'circle');
    d.setAttribute('cx', cx); d.setAttribute('cy', cy); d.setAttribute('r', '2.6');
    d.setAttribute('class', 't104-dot');
    d.dataset.idx = i;
    svg.appendChild(d);
    dots.push(d);
  });

  // Order dots by distance to centre — reveals from inside out for nicer cascade
  const order = dots
    .map((d, i) => {
      const cx = parseFloat(d.getAttribute('cx'));
      const cy = parseFloat(d.getAttribute('cy'));
      const dist = Math.hypot(cx - 110, cy - 160);
      return { d, dist };
    })
    .sort((a, b) => a.dist - b.dist)
    .map((o) => o.d);

  ScrollTrigger.create({
    trigger: section,
    start: 'top 75%',
    end: 'bottom 30%',
    scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;
      const shown = Math.floor(p * 104);
      order.forEach((d, i) => {
        d.classList.toggle('is-on', i < shown);
        // pulse a small handful of the latest dots
        d.classList.toggle('is-pulse', i >= shown - 3 && i < shown);
      });
      if (numEl) numEl.textContent = String(shown).padStart(3, '0').slice(-3);
      if (fillEl) fillEl.style.width = (p * 100).toFixed(1) + '%';
    },
  });
}

/* ---------- 11. Page transition wipe ---------- */
function initPageTransitions() {
  const panels = document.querySelectorAll('.page-transition-panel');
  if (!panels.length || typeof gsap === 'undefined') return;

  // On load: panels animate off-screen right (revealing page)
  gsap.fromTo(panels,
    { xPercent: 0 },
    { xPercent: 101, duration: 0.6, ease: 'power3.inOut', stagger: 0.06, onComplete: () => {
      document.querySelectorAll('.page-transition').forEach(t => t.style.pointerEvents = 'none');
    }}
  );

  // Intercept internal nav clicks
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      gsap.fromTo(panels,
        { xPercent: -101 },
        {
          xPercent: 0,
          duration: 0.45,
          ease: 'power3.inOut',
          stagger: 0.06,
          onComplete: () => { window.location.href = href; },
        }
      );
    });
  });
}

/* ---------- 11. Cursor reticle ---------- */
function initCursorReticle() {
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const reticle = document.createElement('div');
  reticle.className = 'cursor-reticle';
  reticle.innerHTML = `<svg viewBox="0 0 44 44" aria-hidden="true">
    <line x1="22" y1="4"  x2="22" y2="14" stroke="#FFD23F" stroke-width="1.6"/>
    <line x1="22" y1="30" x2="22" y2="40" stroke="#FFD23F" stroke-width="1.6"/>
    <line x1="4"  y1="22" x2="14" y2="22" stroke="#FFD23F" stroke-width="1.6"/>
    <line x1="30" y1="22" x2="40" y2="22" stroke="#FFD23F" stroke-width="1.6"/>
    <circle cx="22" cy="22" r="1.6" fill="#FFD23F"/>
  </svg>`;
  document.body.appendChild(reticle);

  let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!reticle.classList.contains('is-active')) reticle.classList.add('is-active');
  }, { passive: true });

  document.addEventListener('mouseleave', () => reticle.classList.remove('is-active'));

  // Hover state on interactive elements
  const hoverable = 'a, button, .ptile, .voice, .h3i, .mp-row, .faq-q, [role="button"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(hoverable)) reticle.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(hoverable)) reticle.classList.remove('is-hover');
  });

  function tick() {
    curX += (mouseX - curX) * 0.22;
    curY += (mouseY - curY) * 0.22;
    reticle.style.transform = `translate3d(${curX.toFixed(1)}px, ${curY.toFixed(1)}px, 0)`;
    requestAnimationFrame(tick);
  }
  tick();
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
  initPageTransitions();
  initCursorReticle();
  initHeroTrail();
  initPipeline();
  initTech104();
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
