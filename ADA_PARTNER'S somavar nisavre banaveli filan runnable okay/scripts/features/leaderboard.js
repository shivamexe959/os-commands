import { LeaderboardService } from '../firebase/firestore.js';
import { getLevel } from './xp.js';

export async function renderLeaderboard(currentUID) {
  const container = document.getElementById('leaderboard-list');
  if (!container) return;
  container.innerHTML = '<div class="loading-spin">Loading...</div>';
  try {
    const users = await LeaderboardService.getTop(20);
    container.innerHTML = users.map((u, i) => {
      const lvl = getLevel(u.xp || 0);
      const medals = ['🥇','🥈','🥉'];
      const rank = medals[i] || `#${i+1}`;
      const isMe = u.uid === currentUID;
      return `<div class="lb-row ${isMe ? 'lb-me' : ''}">
        <div class="lb-rank">${rank}</div>
        <img class="lb-avatar" src="${u.photoURL || ''}" onerror="this.src='assets/icons/avatar.svg'" />
        <div class="lb-info">
          <div class="lb-name">${_esc(u.name || 'Anonymous')} ${isMe ? '<span class="lb-you">You</span>' : ''}</div>
          <div class="lb-college">${_esc(u.college || u.university || '')}</div>
        </div>
        <div class="lb-right">
          <div class="lb-xp">${(u.xp||0).toLocaleString()} XP</div>
          <div class="lb-level">${lvl.icon} ${lvl.name}</div>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    container.innerHTML = '<p class="err">Failed to load leaderboard.</p>';
  }
}

export async function renderCollegeLeaderboard(college, currentUID) {
  const container = document.getElementById('college-lb-list');
  if (!container) return;
  if (!college) { container.innerHTML = '<p>Complete your profile to see college rankings.</p>'; return; }
  try {
    const users = await LeaderboardService.getCollegeRank(college);
    container.innerHTML = `<h4>🏫 ${_esc(college)}</h4>` +
      users.map((u, i) => `<div class="lb-row ${u.uid===currentUID?'lb-me':''}">
        <div class="lb-rank">#${i+1}</div>
        <div class="lb-info"><div class="lb-name">${_esc(u.name||'Anonymous')}</div></div>
        <div class="lb-xp">${(u.xp||0).toLocaleString()} XP</div>
      </div>`).join('');
  } catch(e) { container.innerHTML = '<p>Unavailable.</p>'; }
}

function _esc(s) { return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
