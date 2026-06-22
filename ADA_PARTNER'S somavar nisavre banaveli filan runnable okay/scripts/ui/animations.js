export function fadeIn(el, duration = 300) {
  if (!el) return;
  el.style.opacity = '0';
  el.style.display = 'block';
  el.style.transition = `opacity ${duration}ms ease`;
  requestAnimationFrame(() => { el.style.opacity = '1'; });
}

export function fadeOut(el, duration = 300) {
  if (!el) return;
  el.style.transition = `opacity ${duration}ms ease`;
  el.style.opacity = '0';
  setTimeout(() => { el.style.display = 'none'; }, duration);
}

export function slideIn(el, direction = 'right', duration = 350) {
  if (!el) return;
  const map = { right:'translateX(100%)', left:'translateX(-100%)', up:'translateY(100%)', down:'translateY(-100%)' };
  el.style.transform = map[direction];
  el.style.transition = `transform ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
  el.style.display = 'block';
  requestAnimationFrame(() => { el.style.transform = 'translate(0,0)'; });
}

export function countUp(el, target, duration = 1000) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const step = (target - start) / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.round(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

export function pulseElement(el) {
  if (!el) return;
  el.classList.add('pulse-anim');
  setTimeout(() => el.classList.remove('pulse-anim'), 600);
}
