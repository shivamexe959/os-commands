import { AdminService, NotificationService } from '../firebase/firestore.js';
import { UserService } from '../firebase/database.js';
import { ADMIN_CONFIG } from '../../config/adminConfig.js';

let _allUsers = [];
let _unsubFeedback = null;
let _unsubBugs = null;

export async function initAdminDashboard() {
  await _loadOverview();
  _loadUsers();
  _unsubFeedback = AdminService.listenToFeedback(_renderFeedback);
  _unsubBugs = AdminService.listenToBugReports(_renderBugs);
  _renderAnnouncementForm();
}

export function destroyAdminDashboard() {
  if (_unsubFeedback) _unsubFeedback();
  if (_unsubBugs) _unsubBugs();
}

async function _loadOverview() {
  try {
    const stats = await AdminService.getAnalyticsOverview();
    _set('admin-total-users', stats.totalUsers || 0);
    _set('admin-today-users', stats.todayUsers || 0);
    _set('admin-sessions', stats.totalSessions || 0);
    _set('admin-avg-session', Math.round((stats.avgSession || 0) / 60) + ' min');
    _renderBreakdown('admin-device-chart', stats.deviceBreakdown);
    _renderBreakdown('admin-browser-chart', stats.browserBreakdown);
    _renderBreakdown('admin-os-chart', stats.osBreakdown);
    _renderBreakdown('admin-college-chart', stats.collegeBreakdown);
  } catch(e) { console.error('Admin overview failed', e); }
}

async function _loadUsers() {
  try {
    _allUsers = await UserService.getAllUsers(200);
    _renderUsersTable(_allUsers);
  } catch(e) { console.error('Users load failed', e); }
}

function _renderUsersTable(users) {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><img class="admin-avatar" src="${_esc(u.photoURL||'')}" onerror="this.src='assets/icons/avatar.svg'"/></td>
      <td>${_esc(u.name||'')}</td>
      <td>${_esc(u.email||'')}</td>
      <td>${_esc(u.college||'')}</td>
      <td>${(u.xp||0).toLocaleString()}</td>
      <td><span class="role-badge role-${u.role||'student'}">${u.role||'student'}</span></td>
      <td>${_fmtDate(u.lastLogin)}</td>
      <td class="admin-actions">
        <button class="btn-sm btn-danger" onclick="window._adminBan('${u.uid}')">Ban</button>
        <button class="btn-sm btn-info" onclick="window._adminPromote('${u.uid}')">Admin</button>
        <button class="btn-sm btn-danger" onclick="window._adminDelete('${u.uid}')">Delete</button>
      </td>
    </tr>`).join('');
}

function _renderFeedback(feedback) {
  const list = document.getElementById('admin-feedback-list');
  if (!list) return;
  if (!feedback.length) { list.innerHTML = '<p class="empty">No feedback yet.</p>'; return; }
  list.innerHTML = feedback.map(f => `
    <div class="admin-feedback-item">
      <div class="fb-stars">${'★'.repeat(f.rating||0)}${'☆'.repeat(5-(f.rating||0))}</div>
      <div class="fb-comment">${_esc(f.comment||'')}</div>
      <div class="fb-meta">${_esc(f.category||'')} · ${_fmtDate(f.timestamp)}</div>
    </div>`).join('');
}

function _renderBugs(bugs) {
  const list = document.getElementById('admin-bugs-list');
  if (!list) return;
  if (!bugs.length) { list.innerHTML = '<p class="empty">No bug reports.</p>'; return; }
  list.innerHTML = bugs.map(b => `
    <div class="admin-bug-item priority-${b.priority||'medium'}">
      <div class="bug-title">${_esc(b.title||'')}</div>
      <div class="bug-desc">${_esc(b.description||'')}</div>
      <div class="bug-meta">Priority: ${b.priority} · ${_fmtDate(b.timestamp)}</div>
    </div>`).join('');
}

function _renderBreakdown(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el || !data) return;
  const total = Object.values(data).reduce((a,b)=>a+b,0) || 1;
  el.innerHTML = Object.entries(data).slice(0,8).map(([k,v]) => `
    <div class="breakdown-row">
      <span>${_esc(k)}</span>
      <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="width:${Math.round(v/total*100)}%"></div></div>
      <span>${v}</span>
    </div>`).join('');
}

function _renderAnnouncementForm() {
  const form = document.getElementById('announcement-form');
  if (!form) return;
  form.innerHTML = `
    <input id="ann-title" placeholder="Announcement title" />
    <textarea id="ann-body" placeholder="Announcement message" rows="3"></textarea>
    <select id="ann-type">
      <option value="info">Info</option>
      <option value="warning">Warning</option>
      <option value="success">Success</option>
      <option value="danger">Danger</option>
    </select>
    <button class="btn-primary" onclick="window._sendAnnouncement()">📢 Send to All Users</button>`;
}

window._adminBan    = async (uid) => { if(confirm('Ban this user?')) { await AdminService.banUser(uid); _loadUsers(); } };
window._adminDelete = async (uid) => { if(confirm('Delete user permanently?')) { await AdminService.deleteUser(uid); _loadUsers(); } };

// BUG FIX: replaced single "Admin" button with choice dialog for Teacher or Admin
window._adminPromote = async (uid) => {
  const choice = prompt(
    'Promote this user to which role?\n\nType "teacher" to make them a Teacher (can manage their division)\nType "admin" to make them an Admin (full access)\n\nEnter role:'
  );
  if (!choice) return;
  const role = choice.trim().toLowerCase();
  if (role === 'teacher') {
    const divs = prompt('Which divisions will this teacher manage?\n(comma-separated, e.g. GX,GY)\nLeave blank for all: GX,GY,GZ');
    const teacherDivisions = (divs || 'GX,GY,GZ').split(',').map(d => d.trim().toUpperCase()).filter(Boolean);
    await UserService.updateProfile(uid, {
      role: 'teacher',
      teacherDivisions,
      teacherSince: new Date().toISOString()
    });
    alert('✅ User promoted to Teacher role with divisions: ' + teacherDivisions.join(', '));
    _loadUsers();
  } else if (role === 'admin') {
    if (!confirm('Grant FULL ADMIN access to this user? This cannot be easily undone.')) return;
    await AdminService.promoteAdmin(uid);
    alert('✅ User promoted to Admin.');
    _loadUsers();
  } else {
    alert('Invalid role. Please type "teacher" or "admin".');
  }
};

window._adminExportCSV = async function() {
  const csv = await AdminService.exportUsersCSV(_allUsers);
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ada_users_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
};

window._sendAnnouncement = async function() {
  const title = document.getElementById('ann-title')?.value.trim();
  const body  = document.getElementById('ann-body')?.value.trim();
  const type  = document.getElementById('ann-type')?.value || 'info';
  if (!title || !body) { alert('Title and body required.'); return; }
  await NotificationService.sendGlobal({ title, body, type });
  if (typeof showToast === 'function') showToast('Announcement sent!','success');
};

window._adminSearch = function(query) {
  const q = query.toLowerCase();
  const filtered = _allUsers.filter(u =>
    (u.name||'').toLowerCase().includes(q) ||
    (u.email||'').toLowerCase().includes(q) ||
    (u.college||'').toLowerCase().includes(q)
  );
  _renderUsersTable(filtered);
};

window._openAdminTab = function(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelector(`.admin-tab[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`admin-sec-${tab}`)?.classList.add('active');
};

function _set(id, val) { const el=document.getElementById(id); if(el) el.textContent=val; }
function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function _fmtDate(ts) { try{ const d=ts?.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString('en-IN'); }catch{return '';} }
