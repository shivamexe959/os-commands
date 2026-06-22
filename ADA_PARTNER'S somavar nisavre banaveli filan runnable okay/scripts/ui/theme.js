export function initTheme(userData) {
  const saved = localStorage.getItem('ada_theme') || userData?.theme || 'dark';
  applyTheme(saved);
}

export function applyTheme(theme) {
  document.body.classList.toggle('theme-light', theme === 'light');
  localStorage.setItem('ada_theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '🌙' : '☀️';
}

export function toggleTheme() {
  const current = localStorage.getItem('ada_theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

window.toggleTheme = toggleTheme;
