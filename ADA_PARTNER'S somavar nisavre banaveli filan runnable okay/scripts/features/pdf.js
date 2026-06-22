import { PDFService } from '../firebase/firestore.js';
import { awardXP } from './xp.js';

let _uid = null;
export function initPDF(uid) { _uid = uid; }

export async function onPDFExported(filename) {
  if (!_uid) return;
  await PDFService.record(_uid, filename);
  await awardXP(_uid, 'pdfExport', true);
}

export function renderPDFHistory(history) {
  const container = document.getElementById('pdf-history-list');
  if (!container) return;
  if (!history || !history.length) { container.innerHTML = '<p class="empty">No PDF exports yet.</p>'; return; }
  container.innerHTML = history.map(h => `
    <div class="pdf-history-item">
      <span class="pdf-icon">📄</span>
      <span>${_esc(h.filename||'Report')}</span>
      <span class="pdf-date">${_fmtDate(h.timestamp)}</span>
    </div>`).join('');
}

function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function _fmtDate(ts) { try{ const d=ts?.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }catch{return '';} }
