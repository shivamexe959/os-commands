import { NotesService } from '../firebase/firestore.js';
import { awardXP } from './xp.js';

let _uid = null;
let _notes = [];
let _activeNoteId = null;
let _saveTimer = null;

export function initNotes(uid) {
  _uid = uid;
  loadNotes();
}

export async function loadNotes() {
  if (!_uid) return;
  try {
    _notes = await NotesService.getAll(_uid);
    renderNotesList();
  } catch(e) { console.warn('Notes load failed', e); }
}

export function renderNotesList() {
  const list = document.getElementById('notes-list');
  if (!list) return;
  if (!_notes.length) { list.innerHTML = '<p class="empty">No notes yet. Create your first note!</p>'; return; }
  list.innerHTML = _notes.map(n => `
    <div class="note-item ${n.id === _activeNoteId ? 'active' : ''}" onclick="window._openNote('${n.id}')">
      <div class="note-title">${_esc(n.title || 'Untitled')}</div>
      <div class="note-preview">${_esc((n.body || '').slice(0, 80))}</div>
      <div class="note-meta">${_fmtDate(n.updatedAt)}</div>
      <button class="note-delete" onclick="event.stopPropagation();window._deleteNote('${n.id}')">🗑</button>
    </div>`).join('');
}

window._openNote = function(id) {
  const note = _notes.find(n => n.id === id);
  if (!note) return;
  _activeNoteId = id;
  document.getElementById('note-title-input').value = note.title || '';
  document.getElementById('note-body-input').value = note.body || '';
  renderNotesList();
};

window._deleteNote = async function(id) {
  if (!confirm('Delete this note?')) return;
  await NotesService.delete(_uid, id);
  if (_activeNoteId === id) { _activeNoteId = null; _clearEditor(); }
  await loadNotes();
};

window._newNote = function() {
  _activeNoteId = null;
  _clearEditor();
  document.getElementById('note-title-input')?.focus();
};

window._saveNote = async function() {
  const title = document.getElementById('note-title-input')?.value.trim();
  const body  = document.getElementById('note-body-input')?.value.trim();
  if (!title && !body) return;
  const id = await NotesService.save(_uid, _activeNoteId, { title: title || 'Untitled', body });
  if (!_activeNoteId) {
    _activeNoteId = id;
    await awardXP(_uid, 'noteCreated', true);
  }
  await loadNotes();
  _showToast('Note saved!', 'success');
};

function _autoSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => window._saveNote && window._saveNote(), 2000);
}

function _clearEditor() {
  const t = document.getElementById('note-title-input');
  const b = document.getElementById('note-body-input');
  if (t) t.value = '';
  if (b) b.value = '';
}

function _esc(s) { return String(s).replace(/[<>&"]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function _fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}
function _showToast(msg, type) { if (typeof showToast === 'function') showToast(msg, type); }
