/* ZIP-reference opening art plus cinematic, scroll-scrubbed portfolio chapters. */
(() => {
  const hero = document.querySelector('.hero');
  const scene = document.getElementById('scene');
  const reference = document.querySelector('.hero-reference');
  const title = document.getElementById('storyTitle');
  const panelsRoot = document.getElementById('storyPanels');
  const characterWrap = document.getElementById('characterWrapper');
  const character = document.querySelector('.character');
  const phone = document.querySelector('.phone-bubble');
  if (!hero || !scene) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const ease = (n) => { n = clamp(n); return n * n * (3 - 2 * n); };
  const range = (p, a, b) => ease((p - a) / (b - a));

  const chapters = [
    { start: .30, end: .45, side: 'right', kicker: '01 / ABOUT', heading: 'A story-led designer.', text: 'I’m Reyon S.—an instructional designer, writer, and producer creating thoughtful learning experiences.' },
    { start: .47, end: .62, side: 'left', kicker: '02 / WHAT I DO', heading: 'Make ideas easier to learn.', text: 'From storyboards to finished courses, I build clear learning journeys with Storyline, Rise 360, and Vyond.' },
    { start: .64, end: .78, side: 'right', kicker: '03 / MY TOOLKIT', heading: 'Design. Develop. Inspire.', text: 'Instructional design · Curriculum · eLearning · Video production · LMS delivery · Visual content.' },
    { start: .79, end: .91, side: 'left', kicker: '04 / EXPERIENCE', heading: 'Learners come first.', text: 'Content strategy, facilitation, and production—combined to make learning practical and memorable.' },
    { start: .92, end: 1.02, side: 'right', kicker: '05 / CONTACT', heading: 'Your next idea starts here.', text: 'Sharjah, UAE · sreyon.s@gmail.com · WhatsApp +971 52 856 2924', contact: true }
  ];
  const chapterEls = chapters.map((chapter) => {
    const article = document.createElement('article');
    article.className = `scroll-chapter ${chapter.side}`;
    article.innerHTML = `<span>${chapter.kicker}</span><h2>${chapter.heading}</h2><p>${chapter.text}</p>${chapter.contact ? '<a href="mailto:sreyon.s@gmail.com">Say hello <b>↗</b></a>' : ''}`;
    panelsRoot.append(article);
    return { ...chapter, el: article };
  });

  // The ZIP holds assets/char.webp. Read that image out of the committed ZIP at runtime,
  // so the original character artwork is used without duplicating or redrawing it.
  async function loadZipPortrait() {
    const zipUrl = 'Reyon%20S%20Portfolio%20(1).zip';
    try {
      const response = await fetch(zipUrl);
      if (!response.ok) throw new Error('ZIP unavailable');
      const bytes = await response.arrayBuffer();
      const view = new DataView(bytes);
      let eocd = -1;
      for (let i = bytes.byteLength - 22; i >= Math.max(0, bytes.byteLength - 65557); i--) {
        if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
      }
      if (eocd < 0) throw new Error('ZIP directory unavailable');
      const count = view.getUint16(eocd + 10, true);
      let cursor = view.getUint32(eocd + 16, true);
      let imageBlob = null;
      for (let i = 0; i < count; i++) {
        if (view.getUint32(cursor, true) !== 0x02014b50) break;
        const method = view.getUint16(cursor + 10, true);
        const compressedSize = view.getUint32(cursor + 20, true);
        const nameLength = view.getUint16(cursor + 28, true);
        const extraLength = view.getUint16(cursor + 30, true);
        const commentLength = view.getUint16(cursor + 32, true);
        const localOffset = view.getUint32(cursor + 42, true);
        const name = new TextDecoder().decode(new Uint8Array(bytes, cursor + 46, nameLength));
        if (name === 'assets/char.webp') {
          const localNameLength = view.getUint16(localOffset + 26, true);
          const localExtraLength = view.getUint16(localOffset + 28, true);
          const dataStart = localOffset + 30 + localNameLength + localExtraLength;
          const compressed = bytes.slice(dataStart, dataStart + compressedSize);
          let payload = compressed;
          if (method === 8) {
            if (!('DecompressionStream' in window)) throw new Error('ZIP decompression unavailable');
            payload = await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
          } else if (method !== 0) {
            throw new Error('Unsupported ZIP compression');
          }
          imageBlob = new Blob([payload], { type: 'image/webp' });
          break;
        }
        cursor += 46 + nameLength + extraLength + commentLength;
      }
      if (!imageBlob) throw new Error('Character image not found in ZIP');
      const imageUrl = URL.createObjectURL(imageBlob);
      document.querySelectorAll('.character-art, .zip-portrait').forEach((img) => { img.src = imageUrl; });
      character?.classList.add('has-zip-art');
    } catch (error) {
      // Keep the included reference artwork as graceful fallback when ZIP fetch is unavailable.
      document.documentElement.classList.add('zip-art-fallback');
    }
  }
  loadZipPortrait();

  const clouds = [...scene.querySelectorAll('.cloud')];
  const props = [...scene.querySelectorAll('.floating')];
  let scheduled = false;
  function update() {
    scheduled = false;
    const distance = Math.max(1, hero.offsetHeight - window.innerHeight);
    const p = clamp(-hero.getBoundingClientRect().top / distance);
    if (reduced) {
      if (reference) reference.style.opacity = '0';
      if (title) title.style.opacity = '0';
      chapterEls.forEach(({ el }) => { el.style.opacity = '1'; });
      return;
    }

    // Start from the exact supplied cover image, then let it dissolve into the ZIP-inspired scene.
    if (reference) {
      const fade = range(p, .10, .29);
      reference.style.opacity = String(1 - fade);
      reference.style.transform = `scale(${(1 + .035 * range(p, 0, .28)).toFixed(3)}) translate3d(0, ${(-16 * range(p, 0, .28)).toFixed(1)}px, 0)`;
    }
    if (title) {
      title.style.opacity = String(1 - range(p, .08, .27));
      title.style.transform = `translate3d(0, ${(-34 * range(p, .04, .26)).toFixed(1)}px, 0)`;
    }

    // Clouds peel apart, with the props floating off in different directions.
    const part = range(p, .02, .30);
    clouds.forEach((cloud, i) => {
      const direction = i === 1 ? 1 : -1;
      cloud.style.transform = `translate3d(${(direction * window.innerWidth * .78 * part).toFixed(1)}px, ${(window.innerHeight * .12 * part).toFixed(1)}px, 0) scale(${(1 - .1 * part).toFixed(3)})`;
      cloud.style.opacity = String(1 - range(p, .18, .34));
    });
    props.forEach((el, i) => {
      const t = range(p, .05 + (i % 3) * .025, .27 + (i % 3) * .025);
      const direction = i % 2 ? 1 : -1;
      el.style.transform = `translate3d(${(direction * window.innerWidth * (.28 + (i % 3) * .08) * t).toFixed(1)}px, ${(-window.innerHeight * .15 * t).toFixed(1)}px, 0) rotate(${direction * 20 * t}deg)`;
      el.style.opacity = String(1 - t);
    });

    // Walk the portrait from side to side between alternating story chapters.
    const stops = [{p:.28,x:0},{p:.38,x:-.29},{p:.49,x:-.29},{p:.57,x:.29},{p:.67,x:.29},{p:.75,x:-.29},{p:.85,x:-.29},{p:.93,x:.27},{p:1,x:.27}];
    let x = stops[0].x;
    for (let i = 1; i < stops.length; i++) {
      if (p <= stops[i].p) {
        const t = range(p, stops[i - 1].p, stops[i].p);
        x = stops[i - 1].x + (stops[i].x - stops[i - 1].x) * t;
        break;
      }
      x = stops[i].x;
    }
    if (characterWrap) characterWrap.style.transform = `translate3d(calc(-50% + ${(x * window.innerWidth).toFixed(1)}px),0,0) scale(${(1 + .08 * range(p,.28,.4)).toFixed(3)})`;
    if (character) character.style.transform = `perspective(1000px) rotateY(${(-12 + 12 * range(p,.31,.41)).toFixed(1)}deg)`;

    chapterEls.forEach(({ el, start, end, side }) => {
      const opacity = Math.min(range(p, start, start + .035), 1 - range(p, end - .035, end));
      el.style.opacity = String(opacity);
      el.style.transform = `translate3d(${((1 - opacity) * (side === 'left' ? -22 : 22)).toFixed(1)}px,0,0)`;
    });
    if (phone) {
      const handoff = range(p, .93, .985);
      phone.style.opacity = String(handoff);
      phone.style.transform = `scale(${(.4 + .6 * handoff).toFixed(3)}) translateY(${(18 - 18 * handoff).toFixed(1)}px)`;
    }
    const copy = document.getElementById('heroCopy');
    if (copy) copy.style.opacity = String(1 - range(p, .28, .34));
  }
  function requestUpdate() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  update();
})();
