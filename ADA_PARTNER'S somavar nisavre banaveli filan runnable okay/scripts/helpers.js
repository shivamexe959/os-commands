export function debounce(fn, delay = 300) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

export function throttle(fn, limit = 200) {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= limit) { last = now; fn(...args); } };
}

export function sanitize(str) {
  return String(str || '').replace(/[<>&"']/g, c =>
    ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#039;'}[c]));
}

export function formatNumber(n) { return Number(n || 0).toLocaleString('en-IN'); }

export function formatDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  } catch { return ''; }
}

export function formatDuration(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return seconds + 's';
  const m = Math.floor(seconds / 60), s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60), rm = m % 60;
  return `${h}h ${rm}m`;
}

export function parseSearchParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  return {
    browser: /edg/i.test(ua)?'Edge':/chrome/i.test(ua)?'Chrome':/firefox/i.test(ua)?'Firefox':/safari/i.test(ua)?'Safari':'Other',
    os: /win/i.test(ua)?'Windows':/mac/i.test(ua)?'macOS':/android/i.test(ua)?'Android':/iphone|ipad/i.test(ua)?'iOS':/linux/i.test(ua)?'Linux':'Other',
    device: /mobile|android|iphone|ipad/i.test(ua)?'Mobile':'Desktop',
    screen: `${window.screen.width}x${window.screen.height}`
  };
}

export function generateId(prefix = '') {
  return prefix + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}
