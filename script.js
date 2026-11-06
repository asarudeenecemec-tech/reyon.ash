const hero = document.querySelector('.hero');
const scene = document.getElementById('scene');
const heroCopy = document.getElementById('heroCopy');
const avatar = document.getElementById('characterWrapper');
const phoneBubble = document.querySelector('.phone-bubble');
const char = document.querySelector('.character');
const floatingEls = [...document.querySelectorAll('.floating')];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function interpolated(val, min, max) {
  return min + (max - min) * val;
}

function applyScroll() {
  const rect = hero.getBoundingClientRect();
  const total = hero.offsetHeight - window.innerHeight;
  const progress = clamp(-rect.top / total, 0, 1);

  const cloudShift = progress * 120;
  const cloudOpacity = 1 - progress * 0.6;
  const cloudLeft = document.querySelector('.cloud-a');
  const cloudRight = document.querySelector('.cloud-b');
  const cloudMid = document.querySelector('.cloud-c');
  const mist = document.querySelector('.mist');

  if (cloudLeft) {
    cloudLeft.style.transform = `translateX(${(-cloudShift).toFixed(2)}px)`;
    cloudLeft.style.opacity = cloudOpacity.toFixed(3);
  }

  if (cloudRight) {
    cloudRight.style.transform = `translateX(${cloudShift.toFixed(2)}px)`;
    cloudRight.style.opacity = cloudOpacity.toFixed(3);
  }

  if (cloudMid) {
    cloudMid.style.transform = `translateY(${(-progress * 30).toFixed(2)}px)`;
    cloudMid.style.opacity = (1 - progress * 0.4).toFixed(3);
  }

  if (mist) {
    mist.style.opacity = (0.1 + progress * 0.9).toFixed(3);
  }

  const copyAlpha = clamp((progress - 0.58) / 0.25, 0, 1);
  heroCopy.style.opacity = copyAlpha.toFixed(3);
  heroCopy.style.transform = `translateY(${(40 - copyAlpha * 40).toFixed(2)}px)`;

  const turnProgress = clamp((progress - 0.22) / 0.42, 0, 1);
  const xOffset = interpolated(turnProgress, 0, -220);
  const scale = interpolated(turnProgress, 1, 1.08);
  const rotateY = interpolated(turnProgress, 0, -18);
  const rotateZ = interpolated(turnProgress, 0, -3);

  if (avatar) {
    avatar.style.transform = `translateX(calc(-50% + ${xOffset}px)) scale(${scale.toFixed(3)})`;
    avatar.style.transformOrigin = 'center bottom';
    avatar.style.filter = `drop-shadow(0 18px 24px rgba(9, 6, 39, 0.45))`;
  }

  if (char) {
    char.style.transform = `rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg)`;
  }

  floatingEls.forEach((el, index) => {
    const dir = Number(el.dataset.float || 0);
    const drift = progress * 110 * (index % 2 === 0 ? 1 : -1);
    const lift = progress * 50;
    el.style.transform = `translate3d(${(dir * 40 + drift).toFixed(2)}px, ${(-lift).toFixed(2)}px, 0) rotate(${(dir * 8).toFixed(2)}deg)`;
    el.style.opacity = (1 - progress * 0.5).toFixed(3);
  });

  const phoneShow = clamp((progress - 0.72) / 0.12, 0, 1);
  if (phoneBubble) {
    phoneBubble.style.opacity = phoneShow.toFixed(3);
    phoneBubble.style.transform = `scale(${(0.4 + phoneShow * 0.6).toFixed(3)}) translateY(${(20 - phoneShow * 20).toFixed(2)}px)`;
  }

  const cloudReveal = clamp((progress - 0.34) / 0.2, 0, 1);
  if (scene) {
    scene.style.filter = `brightness(${(1 + cloudReveal * 0.12).toFixed(3)})`;
  }
}

window.addEventListener('scroll', applyScroll, { passive: true });
window.addEventListener('resize', applyScroll);
applyScroll();

const years = document.querySelectorAll('.stat-card strong');
years.forEach((el) => {
  el.animate(
    [{ opacity: 0.4, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 600, easing: 'ease-out' }
  );
});
