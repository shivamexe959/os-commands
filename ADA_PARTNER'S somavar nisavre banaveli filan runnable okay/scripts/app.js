/**
 * ADA Algorithm Lab v2.0 — Main Application Entry Point
 * Orchestrates all business modules after Firebase auth.
 */
import { onAuthChange, signInWithGoogle, signOutUser, currentUser, isAdmin as getIsAdmin } from './firebase/auth.js';
import { UserService } from './firebase/database.js';
import { initStudentDashboard } from './dashboard/studentDashboard.js';
import { initAdminDashboard, destroyAdminDashboard } from './dashboard/adminDashboard.js';
import { initTeacherDashboard } from './teacher/teacherDashboard.js';
import { initNotifications, destroyNotifications } from './features/notifications.js';
import { initDonations } from './features/donations.js';
import { initFeedback } from './features/feedback.js';
import { initPreferences } from './features/preferences.js';
import { initPDF } from './features/pdf.js';
import { initSearch, trackSearch } from './features/searchHistory.js';
import { renderSearchHistory } from './features/searchHistory.js';
import { trackAlgorithmOpen } from './features/recent.js';
import { renderBookmarks } from './features/bookmarks.js';
import { renderStatistics } from './features/statistics.js';
import { backupToCloud, restoreFromCloud } from './features/cloudBackup.js';
import { showToast } from './ui/toast.js';
import { initModalCloseHandlers, openModal } from './ui/modal.js';
import { initTheme } from './ui/theme.js';
import { renderNavbar } from './ui/navbar.js';
import { parseSearchParams } from './helpers.js';
import { ADMIN_CONFIG } from '../config/adminConfig.js';

let _uid = null;
let _userData = null;
let _isAdmin = false;

/* ── Bootstrap ─────────────────────────────────────────── */
async function init() {
  initModalCloseHandlers();
  initTheme(null);
  _checkMaintenance();
  _handleReferral();

  onAuthChange(async (user, isAdmin, freshUserData) => {
    if (user) {
      _uid = user.uid;
      _isAdmin = isAdmin;
      // Use fresh userData from auth.js if available (avoids extra Firestore read)
      _userData = freshUserData || await UserService.getUser(user.uid);
      await _onLogin(user, isAdmin);
    } else {
      _uid = null;
      _userData = null;
      _isAdmin = false;
      _onLogout();
    }
  });
}

async function _onLogin(user, isAdmin) {
  const isTeacher = _userData?.role === 'teacher';
  renderNavbar(user, _userData, isAdmin);
  initTheme(_userData);
  initNotifications(user.uid);
  initDonations(user.uid, user.displayName || 'Anonymous');
  initFeedback(user.uid);
  initPreferences(user.uid, _userData);
  initPDF(user.uid);
  initSearch(user.uid);

  // Restore cloud backup
  await restoreFromCloud(user.uid);

  // Update streak
  const newStreak = await UserService.updateStreak(user.uid);
  if (newStreak && newStreak > 1) {
    showToast(`🔥 ${newStreak}-day streak! Keep it up!`, 'success');
  }

  // Store dashboard globals
  window._currentUID = user.uid;
  window._currentCollege = _userData?.college || '';

  // Lazy-load dashboard when first opened
  document.getElementById('dashboard-modal')?.addEventListener('click', _noop, { once: true });

  // Hook into existing search
  const searchInput = document.getElementById('search-input') ||
                      document.getElementById('algo-search') ||
                      document.querySelector('input[type="search"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => trackSearch(e.target.value));
  }

  // Hook into existing algorithm tools (filterAlgorithms exposed globally by algorithms.js)
  _wrapShowTool();

  // Show admin panel button only for admins
  const adminBtn = document.querySelector('.admin-btn');
  if (adminBtn) adminBtn.style.display = isAdmin ? '' : 'none';

  // Lazy init dashboard on first open
  document.getElementById('dashboard-modal')?.addEventListener('mousedown', async () => {
    if (!window._dashInited) {
      window._dashInited = true;
      await initStudentDashboard(user.uid);
    }
  }, { once: true });

  // Lazy init admin on first open
  if (isAdmin) {
    document.getElementById('admin-modal')?.addEventListener('mousedown', async () => {
      if (!window._adminInited) {
        window._adminInited = true;
        await initAdminDashboard();
      }
    }, { once: true });
  }

  // Lazy init teacher console on first open
  if (isTeacher && !isAdmin) {
    document.getElementById('teacher-modal')?.addEventListener('mousedown', async () => {
      if (!window._teacherInited) {
        window._teacherInited = true;
        await initTeacherDashboard(user.uid, _userData);
      }
    }, { once: true });
  }

  // Global announcement
  if (ADMIN_CONFIG.announcement) {
    const bar = document.getElementById('announcement-bar');
    if (bar) {
      bar.textContent = ADMIN_CONFIG.announcement;
      bar.className = `announcement-bar ann-${ADMIN_CONFIG.announcementType || 'info'}`;
      bar.style.display = 'flex';
    }
  }

  // Send welcome notification on first login
  if (_userData?.totalSessions <= 1) {
    const { NotificationService } = await import('./firebase/firestore.js');
    await NotificationService.send(user.uid, {
      title: 'Welcome to ADA Algorithm Lab! 🎉',
      body: `Hi ${user.displayName?.split(' ')[0] || 'there'}! Explore 30+ algorithm visualizers and earn XP!`,
      type: 'welcome'
    });
  }

  // Auto-backup every session
  setTimeout(() => backupToCloud(user.uid), 5000);
}

