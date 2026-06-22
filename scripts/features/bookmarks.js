import { UserService } from '../firebase/database.js';
import { awardXP } from './xp.js';

export async function toggleBookmark(uid, algoName) {
  if (!uid) return false;
  const added = await UserService.toggleBookmark(uid, algoName);
  if (added) await awardXP(uid, 'bookmarkAlgo', true);
  return added;
}

export function renderBookmarks(bookmarks) {
  const container = document.getElementById('bookmarks-list');
  if (!container) return;
  const items = bookmarks || [];
  if (!items.length) { container.innerHTML = '<p class="empty">No bookmarks yet.</p>'; return; }
  container.innerHTML = items.map(name =>
    `<div class="bookmark-chip">🔖 ${_esc(name)}</div>`).join('');
}

function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
