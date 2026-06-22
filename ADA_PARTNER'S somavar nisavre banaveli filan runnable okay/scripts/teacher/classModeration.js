// scripts/teacher/classModeration.js
// Mute, bonus XP grant, filtered feedback view — teacher has NO destructive power

import { db } from '../firebase/firebase.js';
import {
  collection, doc, setDoc, updateDoc, getDoc,
  serverTimestamp, query, where, getDocs, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { awardXP } from '../features/xp.js';
import { showToast } from '../ui/toast.js';

// ─── Mute a student (hides from leaderboard, pauses notifications from app) ──
// This is NOT a ban. Fully reversible. Teacher role only.

export async function muteStudent(teacherUid, studentUid, reason) {
  await updateDoc(doc(db, 'users', studentUid), {
    isMuted: true,
    mutedBy: teacherUid,
    mutedReason: reason || '',
    mutedAt: serverTimestamp()
  });
}

export async function unmuteStudent(studentUid) {
  await updateDoc(doc(db, 'users', studentUid), {
    isMuted: false,
    mutedBy: null,
    mutedReason: '',
    mutedAt: null
  });
}

export async function getMutedStudents(division) {
  const q = query(
    collection(db, 'users'),
    where('division', '==', division),
    where('isMuted', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// ─── Bonus XP grant (with reason, logged for transparency) ────────────────────

export async function grantBonusXP(teacherUid, studentUid, studentName, amount, reason) {
  // Log the grant in its own transparent collection
  const logRef = doc(collection(db, 'teacherBonusXp'));
  await setDoc(logRef, {
    id: logRef.id,
    grantedBy: teacherUid,
    studentUid,
    studentName,
    amount,
    reason,
    timestamp: serverTimestamp()
  });

  // Also log on the student's bonusXpLog array
  const userRef = doc(db, 'users', studentUid);
  const userSnap = await getDoc(userRef);
  const log = userSnap.data()?.bonusXpLog || [];
  log.push({ amount, reason, grantedBy: teacherUid, timestamp: new Date().toISOString() });
  await updateDoc(userRef, { bonusXpLog: log });

  // Actually award the XP using existing system
  await awardXP(studentUid, 'bonus', false);
  // Manually add the specific amount (override default awardXP amount)
  const currentXP = userSnap.data()?.xp || 0;
  await updateDoc(userRef, { xp: currentXP + amount });
}

export async function getBonusXpLogForTeacher(teacherUid) {
  const q = query(
    collection(db, 'teacherBonusXp'),
    where('grantedBy', '==', teacherUid),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Feedback/bug reports from lab sessions only ─────────────────────────────

export async function getFeedbackFromLabSession(division, sessionStartIso, sessionEndIso) {
  // Filter feedback submitted during an active lab session by students in this division
  const q = query(
    collection(db, 'feedback'),
    where('division', '==', division),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(f => {
      if (!sessionStartIso || !sessionEndIso) return true;
      const ts = f.timestamp?.toDate ? f.timestamp.toDate().toISOString() : f.timestamp;
      return ts >= sessionStartIso && ts <= sessionEndIso;
    });
}

export async function getBugReportsFromDivision(division) {
  const q = query(
    collection(db, 'bug_reports'),
    where('division', '==', division),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Render moderation panel ──────────────────────────────────────────────────

export function renderModerationPanel(mutedStudents, bonusLog, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const mutedHTML = mutedStudents.length
    ? mutedStudents.map(s => `
        <div class="teacher-muted-row">
          <span>${s.name || s.email}</span>
          <span class="teacher-hint">${s.mutedReason || ''}</span>
          <button class="btn-sm btn-outline" onclick="window._teacherUnmute('${s.uid}')">Unmute</button>
        </div>`).join('')
    : '<p class="teacher-empty">No muted students in this division.</p>';

  const bonusHTML = bonusLog.slice(0, 10).map(b => `
    <div class="teacher-bonus-row">
      <span>${b.studentName}</span>
      <span class="badge-green">+${b.amount} XP</span>
      <span class="teacher-hint">${b.reason}</span>
      <span class="teacher-ts">${b.timestamp?.toDate ? b.timestamp.toDate().toLocaleDateString() : ''}</span>
    </div>`).join('') || '<p class="teacher-empty">No bonus XP granted yet.</p>';

  el.innerHTML = `
    <h4>🔇 Muted Students</h4>
    <div id="teacher-muted-list">${mutedHTML}</div>
    <hr class="teacher-divider">
    <h4>⭐ Bonus XP Log (last 10)</h4>
    <div id="teacher-bonus-log">${bonusHTML}</div>`;
}

export function renderFeedbackFromLab(feedbackItems, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!feedbackItems.length) {
    el.innerHTML = '<p class="teacher-empty">No feedback from this period.</p>';
    return;
  }
  el.innerHTML = feedbackItems.map(f => `
    <div class="teacher-feedback-card">
      <div class="feedback-header">
        <strong>${f.name || f.uid}</strong>
        <span class="teacher-ts">${f.timestamp?.toDate ? f.timestamp.toDate().toLocaleDateString() : ''}</span>
        <span>Rating: ${'⭐'.repeat(f.rating || 0)}</span>
      </div>
      <p>${f.comment || ''}</p>
      <span class="badge-grey">${f.category || 'General'}</span>
    </div>`).join('');
}