function _onLogout() {
  renderNavbar(null, null, false);
  destroyNotifications();
  window._dashInited = false;
  window._adminInited = false;
}

/* ── Algorithm Tracking Bridge ─────────────────────────── */
function _wrapShowTool() {
  // Bridge: intercept showTool calls to track algorithm opens
  const orig = window.showTool;
  if (typeof orig !== 'function') return;
  window.showTool = function(toolId) {
    orig.apply(this, arguments);
    if (_uid) {
      const name = _getAlgoName(toolId);
      if (name) trackAlgorithmOpen(_uid, name).catch(() => {});
    }
  };
}

function _getAlgoName(toolId) {
  const map = {
    'bubble-sort':'Bubble Sort','selection-sort':'Selection Sort','insertion-sort':'Insertion Sort',
    'merge-sort':'Merge Sort','quick-sort':'Quick Sort','heap-sort':'Heap Sort',
    'radix-sort':'Radix Sort','counting-sort':'Counting Sort',
    'linear-search':'Linear Search','binary-search':'Binary Search','jump-search':'Jump Search',
    'knapsack':'Knapsack','lcs':'LCS','matrix-chain':'Matrix Chain','coin-change':'Coin Change',
    'kruskal':'Kruskal','prim':'Prim','dijkstra':'Dijkstra','floyd':'Floyd-Warshall',
    'n-queens':'N-Queens','sudoku':'Sudoku','graph-coloring':'Graph Coloring',
    'kmp':'KMP','rabin-karp':'Rabin-Karp','boyer-moore':'Boyer-Moore'
  };
  return map[toolId] || toolId;
}

/* ── Maintenance Check ─────────────────────────────────── */
function _checkMaintenance() {
  if (ADMIN_CONFIG.maintenanceMode) {
    document.body.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f1117;color:#e8eaf6;text-align:center;padding:20px">
      <div><div style="font-size:4rem;margin-bottom:16px">🔧</div><h1>${ADMIN_CONFIG.appVersion} — Maintenance</h1><p style="color:#9096b0;margin-top:8px">${ADMIN_CONFIG.maintenanceMessage}</p></div></div>`;
  }
}

/* ── Referral Handling ─────────────────────────────────── */
function _handleReferral() {
  const params = parseSearchParams();
  if (params.ref) localStorage.setItem('ada_referral', params.ref);
}

/* ── Expose globals for dashboard tabs ─────────────────── */
window._openAlgoByName = function(name) {
  closeAllModals?.();
  // Try to call filterAlgorithms if available
  if (typeof filterAlgorithms === 'function') filterAlgorithms(name);
};

// Expose openModal / showToast globally for onclick handlers in HTML
window.openModal = openModal;

function _noop() {}

// Start the application
init().catch(console.error);
