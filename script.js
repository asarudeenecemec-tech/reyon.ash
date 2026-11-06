/* Scroll-scrubbed portfolio story, adapted to the supplied ZIP reference. */
(() => {
  const hero = document.querySelector('.hero');
  const scene = document.getElementById('scene');
  const heroCopy = document.getElementById('heroCopy');
  const character = document.getElementById('characterWrapper');
  const portrait = document.querySelector('.character');
  const phone = document.querySelector('.phone-bubble');
  if (!hero || !scene || !character) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const smooth = (n) => { n = clamp(n); return n * n * (3 - 2 * n); };
  const range = (p, start, end) => smooth((p - start) / (end - start));

  const intro = document.createElement('div');
  intro.className = 'story-title';
  intro.innerHTML = '<p>INSTRUCTIONAL DESIGNER <b>•</b> CURRICULUM DESIGNER</p><h2>LEARN</h2><span>DESIGN <b>•</b> DEVELOP <b>•</b> INSPIRE</span><small>SCROLL TO BEGIN <i>↓</i></small>';
  scene.prepend(intro);

  const panels = [
    { id: 'story-about', side: 'right', start: .30, end: .45, label: '01 / A LITTLE ABOUT ME', title: 'Learning begins with a good story.', copy: 'I’m Reyon S.—an instructional designer, writer, and producer creating thoughtful learning experiences for people and brands.' },
    { id: 'story-work', side: 'left', start: .47, end: .62, label: '02 / WHAT I DO', title: 'Make ideas easier to learn.', copy: 'From storyboards to finished courses, I build clear, engaging learning journeys with Storyline, Rise 360, and Vyond.' },
    { id: 'story-skills', side: 'right', start: .64, end: .79, label: '03 / MY TOOLKIT', title: 'Design. Develop. Inspire.', copy: 'Instructional design · Curriculum development · eLearning · Video production · AI-assisted imagery · LMS delivery.' },
    { id: 'story-experience', side: 'left', start: .79, end: .92, label: '04 / EXPERIENCE', title: 'Learners come first.', copy: 'I bring together content strategy, facilitation, and production to turn complex information into practical, memorable experiences.' },
    { id: 'story-contact', side: 'right', start: .92, end: 1.01, label: '05 / LET’S CONNECT', title: 'Your next idea starts here.', copy: 'Sharjah, UAE · sreyon.s@gmail.com · WhatsApp +971 52 856 2924 · LinkedIn /in/reyons3101' }
  ];
  const nodes = panels.map((panel) => {
    const el = document.createElement('article');
    el.className = `story-panel ${panel.side}`;
    el.id = panel.id;
    el.innerHTML = `<span>${panel.label}</span><h2>${panel.title}</h2><p>${panel.copy}</p>${panel.id === 'story-contact' ? '<a href="mailto:sreyon.s@gmail.com">Say hello <b>↗</b></a>' : ''}`;
    scene.append(el);
    return { ...panel, el };
  });

  const clouds = [...scene.querySelectorAll('.cloud')];
  const floaters = [...scene.querySelectorAll('.floating')];
  let busy = false;

  function render() {
    busy = false;
    const total = Math.max(1, hero.offsetHeight - window.innerHeight);
    const p = clamp(-hero.getBoundingClientRect().top / total);
    if (reduced) {
      intro.style.opacity = '1';
      nodes.forEach(({ el }) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    const opening = 1 - range(p, .10, .25);
    intro.style.opacity = String(opening);
    intro.style.transform = `translate3d(0, ${(-28 * range(p, .04, .25)).toFixed(1)}px, 0) scale(${(1 + .04 * range(p, .04, .2)).toFixed(3)})`;

    const part = range(p, .025, .27);
    clouds.forEach((cloud, i) => {
      const direction = i === 1 ? 1 : -1;
      cloud.style.transform = `translate3d(${(direction * window.innerWidth * .72 * part).toFixed(1)}px, ${(window.innerHeight * .11 * part).toFixed(1)}px, 0) scale(${(1 - .12 * part).toFixed(3)})`;
      cloud.style.opacity = String(1 - range(p, .17, .30));
    });

    floaters.forEach((el, i) => {
      const t = range(p, .08 + (i % 3) * .025, .30 + (i % 3) * .025);
      const direction = i % 2 ? 1 : -1;
      el.style.transform = `translate3d(${(direction * window.innerWidth * (.35 + (i % 3) * .08) * t).toFixed(1)}px, ${(-window.innerHeight * .16 * t).toFixed(1)}px, 0) rotate(${direction * 18 * t}deg)`;
      el.style.opacity = String(1 - t);
    });

    const stops = [
      { at: .29, x: 0 }, { at: .38, x: -.27 }, { at: .48, x: -.27 },
      { at: .56, x: .27 }, { at: .66, x: .27 }, { at: .74, x: -.27 },
      { at: .84, x: -.27 }, { at: .92, x: .25 }, { at: 1, x: .25 }
    ];
    let x = stops[0].x;
    for (let i = 1; i < stops.length; i++) {
      if (p <= stops[i].at) {
        const t = range(p, stops[i - 1].at, stops[i].at);
        x = stops[i - 1].x + (stops[i].x - stops[i - 1].x) * t;
        break;
      }
      x = stops[i].x;
    }
    const px = x * window.innerWidth;
    const scale = 1 + .08 * range(p, .26, .42);
    character.style.transform = `translate3d(calc(-50% + ${px.toFixed(1)}px),0,0) scale(${scale.toFixed(3)})`;
    if (portrait) {
      const turn = range(p, .29, .39);
      portrait.style.transform = `perspective(900px) rotateY(${(-10 + 10 * turn).toFixed(2)}deg) rotateZ(${(-1.5 + Math.sin(p * Math.PI * 8) * .35).toFixed(2)}deg)`;
    }

    nodes.forEach(({ el, start, end, side }) => {
      const fadeIn = range(p, start, start + .035);
      const fadeOut = 1 - range(p, end - .035, end);
      const alpha = Math.min(fadeIn, fadeOut);
      const offset = (1 - alpha) * (side === 'left' ? -24 : 24);
      el.style.opacity = String(alpha);
      el.style.transform = `translate3d(${offset}px, 0, 0)`;
    });

    if (phone) {
      const handoff = range(p, .93, .985);
      phone.style.opacity = String(handoff);
      phone.style.transform = `scale(${(.45 + handoff * .55).toFixed(3)}) translateY(${(18 - handoff * 18).toFixed(1)}px)`;
    }
    if (heroCopy) heroCopy.style.opacity = String(Math.max(0, 1 - range(p, .28, .34)));
  }

  function requestRender() {
    if (!busy) {
      busy = true;
      window.requestAnimationFrame(render);
    }
  }
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender);
  render();
})();
