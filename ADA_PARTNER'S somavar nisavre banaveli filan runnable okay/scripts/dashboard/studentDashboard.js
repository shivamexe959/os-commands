import { UserService } from '../firebase/database.js';
import { NotesService, PDFService } from '../firebase/firestore.js';
import { getLevel, getProgress, renderXPBar } from '../features/xp.js';
import { renderAchievements, checkAndAward } from '../features/achievements.js';
import { renderLeaderboard, renderCollegeLeaderboard } from '../features/leaderboard.js';
import { renderStatistics, renderRecentActivity, renderRecentlyViewed, renderFavorites } from '../features/statistics.js';
import { initNotes, loadNotes } from '../features/notes.js';
import { renderStarRating } from '../features/feedback.js';

let _uid = null;
let _userData = null;

export async function initStudentDashboard(uid) {
  _uid = uid;
  _userData = await UserService.getUser(uid);
  if (!_userData) return;
  _renderProfile();
  renderXPBar(_userData);
  renderStatistics(_userData);
  renderAchievements(_userData);
  renderFavorites(_userData.favoriteAlgorithms);
  renderRecentlyViewed(_userData.recentlyViewed);
  initNotes(uid);
  renderStarRating('feedback-stars');
  await checkAndAward(uid, _userData, 'login');
  _renderStreak();
  _renderReferral();
  loadNotes();
}

function _renderProfile() {
  const d = _userData;
  _set('dash-name', d.name || 'Student');
  _set('dash-email', d.email || '');
  _set('dash-college', d.college || 'College not set');
  _set('dash-branch', d.branch ? `${d.branch} · Sem ${d.semester}` : 'Branch not set');
  _set('dash-coins', (d.coins || 0).toLocaleString());
  _set('dash-xp-val', (d.xp || 0).toLocaleString());
  _set('dash-streak', d.currentStreak || 0);
  _set('dash-badges', (d.badges || []).length);

  const avatar = document.getElementById('dash-avatar');
  if (avatar) avatar.src = d.photoURL || 'assets/icons/avatar.svg';

  const lvl = getLevel(d.xp || 0);
  const prog = getProgress(d.xp || 0);
  _set('dash-level', `${lvl.icon} ${lvl.name}`);
  const bar = document.getElementById('dash-xp-bar');
  if (bar) bar.style.width = prog + '%';

  const comp = d.profileCompletion || 0;
  _set('dash-profile-comp', comp + '%');
  const compBar = document.getElementById('dash-profile-bar');
  if (compBar) compBar.style.width = comp + '%';
}

function _renderStreak() {
  const streak = _userData.currentStreak || 0;
  const longest = _userData.longestStreak || 0;
  _set('streak-current', streak + ' 🔥');
  _set('streak-longest', longest);
  const cal = document.getElementById('streak-calendar');
  if (!cal) return;
  const days = ['S','M','T','W','T','F','S'];
  cal.innerHTML = days.map((d, i) => {
    const active = i < streak % 7;
    return `<div class="streak-day ${active?'active':''}">${d}</div>`;
  }).join('');
}

function _renderReferral() {
  const code = _userData.referralCode || '';
  const ref = document.getElementById('referral-code');
  if (ref) ref.textContent = code;
  const count = document.getElementById('referral-count');
  if (count) count.textContent = _userData.referralCount || 0;
}

window._openDashboardTab = function(tab) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelector(`.dash-tab[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`dash-sec-${tab}`)?.classList.add('active');
  if (tab === 'leaderboard') { renderLeaderboard(_uid); renderCollegeLeaderboard(_userData?.college, _uid); }
  if (tab === 'notes') loadNotes();
};

window._editProfile = function() {
  const d = _userData;
  document.getElementById('edit-name').value = d.name || '';
  document.getElementById('edit-college').value = d.college || '';
  document.getElementById('edit-university').value = d.university || '';
  document.getElementById('edit-semester').value = d.semester || '';
  document.getElementById('edit-branch').value = d.branch || '';
  document.getElementById('edit-phone').value = d.phone || '';
  document.getElementById('edit-country').value = d.country || '';
  document.getElementById('edit-city').value = d.city || '';
  const divEl = document.getElementById('edit-division');
  if (divEl) divEl.value = d.division || '';
  document.getElementById('profile-edit-modal').classList.add('active');
};

window._saveProfile = async function() {
  if (!_uid) return;
  const data = {
    name:       document.getElementById('edit-name')?.value.trim(),
    college:    document.getElementById('edit-college')?.value.trim(),
    university: document.getElementById('edit-university')?.value.trim(),
    semester:   document.getElementById('edit-semester')?.value.trim(),
    branch:     document.getElementById('edit-branch')?.value.trim(),
    phone:      document.getElementById('edit-phone')?.value.trim(),
    country:    document.getElementById('edit-country')?.value.trim(),
    city:       document.getElementById('edit-city')?.value.trim(),
    division:   document.getElementById('edit-division')?.value || ''
  };
  const fields = Object.values(data).filter(Boolean).length;
  data.profileCompletion = Math.min(100, 20 + fields * 10);
  await UserService.updateProfile(_uid, data);
  _userData = { ..._userData, ...data };
  _renderProfile();
  document.getElementById('profile-edit-modal')?.classList.remove('active');
  if (typeof showToast === 'function') showToast('Profile updated!','success');
};

window._copyReferral = function() {
  const code = _userData?.referralCode || '';
  const url = `${window.location.origin}${window.location.pathname}?ref=${code}`;
  navigator.clipboard.writeText(url).then(() => {
    if (typeof showToast === 'function') showToast('Referral link copied!','success');
  });
};

function _set(id, val) { const el = document.getElementById(id); if(el) el.textContent = val; }
