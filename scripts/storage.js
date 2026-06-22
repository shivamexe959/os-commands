const PREFIX = 'ada_v2_';

export const storage = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch(e) { console.warn('Storage full:', e); }
  },
  remove(key) { localStorage.removeItem(PREFIX + key); },
  clear() {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
  }
};
