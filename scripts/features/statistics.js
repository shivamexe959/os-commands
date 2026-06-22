export function renderStatistics(userData) {
  const stats = [
    { label:'Algorithms Viewed', value: userData.totalAlgorithmsUsed || 0, icon:'📊' },
    { label:'PDF Exports',       value: userData.pdfDownloads || 0,        icon:'📄' },
    { label:'Total Sessions',    value: userData.totalSessions || 0,        icon:'🔄' },
    { label:'Current Streak',    value: (userData.currentStreak || 0) + ' 🔥', icon:'🔥' },
    { label:'Longest Streak',    value: (userData.longestStreak || 0) + ' days', icon:'📅' },
    { label:'Favorites',         value: (userData.favoriteAlgorithms || []).length, icon:'❤️' },
    { label:'Bookmarks',         value: (userData.bookmarks || []).length,  icon:'🔖' },
    { label:'Quiz Attempts',     value: (userData.quizHistory || []).length, icon:'❓' },
    { label:'Achievements',      value: (userData.achievements || []).length, icon:'🏅' },
    { label:'XP Points',         value: (userData.xp || 0).toLocaleString(), icon:'⚡' },
    { label:'Coins',             value: userData.coins || 0,                icon:'🪙' },
    { label:'Referrals',         value: userData.referralCount || 0,        icon:'🤝' }
  ];
  const container = document.getElementById('stats-grid');
  if (!container) return;
  container.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');
}

export function renderRecentActivity(activities) {
  const container = document.getElementById('activity-timeline');
  if (!container) return;
  if (!activities || !activities.length) { container.innerHTML = '<p class="empty">No recent activity.</p>'; return; }
  container.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div class="activity-content">
        <div class="activity-desc">${_esc(a.description || a.type || '')}</div>
        <div class="activity-time">${_fmtDate(a.timestamp)}</div>
      </div>
    </div>`).join('');
}

export function renderRecentlyViewed(recentlyViewed, onClickAlgo) {
  const container = document.getElementById('recently-viewed-list');
  if (!container) return;
  const items = (recentlyViewed || []).slice(0, 20);
  if (!items.length) { container.innerHTML = '<p class="empty">No recently viewed algorithms.</p>'; return; }
  container.innerHTML = items.map(name => `
    <div class="recent-chip" onclick="window._openAlgoByName && window._openAlgoByName('${_esc(name)}')">${_esc(name)}</div>`).join('');
}

export function renderFavorites(favorites, onClickAlgo) {
  const container = document.getElementById('favorites-list');
  if (!container) return;
  const items = favorites || [];
  if (!items.length) { container.innerHTML = '<p class="empty">No favorites yet.</p>'; return; }
  container.innerHTML = items.map(name => `
    <div class="fav-chip">❤️ ${_esc(name)}</div>`).join('');
}

function _esc(s) { return String(s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function _fmtDate(ts) {
  if (!ts) return '';
  try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); } catch{return '';}
}
