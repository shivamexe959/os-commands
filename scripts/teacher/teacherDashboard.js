// scripts/teacher/teacherDashboard.js
// Orchestrates the Teacher Console modal — mirrors pattern of studentDashboard.js / adminDashboard.js

import { isTeacher, DIVISIONS, getTeacherProfile } from './teacherRole.js';
import { showToast } from '../ui/toast.js';
import { openModal, closeModal } from '../ui/modal.js';
import {
  getClassRoster, getOnlineStudents, renderRosterTable,
  getStudentDetail, renderStudentDetailPanel,
  createGroup, getGroupsByDivision, deleteGroup,
  assignStudentToGroup, removeStudentFromGroup,
  getNotAttemptedReport
} from './classRoster.js';
import {
  getQuizSetsByTeacher, createQuizSet, activateQuizForDivision,
  deactivateQuizForDivision, deleteQuizSet, addCustomQuestion,
  getQuizResultsByDivision, analyzeQuizResults,
  renderQuizResultsPanel, renderQuizSetsPanel,
  markAlgoAsPractical, getPracticalsForDivision
} from './classQuizControl.js';
import {
  sendClassAnnouncement, sendDirectNotification, sendSpotlightNudge,
  startLabCountdown, stopLabCountdown, getActiveCountdown,
  getTeacherAnnouncements, deactivateAnnouncement,
  renderAnnouncementsPanel, renderCountdownBanner
} from './classAnnouncements.js';
import {
  startLabSession, endLabSession, getLabSessionHistory, getActiveLabSession,
  renderSessionLog, renderLiveFeed, renderSpotlightPanel, subscribeToLiveFeed
} from './classLiveSession.js';
import {
  muteStudent, unmuteStudent, getMutedStudents, grantBonusXP,
  getBonusXpLogForTeacher, renderModerationPanel,
  getFeedbackFromLabSession, renderFeedbackFromLab
} from './classModeration.js';
import {
  exportClassCSV, getSemesterSummary, getClassSyllabusCoverage,
  getDifficultyHeatmap, generateEndOfSemesterSummary,
  renderSemesterComparisonChart, renderSyllabusGrid,
  renderDifficultyHeatmap, GTU_SYLLABUS
} from './classReports.js';

// ─── State ────────────────────────────────────────────────────────────────────

let _teacherUid = null;
let _teacherData = null;
let _activeDivision = 'GX';
let _activeTab = 'overview';
let _activeLabSessionId = null;
let _countdownInterval = null;
let _liveFeedUnsub = null;
let _currentSpotlightAlgos = [];

// ─── All algorithm names (for spotlight + not-attempted report) ───────────────
const ALL_ALGORITHMS = [
  'Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort',
  'Heap Sort', 'Counting Sort', 'Radix Sort', 'Shell Sort',
  'Linear Search', 'Binary Search',
  "Kruskal's Algorithm", "Prim's Algorithm", "Dijkstra's Algorithm",
  'Bellman-Ford', 'Floyd-Warshall', 'Topological Sort', 'BFS', 'DFS',
  'Knapsack 0/1', 'Fractional Knapsack', 'Activity Selection',
  'Matrix Chain Multiplication', 'Longest Common Subsequence',
  'Coin Change', 'Optimal BST', 'Huffman Coding',
  'N-Queens Problem', 'Subset Sum', 'Graph Coloring',
  'Hamiltonian Cycle', 'Travelling Salesman Problem', 'Rat in Maze',
  'Naive String Matching', 'KMP Algorithm', 'Rabin-Karp', 'Boyer-Moore',
  'Strassen Matrix Multiplication'
];

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initTeacherDashboard(uid, userData) {
  if (!isTeacher(userData)) return;
  _teacherUid = uid;
  _teacherData = userData;
  _activeDivision = (userData.teacherDivisions || DIVISIONS)[0] || 'GX';
  _currentSpotlightAlgos = ALL_ALGORITHMS;

  // Wire division tabs
  document.querySelectorAll('.teacher-div-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeDivision = btn.dataset.div;
      document.querySelectorAll('.teacher-div-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _loadActiveTab();
    });
  });

  // Wire modal tabs
  document.querySelectorAll('.teacher-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = btn.dataset.tab;
      document.querySelectorAll('.teacher-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.teacher-tab-panel').forEach(p => p.style.display = 'none');
      const panel = document.getElementById(`teacher-tab-${_activeTab}`);
      if (panel) panel.style.display = 'block';
      _loadActiveTab();
    });
  });

  // Expose window functions
  _exposeWindowFunctions();

  // Check for active session
  _activeLabSessionId = (await getActiveLabSession(_teacherUid, _activeDivision))?.id || null;

  // Start countdown check
  _checkCountdown();
}

