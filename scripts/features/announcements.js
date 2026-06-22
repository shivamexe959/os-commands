import { NotificationService } from '../firebase/firestore.js';

// BUG FIX: XSS guard — escape untrusted text before inserting into innerHTML
function _safe(s) {
  return String(s || '').replace(/[<>&"']/g, c =>
    ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
}

export function listenToAnnouncements() {
  return NotificationService.listenToAnnouncements((announcements) => {
    const bar = document.getElementById('announcement-bar');
    if (!bar) return;
    if (!announcements.length) { bar.style.display = 'none'; return; }
    const ann = announcements[0];
    bar.style.display = 'flex';
    // BUG FIX: use _safe() to prevent XSS; fix close button selector
    // (this.closest('#announcement-bar') fails — element node != ID selector)
    bar.innerHTML = `<span>${_safe(ann.title || ann.body || '')}</span>
      <button onclick="document.getElementById('announcement-bar').style.display='none'" style="background:none;border:none;cursor:pointer;color:inherit;font-size:1rem">✕</button>`;
    bar.className = `announcement-bar ann-${_safe(ann.type || 'info')}`;
  });
}
