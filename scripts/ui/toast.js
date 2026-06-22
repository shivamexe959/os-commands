const _queue = [];
let _showing = false;

export function showToast(message, type = 'info', duration = 3500) {
  _queue.push({ message, type, duration });
  if (!_showing) _next();
}

function _next() {
  if (!_queue.length) { _showing = false; return; }
  _showing = true;
  const { message, type, duration } = _queue.shift();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️', achievement:'🏅' };
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${_esc(message)}</span>`;
  const container = _getContainer();
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.remove(); _next(); }, 350);
  }, duration);
}

function _getContainer() {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  return c;
}

function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

// Make globally available for non-module scripts
window.showToast = showToast;
