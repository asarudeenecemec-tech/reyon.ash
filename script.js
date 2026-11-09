/* Scroll-controlled 200-frame portfolio sequence with graceful fallback and alternating story panels. */
(() => {
  const hero = document.querySelector('.hero');
  const scene = document.getElementById('scene');
  if (!hero || !scene) return;

  const styles = document.createElement('style');
  styles.textContent = `
    .hero-scene { position:sticky !important; top:0; isolation:isolate; overflow:hidden; }
    #scroll-frames { position:absolute; inset:0; z-index:4; width:100%; height:100%; display:block; pointer-events:none; }
    .story-panels { position:absolute; inset:0; z-index:18; pointer-events:none; }
    .scroll-chapter { position:absolute; top:24%; width:min(38vw,520px); padding:clamp(18px,2.4vw,34px); border:1px solid rgba(255,255,255,.24); border-radius:24px; background:linear-gradient(145deg,rgba(20,14,64,.88),rgba(67,48,145,.76)); color:#f7f3ff; box-shadow:0 22px 60px rgba(8,5,40,.35); backdrop-filter:blur(14px); opacity:0; will-change:transform,opacity; }
    .scroll-chapter.left { left:5%; } .scroll-chapter.right { right:5%; }
    .scroll-chapter > span { color:#ffd58a; font-size:.7rem; font-weight:800; letter-spacing:.18em; }
    .scroll-chapter h2 { margin:.65em 0 .4em; color:#fff; font-size:clamp(1.7rem,3.2vw,3.1rem); line-height:.98; letter-spacing:-.055em; }
    .scroll-chapter p { margin:0; color:#e7e0ff; font-size:clamp(.92rem,1.18vw,1.12rem); line-height:1.65; }
    .scroll-chapter a { display:inline-flex; gap:.7em; align-items:center; margin-top:1.2em; padding:.8em 1.2em; border-radius:999px; background:linear-gradient(90deg,#ffbf42,#ff8d40); color:#2c1947; text-decoration:none; font-weight:800; pointer-events:auto; }
    .frame-sequence-ready .hero-reference, .frame-sequence-ready .story-title, .frame-sequence-ready .floating, .frame-sequence-ready .cloud, .frame-sequence-ready .mist, .frame-sequence-ready .character-stage, .frame-sequence-ready .hero-copy { visibility:hidden !important; }
    @media(max-width:760px){ .scroll-chapter { top:15%; left:5% !important; right:5% !important; width:auto; padding:18px; } .scroll-chapter h2 { font-size:clamp(1.6rem,8vw,2.6rem); } .scroll-chapter p { font-size:.9rem; } }
  `;
  document.head.append(styles);

  let panelsRoot = document.getElementById('storyPanels');
  if (!panelsRoot) {
    panelsRoot = document.createElement('div');
    panelsRoot.id = 'storyPanels';
    panelsRoot.className = 'story-panels';
    scene.append(panelsRoot);
  }
  const chapters = [
    { start:.30, end:.45, side:'right', label:'01 / ABOUT', heading:'A story-led designer.', text:'I’m Reyon S.—an instructional designer, writer, and producer creating thoughtful learning experiences.' },
    { start:.47, end:.62, side:'left', label:'02 / WHAT I DO', heading:'Make ideas easier to learn.', text:'From storyboards to finished courses, I build clear learning journeys with Storyline, Rise 360, and Vyond.' },
    { start:.64, end:.78, side:'right', label:'03 / MY TOOLKIT', heading:'Design. Develop. Inspire.', text:'Instructional design · Curriculum · eLearning · Video production · LMS delivery · Visual content.' },
    { start:.79, end:.91, side:'left', label:'04 / EXPERIENCE', heading:'Learners come first.', text:'Content strategy, facilitation, and production—combined to make learning practical and memorable.' },
    { start:.92, end:1.01, side:'right', label:'05 / CONTACT', heading:'Your next idea starts here.', text:'Sharjah, UAE · sreyon.s@gmail.com · WhatsApp +971 52 856 2924', contact:true }
  ];
  panelsRoot.replaceChildren(...chapters.map((item) => {
    const card = document.createElement('article');
    card.className = `scroll-chapter ${item.side}`;
    card.innerHTML = `<span>${item.label}</span><h2>${item.heading}</h2><p>${item.text}</p>${item.contact ? '<a href="mailto:sreyon.s@gmail.com">Say hello <b>↗</b></a>' : ''}`;
    return card;
  }));
  const cards = [...panelsRoot.children];

  const canvas = document.createElement('canvas');
  canvas.id = 'scroll-frames';
  canvas.setAttribute('aria-hidden', 'true');
  scene.prepend(canvas);
  const context = canvas.getContext('2d', { alpha:false });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cache = new Map();
  const clamp = (n,a=0,b=1) => Math.min(b,Math.max(a,n));
  const smooth = (n) => { n=clamp(n); return n*n*(3-2*n); };
  const range = (p,a,b) => smooth((p-a)/(b-a));
  const localFrame = (n) => `ezgif-frame-${String(n).padStart(3,'0')}.jpg`;
  const rawFrame = (n) => `https://raw.githubusercontent.com/asarudeenecemec-tech/reyon.ash/main/${localFrame(n)}`;
  let requested = 1;
  let rafPending = false;
  let failed = false;

  function resize() {
    const box = scene.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(box.width*dpr));
    const h = Math.max(1, Math.round(box.height*dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; }
  }
  function drawCover(image) {
    if (!image || !context) return;
    const w=canvas.width, h=canvas.height;
    const scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);
    const dw=image.naturalWidth*scale, dh=image.naturalHeight*scale;
    context.clearRect(0,0,w,h);
    context.drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh);
  }
  function load(n) {
    if (cache.has(n)) return cache.get(n);
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.decoding='async';
      image.onload=() => resolve(image);
      image.onerror=() => {
        if (image.src !== rawFrame(n)) {
          image.src=rawFrame(n);
        } else resolve(null);
      };
      image.src=localFrame(n);
    });
    cache.set(n,promise);
    return promise;
  }
  async function showFrame(n) {
    requested=clamp(n,1,200);
    const current=requested;
    const image=await load(current);
    if (current !== requested) return;
    if (!image) {
      if (current === 1 && !failed) {
        failed=true;
        document.documentElement.classList.remove('frame-sequence-ready');
        canvas.style.display='none';
      }
      return;
    }
    failed=false;
    canvas.style.display='block';
    document.documentElement.classList.add('frame-sequence-ready');
    drawCover(image);
    // Load only a few nearby frames ahead for responsive scroll without fetching all 200 at once.
    [current+1,current+2,current-1].forEach((next) => { if (next>=1 && next<=200) load(next); });
  }

  function render() {
    rafPending=false;
    resize();
    const travel=Math.max(1,hero.offsetHeight-window.innerHeight);
    const progress=clamp(-hero.getBoundingClientRect().top/travel);
    showFrame(reduced ? 1 : Math.round(1+progress*199));
    cards.forEach((card,index) => {
      const chapter=chapters[index];
      const opacity=reduced ? 1 : Math.min(range(progress,chapter.start,chapter.start+.035),1-range(progress,chapter.end-.035,chapter.end));
      const x=(1-opacity)*(chapter.side==='left' ? -22 : 22);
      card.style.opacity=String(opacity);
      card.style.transform=`translate3d(${x.toFixed(1)}px,0,0)`;
    });
  }
  function requestRender() { if (!rafPending) { rafPending=true; requestAnimationFrame(render); } }
  addEventListener('scroll',requestRender,{passive:true});
  addEventListener('resize',requestRender);
  showFrame(1);
  render();
})();
