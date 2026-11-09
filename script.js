/* Scroll-scrub the supplied ezgif-frame-001.jpg through ezgif-frame-200.jpg. */
(() => {
  const hero = document.querySelector('.hero');
  const scene = document.getElementById('scene');
  const panelsRoot = document.getElementById('storyPanels');
  if (!hero || !scene) return;

  const css = document.createElement('style');
  css.textContent = `
    .hero-scene { isolation:isolate; }
    #scroll-frames { position:absolute; inset:0; z-index:4; display:block; width:100%; height:100%; object-fit:cover; }
    .hero-reference, .story-title, .floating, .cloud, .mist, .character-stage, .hero-copy { visibility:hidden !important; }
    .story-panels { z-index:18; }
    .scroll-chapter { pointer-events:none; }
    .scroll-chapter a { pointer-events:auto; }
    @media (max-width:760px) { #scroll-frames { object-fit:cover; } }
  `;
  document.head.append(css);

  const canvas = document.createElement('canvas');
  canvas.id = 'scroll-frames';
  canvas.setAttribute('aria-hidden', 'true');
  scene.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = (n) => { n = clamp(n); return n * n * (3 - 2 * n); };
  const range = (p, a, b) => ease((p - a) / (b - a));
  const framePath = (n) => `ezgif-frame-${String(n).padStart(3, '0')}.jpg`;
  const cache = new Map();
  let requested = 1;
  let renderQueued = false;
  let lastProgress = 0;

  const chapters = [
    { start: .30, end: .45, side: 'right', kicker: '01 / ABOUT', heading: 'A story-led designer.', text: 'I’m Reyon S.—an instructional designer, writer, and producer creating thoughtful learning experiences.' },
    { start: .47, end: .62, side: 'left', kicker: '02 / WHAT I DO', heading: 'Make ideas easier to learn.', text: 'From storyboards to finished courses, I build clear learning journeys with Storyline, Rise 360, and Vyond.' },
    { start: .64, end: .78, side: 'right', kicker: '03 / MY TOOLKIT', heading: 'Design. Develop. Inspire.', text: 'Instructional design · Curriculum · eLearning · Video production · LMS delivery · Visual content.' },
    { start: .79, end: .91, side: 'left', kicker: '04 / EXPERIENCE', heading: 'Learners come first.', text: 'Content strategy, facilitation, and production—combined to make learning practical and memorable.' },
    { start: .92, end: 1.02, side: 'right', kicker: '05 / CONTACT', heading: 'Your next idea starts here.', text: 'Sharjah, UAE · sreyon.s@gmail.com · WhatsApp +971 52 856 2924', contact: true }
  ];
  const chapterEls = chapters.map((chapter) => {
    const el = document.createElement('article');
    el.className = `scroll-chapter ${chapter.side}`;
    el.innerHTML = `<span>${chapter.kicker}</span><h2>${chapter.heading}</h2><p>${chapter.text}</p>${chapter.contact ? '<a href="mailto:sreyon.s@gmail.com">Say hello <b>↗</b></a>' : ''}`;
    panelsRoot.append(el);
    return { ...chapter, el };
  });

  function resizeCanvas() {
    const rect = scene.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      draw(requested);
    }
  }

  function loadFrame(n) {
    if (cache.has(n)) return cache.get(n);
    const image = new Image();
    image.decoding = 'async';
    const promise = new Promise((resolve) => {
      image.onload = async () => {
        try { if (image.decode) await image.decode(); } catch (_) { /* load event already confirms usable image */ }
        resolve(image);
      };
      image.onerror = () => resolve(null);
      image.src = framePath(n);
    });
    cache.set(n, promise);
    return promise;
  }

  function drawCover(image) {
    if (!image || !ctx) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / image.naturalWidth, ch / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(image, (cw - width) / 2, (ch - height) / 2, width, height);
  }

  async function draw(n) {
    requested = clamp(n, 1, 200);
    const target = requested;
    const image = await loadFrame(target);
    if (target === requested && image) drawCover(image);
    // Keep only nearby decoded images; the browser can still reuse its HTTP cache.
    for (const [key] of cache) if (Math.abs(key - requested) > 4) cache.delete(key);
    for (const neighbor of [target + 1, target + 2, target - 1]) {
      if (neighbor >= 1 && neighbor <= 200) loadFrame(neighbor);
    }
  }

  function update() {
    renderQueued = false;
    resizeCanvas();
    const distance = Math.max(1, hero.offsetHeight - window.innerHeight);
    const progress = clamp(-hero.getBoundingClientRect().top / distance);
    lastProgress = progress;
    // 001 is the opening image; scrolling advances one continuous 200-frame movie.
    draw(reduced ? 1 : Math.round(1 + progress * 199));
    chapterEls.forEach(({ el, start, end, side }) => {
      const visible = reduced ? 1 : Math.min(range(progress, start, start + .035), 1 - range(progress, end - .035, end));
      el.style.opacity = String(visible);
      el.style.transform = `translate3d(${((1 - visible) * (side === 'left' ? -22 : 22)).toFixed(1)}px,0,0)`;
    });
  }

  function requestUpdate() {
    if (!renderQueued) {
      renderQueued = true;
      requestAnimationFrame(update);
    }
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  loadFrame(1).then((image) => { if (image) drawCover(image); });
  // First/last frame and a few neighbors make the sequence start smoothly.
  loadFrame(200);
  update();
})();