async function _loadActiveTab() {
  switch (_activeTab) {
    case 'overview': return _loadOverview();
    case 'roster': return _loadRoster();
    case 'quiz': return _loadQuiz();
    case 'reports': return _loadReports();
    case 'announcements': return _loadAnnouncements();
    case 'session': return _loadSession();
    case 'moderation': return _loadModeration();
    case 'syllabus': return _loadSyllabus();
  }
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

async function _loadOverview() {
  const summary = await getSemesterSummary();
  renderSemesterComparisonChart(summary, 'teacher-comparison-chart');

  // Current division quick stats
  const students = await getClassRoster(_activeDivision);
  const onlineRaw = await getOnlineStudents(_activeDivision);
  const onlineCount = onlineRaw.length;
  _set('teacher-div-student-count', students.length);
  _set('teacher-div-online-count', onlineCount);
  const avgXP = students.length
    ? Math.round(students.reduce((s, u) => s + (u.xp || 0), 0) / students.length)
    : 0;
  _set('teacher-div-avg-xp', avgXP);
}

// ─── Roster tab ───────────────────────────────────────────────────────────────

async function _loadRoster() {
  const [students, onlineRaw] = await Promise.all([
    getClassRoster(_activeDivision),
    getOnlineStudents(_activeDivision)
  ]);
  const onlineUids = new Set(onlineRaw.map(s => s.uid));
  renderRosterTable(students, onlineUids, 'teacher-roster-table');
  _set('teacher-online-count', onlineRaw.length);

  // Groups
  const groups = await getGroupsByDivision(_teacherUid, _activeDivision);
  _renderGroups(groups, students);

  // Not-attempted report
  const notAttempted = await getNotAttemptedReport(_activeDivision, ALL_ALGORITHMS);
  _renderNotAttempted(notAttempted);

  // Subscribe to live feed
  if (_liveFeedUnsub) _liveFeedUnsub();
  _liveFeedUnsub = subscribeToLiveFeed(_activeDivision, items => {
    renderLiveFeed(items, 'teacher-live-feed');
  });
}

function _renderGroups(groups, students) {
  const el = document.getElementById('teacher-groups-container');
  if (!el) return;
  if (!groups.length) {
    el.innerHTML = `
      <p class="teacher-empty">No groups yet. Create one:</p>
      <input id="new-group-name" class="teacher-input" placeholder="Group name (e.g. Bench 3)">
      <button class="btn-primary" onclick="window._teacherCreateGroup()">Create Group</button>`;
    return;
  }
  const html = groups.map(g => `
    <div class="teacher-group-card">
      <strong>${g.name}</strong> (${(g.members || []).length} students)
      <div class="group-members">
        ${(g.members || []).map(m => `
          <span class="group-member-chip">
            ${m.name}
            <button onclick="window._teacherRemoveFromGroup('${g.id}','${m.uid}')" class="chip-remove">×</button>
          </span>`).join('')}
      </div>
      <select id="group-add-${g.id}" class="teacher-select-sm">
        <option value="">Add student…</option>
        ${students.map(s =>
          `<option value="${s.uid}" data-name="${s.name}">${s.name}</option>`
        ).join('')}
      </select>
      <button class="btn-sm btn-outline" onclick="window._teacherAddToGroup('${g.id}')">Add</button>
      <button class="btn-sm btn-outline" onclick="window._teacherDeleteGroup('${g.id}')">Delete Group</button>
    </div>`).join('');
  el.innerHTML = html + `
    <hr class="teacher-divider">
    <input id="new-group-name" class="teacher-input" placeholder="New group name">
    <button class="btn-primary" onclick="window._teacherCreateGroup()">+ Create Group</button>`;
}

function _renderNotAttempted(report) {
  const el = document.getElementById('teacher-not-attempted');
  if (!el) return;
  el.innerHTML = report.slice(0, 20).map(s => `
    <div class="not-attempted-row">
      <strong>${s.name}</strong> — tried ${s.attempted} of ${ALL_ALGORITHMS.length} algorithms
      ${s.missing.length ? `<span class="teacher-hint">Not tried: ${s.missing.slice(0, 5).join(', ')}${s.missing.length > 5 ? '…' : ''}</span>` : '<span class="badge-green">All done!</span>'}
    </div>`).join('') || '<p class="teacher-empty">No data.</p>';
}

// ─── Quiz tab ─────────────────────────────────────────────────────────────────

async function _loadQuiz() {
  const [sets, results] = await Promise.all([
    getQuizSetsByTeacher(_teacherUid),
    getQuizResultsByDivision(_activeDivision)
  ]);
  renderQuizSetsPanel(sets, _activeDivision, 'teacher-quiz-sets');
  const analysis = analyzeQuizResults(results);
  renderQuizResultsPanel(results, analysis, 'teacher-quiz-results');

  const practicals = await getPracticalsForDivision(_activeDivision);
  _renderPracticals(practicals);
}

function _renderPracticals(practicals) {
  const el = document.getElementById('teacher-practicals-list');
  if (!el) return;
  el.innerHTML = practicals.length
    ? practicals.map(p => `
        <div class="practical-row">
          <span>${p.algoName}</span>
          <span class="badge-green">Practical — ${p.labDate}</span>
        </div>`).join('')
    : '<p class="teacher-empty">No practicals marked yet.</p>';
}

// ─── Reports tab ──────────────────────────────────────────────────────────────

async function _loadReports() {
  const heatmap = await getDifficultyHeatmap(_activeDivision);
  renderDifficultyHeatmap(heatmap, 'teacher-heatmap');
  const coverage = await getClassSyllabusCoverage(_activeDivision);
  renderSyllabusGrid(coverage, 'teacher-syllabus-grid-reports');
}

// ─── Announcements tab ────────────────────────────────────────────────────────

async function _loadAnnouncements() {
  const anns = await getTeacherAnnouncements(_teacherUid);
  renderAnnouncementsPanel(anns, 'teacher-ann-history');
  renderSpotlightPanel(null, _activeDivision, ALL_ALGORITHMS, 'teacher-spotlight-panel');
}

// ─── Session tab ─────────────────────────────────────────────────────────────

async function _loadSession() {
  const sessions = await getLabSessionHistory(_teacherUid, _activeDivision);
  renderSessionLog(sessions, 'teacher-session-log');
  _checkCountdown();
}

// ─── Moderation tab ───────────────────────────────────────────────────────────

async function _loadModeration() {
  const [muted, bonusLog, feedback] = await Promise.all([
    getMutedStudents(_activeDivision),
    getBonusXpLogForTeacher(_teacherUid),
    getFeedbackFromLabSession(_activeDivision)
  ]);
  renderModerationPanel(muted, bonusLog, 'teacher-moderation-panel');
  renderFeedbackFromLab(feedback, 'teacher-lab-feedback');
}

// ─── Syllabus tab ─────────────────────────────────────────────────────────────

async function _loadSyllabus() {
  const coverage = await getClassSyllabusCoverage(_activeDivision);
  renderSyllabusGrid(coverage, 'teacher-syllabus-grid');
}

// ─── Countdown helpers ────────────────────────────────────────────────────────

async function _checkCountdown() {
  const cd = await getActiveCountdown(_activeDivision);
  const el = document.getElementById('teacher-countdown-display');
  if (!cd) {
    if (el) el.style.display = 'none';
    return;
  }
  if (_countdownInterval) clearInterval(_countdownInterval);
  _countdownInterval = setInterval(async () => {
    const fresh = await getActiveCountdown(_activeDivision);
    renderCountdownBanner(fresh, 'teacher-countdown-display');
    if (!fresh && _countdownInterval) clearInterval(_countdownInterval);
  }, 1000);
  renderCountdownBanner(cd, 'teacher-countdown-display');
}

// ─── Expose window functions ──────────────────────────────────────────────────

function _exposeWindowFunctions() {
  window._openTeacherDashboard = async () => {
    openModal('teacher-modal');
    await _loadOverview();
    document.querySelectorAll('.teacher-div-tab')[0]?.click();
    document.querySelectorAll('.teacher-tab-btn')[0]?.click();
  };

  window._teacherViewStudent = async uid => {
    const detail = await getStudentDetail(uid);
    renderStudentDetailPanel(detail);
    openModal('teacher-student-modal');
  };

  window._teacherActivateQuiz = async id => {
    await activateQuizForDivision(id, _activeDivision);
    showToast(`Quiz activated for ${_activeDivision}`, 'success');
    _loadQuiz();
  };
  window._teacherDeactivateQuiz = async id => {
    await deactivateQuizForDivision(id, _activeDivision);
    showToast('Quiz deactivated', 'info');
    _loadQuiz();
  };
  window._teacherDeleteQuizSet = async id => {
    if (!confirm('Delete this quiz set? This cannot be undone.')) return;
    await deleteQuizSet(id);
    showToast('Quiz set deleted', 'info');
    _loadQuiz();
  };

  window._teacherCreateQuizSet = async () => {
    const name = document.getElementById('new-quiz-name')?.value?.trim();
    if (!name) { showToast('Enter a name for the quiz set', 'error'); return; }
    await createQuizSet(_teacherUid, name);
    showToast('Quiz set created!', 'success');
    _loadQuiz();
  };

  window._teacherAddQuestion = async () => {
    const setId = document.getElementById('add-q-set-id')?.value;
    const q = document.getElementById('add-q-text')?.value?.trim();
    const a = document.getElementById('add-q-opt-a')?.value?.trim();
    const b = document.getElementById('add-q-opt-b')?.value?.trim();
    const c = document.getElementById('add-q-opt-c')?.value?.trim();
    const d = document.getElementById('add-q-opt-d')?.value?.trim();
    const ans = parseInt(document.getElementById('add-q-answer')?.value || '0');
    if (!setId || !q || !a || !b || !c || !d) {
      showToast('Fill in all question fields', 'error'); return;
    }
    await addCustomQuestion(setId, { question: q, options: [a, b, c, d], answer: ans });
    showToast('Question added!', 'success');
  };

  window._teacherMarkPractical = async () => {
    const algo = document.getElementById('practical-algo-select')?.value;
    const date = document.getElementById('practical-date')?.value || new Date().toISOString().split('T')[0];
    if (!algo) { showToast('Select an algorithm', 'error'); return; }
    await markAlgoAsPractical(_teacherUid, _activeDivision, algo, date);
    showToast(`${algo} marked as practical for ${_activeDivision}`, 'success');
    _loadQuiz();
  };

  window._teacherSendAnnouncement = async () => {
    const title = document.getElementById('ann-title')?.value?.trim();
    const body = document.getElementById('ann-body')?.value?.trim();
    const target = document.getElementById('ann-target')?.value || _activeDivision;
    if (!title || !body) { showToast('Fill in title and body', 'error'); return; }
    const targetClass = target === 'all' ? null : target;
    await sendClassAnnouncement(_teacherUid, title, body, targetClass);
    showToast(`Announcement sent to ${targetClass || 'all classes'}!`, 'success');
    document.getElementById('ann-title').value = '';
    document.getElementById('ann-body').value = '';
    _loadAnnouncements();
  };

  window._teacherDeactivateAnn = async id => {
    await deactivateAnnouncement(id);
    showToast('Announcement deactivated', 'info');
    _loadAnnouncements();
  };

  window._teacherSendDirectNotif = async () => {
    const uid = document.getElementById('direct-notif-uid')?.value?.trim();
    const title = document.getElementById('direct-notif-title')?.value?.trim();
    const body = document.getElementById('direct-notif-body')?.value?.trim();
    if (!uid || !title || !body) { showToast('Fill all notification fields', 'error'); return; }
    await sendDirectNotification(_teacherUid, uid, title, body);
    showToast('Notification sent!', 'success');
  };

  window._teacherSendSpotlight = async () => {
    const algo = document.getElementById('spotlight-algo-select')?.value;
    if (!algo) return;
    const count = await sendSpotlightNudge(_teacherUid, _activeDivision, algo);
    showToast(`Spotlight sent to ${count} students in ${_activeDivision}!`, 'success');
  };

  window._teacherStartCountdown = async () => {
    const mins = parseInt(document.getElementById('countdown-mins')?.value || '120');
    const title = document.getElementById('countdown-title')?.value?.trim() ||
      `Lab Session — ${_activeDivision}`;
    await startLabCountdown(_teacherUid, _activeDivision, mins, title);
    showToast('Lab countdown started!', 'success');
    _checkCountdown();
  };
  window._teacherStopCountdown = async () => {
    await stopLabCountdown(_activeDivision);
    if (_countdownInterval) clearInterval(_countdownInterval);
    const el = document.getElementById('teacher-countdown-display');
    if (el) el.style.display = 'none';
    showToast('Countdown stopped', 'info');
  };

  window._teacherStartSession = async () => {
    const title = document.getElementById('session-title-input')?.value?.trim() ||
      `Lab — ${_activeDivision} — ${new Date().toLocaleDateString()}`;
    if (_activeLabSessionId) { showToast('A session is already active!', 'error'); return; }
    _activeLabSessionId = await startLabSession(_teacherUid, _activeDivision, title);
    showToast('Lab session started!', 'success');
    _loadSession();
  };
  window._teacherEndSession = async id => {
    if (!confirm('End this lab session?')) return;
    await endLabSession(id || _activeLabSessionId);
    _activeLabSessionId = null;
    showToast('Session ended and saved', 'success');
    _loadSession();
  };

  window._teacherMuteStudent = async () => {
    const uid = document.getElementById('mute-student-uid')?.value?.trim();
    const reason = document.getElementById('mute-reason')?.value?.trim() || '';
    if (!uid) { showToast('Enter student UID', 'error'); return; }
    await muteStudent(_teacherUid, uid, reason);
    showToast('Student muted (reversible)', 'success');
    _loadModeration();
  };
  window._teacherUnmute = async uid => {
    await unmuteStudent(uid);
    showToast('Student unmuted', 'success');
    _loadModeration();
  };

  window._teacherGrantBonus = async () => {
    const uid = document.getElementById('bonus-uid')?.value?.trim();
    const name = document.getElementById('bonus-name')?.value?.trim() || uid;
    const amount = parseInt(document.getElementById('bonus-amount')?.value || '0');
    const reason = document.getElementById('bonus-reason')?.value?.trim();
    if (!uid || !amount || !reason) { showToast('Fill in all bonus XP fields', 'error'); return; }
    await grantBonusXP(_teacherUid, uid, name, amount, reason);
    showToast(`+${amount} XP granted!`, 'success');
    _loadModeration();
  };

  window._teacherExportCSV = () => exportClassCSV(_activeDivision);
  window._teacherExportSemester = () => generateEndOfSemesterSummary();

  window._teacherCreateGroup = async () => {
    const name = document.getElementById('new-group-name')?.value?.trim();
    if (!name) { showToast('Enter a group name', 'error'); return; }
    await createGroup(_teacherUid, _activeDivision, name);
    showToast(`Group "${name}" created`, 'success');
    _loadRoster();
  };
  window._teacherDeleteGroup = async id => {
    if (!confirm('Delete this group?')) return;
    await deleteGroup(id);
    showToast('Group deleted', 'info');
    _loadRoster();
  };
  window._teacherAddToGroup = async id => {
    const sel = document.getElementById(`group-add-${id}`);
    if (!sel?.value) return;
    const opt = sel.options[sel.selectedIndex];
    await assignStudentToGroup(id, sel.value, opt.dataset.name || sel.value);
    showToast('Student added to group', 'success');
    _loadRoster();
  };
  window._teacherRemoveFromGroup = async (groupId, uid) => {
    await removeStudentFromGroup(groupId, uid);
    showToast('Removed from group', 'info');
    _loadRoster();
  };
}

// ─── Tiny helper ─────────────────────────────────────────────────────────────

function _set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Public open trigger (also exposed on window in exposeWindowFunctions) ────

export function openTeacherDashboard() {
  window._openTeacherDashboard?.();
}
