// scripts/teacher/classLiveSession.js
// Lab session log, history, spotlight/focus mode, live activity feed

import { db } from '../firebase/firebase.js';
import {
  collection, doc, setDoc, updateDoc, getDoc,
  serverTimestamp, query, where, getDocs,
  orderBy, limit, onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from '../ui/toast.js';

// ─── Lab Session record ───────────────────────────────────────────────────────

export async function startLabSession(teacherUid, division, labTitle) {
  const ref = doc(collection(db, 'teacherLabSessions'));
  await setDoc(ref, {
    id: ref.id,
    teacherUid,
    division,
    labTitle: labTitle || `Lab — ${division} — ${new Date().toLocaleDateString()}`,
    startTime: serverTimestamp(),
    endTime: null,
    durationMinutes: null,
    attendanceCount: 0,
    algorithmFocused: null,
    status: 'active',
    date: new Date().toISOString().split('T')[0]
  });
  return ref.id;
}

export async function endLabSession(sessionId) {
  const ref = doc(db, 'teacherLabSessions', sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const startMs = snap.data().startTime?.toMillis?.() || Date.now();
  const durationMinutes = Math.round((Date.now() - startMs) / 60000);
  await updateDoc(ref, {
    endTime: serverTimestamp(),
    durationMinutes,
    status: 'ended'
  });
}

export async function recordAttendance(sessionId, uid, name) {
  const ref = doc(db, 'teacherLabSessions', sessionId, 'attendees', uid);
  await setDoc(ref, { uid, name, joinedAt: serverTimestamp() }, { merge: true });
  const sessionRef = doc(db, 'teacherLabSessions', sessionId);
  const snap = await getDoc(sessionRef);
  await updateDoc(sessionRef, { attendanceCount: (snap.data().attendanceCount || 0) + 1 });
}

export async function setFocusAlgorithm(sessionId, algoName) {
  await updateDoc(doc(db, 'teacherLabSessions', sessionId), { algorithmFocused: algoName });
}

// ─── Lab Session history ──────────────────────────────────────────────────────

export async function getLabSessionHistory(teacherUid, division) {
  const q = query(
    collection(db, 'teacherLabSessions'),
    where('teacherUid', '==', teacherUid),
    where('division', '==', division),
    orderBy('date', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getActiveLabSession(teacherUid, division) {
  const q = query(
    collection(db, 'teacherLabSessions'),
    where('teacherUid', '==', teacherUid),
    where('division', '==', division),
    where('status', '==', 'active')
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ─── Live activity feed for a division (today's lab window) ──────────────────

export function subscribeToLiveFeed(division, onUpdate) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // last 1 hour
  const q = query(
    collection(db, 'sessions'),
    where('division', '==', division),
    where('startTime', '>=', cutoff.toISOString()),
    orderBy('startTime', 'desc'),
    limit(50)
  );
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => d.data());
    onUpdate(items);
  });
}

// ─── Render session log panel ─────────────────────────────────────────────────

export function renderSessionLog(sessions, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!sessions.length) {
    el.innerHTML = '<p class="teacher-empty">No lab sessions recorded yet.</p>';
    return;
  }
  const rows = sessions.map(s => `
    <div class="teacher-session-row ${s.status === 'active' ? 'session-active' : ''}">
      <div class="session-info">
        <strong>${s.labTitle || 'Lab Session'}</strong>
        <span class="session-date">${s.date}</span>
        ${s.status === 'active' ? '<span class="badge-green">Live</span>' : ''}
      </div>
      <div class="session-meta">
        <span>👥 ${s.attendanceCount || 0} students</span>
        <span>⏱️ ${s.durationMinutes ? s.durationMinutes + ' min' : 'In progress'}</span>
        ${s.algorithmFocused ? `<span>🔍 ${s.algorithmFocused}</span>` : ''}
      </div>
      ${s.status === 'active'
        ? `<button class="btn-sm btn-primary" onclick="window._teacherEndSession('${s.id}')">End Session</button>`
        : ''}
    </div>`).join('');
  el.innerHTML = rows;
}

// ─── Render live feed panel ───────────────────────────────────────────────────

export function renderLiveFeed(sessions, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!sessions.length) {
    el.innerHTML = '<p class="teacher-empty">No activity in the last hour.</p>';
    return;
  }
  el.innerHTML = sessions.map(s => `
    <div class="live-feed-item">
      <span class="online-dot dot-green"></span>
      <strong>${s.name || s.uid}</strong> joined
      <span class="teacher-ts">${s.startTime ? new Date(s.startTime).toLocaleTimeString() : ''}</span>
    </div>`).join('');
}

// ─── Render spotlight panel ───────────────────────────────────────────────────

export function renderSpotlightPanel(currentAlgo, division, allAlgos, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const options = allAlgos.map(a =>
    `<option value="${a}" ${a === currentAlgo ? 'selected' : ''}>${a}</option>`
  ).join('');
  el.innerHTML = `
    <div class="teacher-spotlight-box">
      <p>Send a gentle nudge to all <strong>${division}</strong> students to open a specific algorithm.</p>
      <select id="spotlight-algo-select" class="teacher-select">${options}</select>
      <button class="btn-primary" onclick="window._teacherSendSpotlight()">
        📢 Send Spotlight Nudge
      </button>
      <p class="teacher-hint">Students will receive a notification — it won't force navigate them.</p>
    </div>`;
}
