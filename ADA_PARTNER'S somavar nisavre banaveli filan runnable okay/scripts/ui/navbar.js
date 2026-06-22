import { openModal } from './modal.js';
import { toggleTheme } from './theme.js';
import { signOutUser } from '../firebase/auth.js';

export function renderNavbar(user, userData, isAdmin) {
  const navbar = document.getElementById('v2-navbar');
  if (!navbar) return;
  const xp = userData?.xp || 0;
  const coins = userData?.coins || 0;
  const streak = userData?.currentStreak || 0;
  navbar.innerHTML = `
  <div class="navbar-left">
    <button class="navbar-toggle" onclick="toggleSidebar()">☰</button>
    <span class="navbar-brand">⚡ ADA Lab</span>
  </div>
  <div class="navbar-right">
    ${user ? `
    <div class="navbar-stat" title="XP Points">⚡ ${xp.toLocaleString()}</div>
    <div class="navbar-stat" title="Coins">🪙 ${coins}</div>
    <div class="navbar-stat" title="Streak">🔥 ${streak}</div>
    <button class="navbar-icon-btn" id="notif-btn" onclick="openModal('notif-modal')" title="Notifications">
      🔔<span class="notif-badge" id="notif-badge" style="display:none">0</span>
    </button>
    ${isAdmin ? `<button class="navbar-icon-btn admin-btn" onclick="openModal('admin-modal')" title="Admin Panel">🛡️</button>` : ''}
    ${(!isAdmin && (userData?.role === 'teacher')) ? `<button class="navbar-icon-btn teacher-btn" onclick="openModal('teacher-modal')" title="Teacher Console">📋</button>` : ''}
    <button class="navbar-icon-btn" onclick="openModal('dashboard-modal')" title="Dashboard">📊</button>
    <img class="navbar-avatar" src="${user.photoURL||'assets/icons/avatar.svg'}" 
         onerror="this.src='assets/icons/avatar.svg'"
         onclick="openModal('dashboard-modal')" title="${user.displayName||''}"/>
    <button class="navbar-icon-btn" onclick="window._signOut()" title="Sign Out">🚪</button>
    ` : `
    <button class="btn-primary navbar-login-btn" onclick="document.getElementById('firebase-login-overlay').style.display='flex'">Sign In with Google</button>
    `}
    <button class="navbar-icon-btn" id="theme-toggle" onclick="toggleTheme()" title="Toggle Theme">☀️</button>
  </div>`;
}

window._signOut = async function() {
  if (!confirm('Sign out of ADA Lab?')) return;
  await signOutUser();
  window.location.reload();
};

window.openModal = openModal;
window.toggleTheme = toggleTheme;
