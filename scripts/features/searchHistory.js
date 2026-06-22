import { UserService } from '../firebase/database.js';
import { debounce } from '../helpers.js';

let _uid = null;
export function initSearch(uid) { _uid = uid; }

export const trackSearch = debounce(async (query) => {
  if (!_uid || !query.trim()) return;
  await UserService.saveSearchHistory(_uid, query.trim());
}, 1000);

export function renderSearchHistory(history) {
  const container = document.getElementById('search-history-list');
  if (!container) return;
  const items = (history || []).slice(0, 30);
  if (!items.length) { container.innerHTML = '<p class="empty">No recent searches.</p>'; return; }
  container.innerHTML = items.map(q =>
    `<div class="history-chip" onclick="window.filterAlgorithms && filterAlgorithms('${q.replace(/'/g,"\\'")}')">🔍 ${_esc(q)}</div>`
  ).join('');
}

function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
