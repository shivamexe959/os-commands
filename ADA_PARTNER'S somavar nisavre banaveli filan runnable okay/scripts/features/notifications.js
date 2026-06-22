import { NotificationService } from '../firebase/firestore.js';

let _uid = null;
let _unsubscribe = null;
let _unsubAnnounce = null;

export function initNotifications(uid) {
  _uid = uid;
  if (_unsubscribe) _unsubscribe();
  if (_unsubAnnounce) _unsubAnnounce();
  _unsubscribe = NotificationService.listenToNotifications(uid, _onNotifications);
  _unsubAnnounce = NotificationService.listenToAnnouncements(_onAnnouncements);
}

export function destroyNotifications() {
  if (_unsubscribe) _unsubscribe();
  if (_unsubAnnounce) _unsubAnnounce();
}

function _onNotifications(notifications) {
  const unread = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread ? 'flex' : 'none'; }
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!notifications.length) { list.innerHTML = '<p class="empty">No notifications.</p>'; return; }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <div class="notif-icon">${_typeIcon(n.type)}</div>
      <div class="notif-content">
        <div class="notif-title">${_esc(n.title)}</div>
        <div class="notif-body">${_esc(n.body)}</div>
        <div class="notif-time">${_fmtDate(n.timestamp)}</div>
      </div>
      <div class="notif-actions">
        ${!n.read ? `<button onclick="window._markNotifRead('${n.id}')">✓</button>` : ''}
        <button onclick="window._deleteNotif('${n.id}')">🗑</button>
      </div>
    </div>`).join('');
}

function _onAnnouncements(announcements) {
  const bar = document.getElementById('announcement-bar');
  if (!bar) return;
  if (!announcements.length) { bar.style.display = 'none'; return; }
  const ann = announcements[0];
  bar.style.display = 'flex';
  bar.innerHTML = `<span>${_esc(ann.title || ann.body || '')}</span>
    <button onclick="document.getElementById('announcement-bar').style.display='none'">✕</button>`;
  bar.className = `announcement-bar ann-${ann.type || 'info'}`;
}

window._markNotifRead = async function(id) {
  if (_uid) await NotificationService.markRead(_uid, id);
};
window._deleteNotif = async function(id) {
  if (_uid) await NotificationService.deleteNotification(_uid, id);
};

function _typeIcon(type) {
  return { achievement:'🏅', welcome:'👋', update:'🔔', system:'⚙️', exam:'📝' }[type] || '🔔';
}
function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function _fmtDate(ts) { try{ const d=ts?.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }catch{return '';} }
