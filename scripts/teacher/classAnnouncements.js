// scripts/teacher/classAnnouncements.js
// Targeted announcements, direct student notifications, lab-hour countdown

import { db } from '../firebase/firebase.js';
import {
  collection, doc, setDoc, updateDoc, getDoc,
  serverTimestamp, query, where, getDocs, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from '../ui/toast.js';

// ─── Class-targeted announcement ─────────────────────────────────────────────
// Extends the existing announcements collection with a targetClass field.
// targetClass = 'GX' | 'GY' | 'GZ' | null (null = global, shown to everyone)

export async function sendClassAnnouncement(teacherUid, title, body, targetClass, type = 'info') {
  const ref = doc(collection(db, 'announcements'));
  await setDoc(ref, {
    id: ref.id,
    title,
    body,
    type,
    targetClass: targetClass || null,
    active: true,
    sentBy: teacherUid,
    role: 'teacher',
    timestamp: serverTimestamp()
  });
}

export async function deactivateAnnouncement(announcementId) {
  await updateDoc(doc(db, 'announcements', announcementId), { active: false });
}

export async function getTeacherAnnouncements(teacherUid) {
  const q = query(
    collection(db, 'announcements'),
    where('sentBy', '==', teacherUid),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── Direct notification to a single student ─────────────────────────────────
// Uses the existing notifications subcollection pattern

export async function sendDirectNotification(teacherUid, studentUid, title, body) {
  const ref = doc(collection(db, 'users', studentUid, 'notifications'));
  await setDoc(ref, {
    id: ref.id,
    title,
    body,
    type: 'teacher',
    sentBy: teacherUid,
    read: false,
    timestamp: serverTimestamp()
  });
}

// ─── Spotlight: nudge a whole class to open an algorithm ─────────────────────
// Sends a notification to every student in the division.

export async function sendSpotlightNudge(teacherUid, division, algoName) {
  // Get all students in this division
  const q = query(collection(db, 'users'), where('division', '==', division));
  const snap = await getDocs(q);
  const writes = snap.docs.map(studentDoc => {
    const nRef = doc(collection(db, 'users', studentDoc.id, 'notifications'));
    return setDoc(nRef, {
      id: nRef.id,
      title: '🎓 Teacher Focus',
      body: `Your teacher wants the class to open: ${algoName}`,
      type: 'spotlight',
      algo: algoName,
      sentBy: teacherUid,
      read: false,
      timestamp: serverTimestamp()
    });
  });
  await Promise.all(writes);
  return snap.size;
}

// ─── Lab-hour countdown banner ────────────────────────────────────────────────
// Saves a countdown record in Firestore so students in that class see the banner

export async function startLabCountdown(teacherUid, division, durationMinutes, labTitle) {
  const endTime = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const ref = doc(db, 'teacherCountdowns', `${division}_active`);
  await setDoc(ref, {
    teacherUid, division,
    labTitle: labTitle || `Lab Session — ${division}`,
    durationMinutes,
    startedAt: serverTimestamp(),
    endTime,
    active: true
  });
  return endTime;
}

export async function stopLabCountdown(division) {
  const ref = doc(db, 'teacherCountdowns', `${division}_active`);
  await updateDoc(ref, { active: false });
}

export async function getActiveCountdown(division) {
  const ref = doc(db, 'teacherCountdowns', `${division}_active`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data.active) return null;
  if (new Date(data.endTime) < new Date()) {
    await updateDoc(ref, { active: false });
    return null;
  }
  return data;
}

// ─── Render announcements history panel ──────────────────────────────────────

export function renderAnnouncementsPanel(announcements, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!announcements.length) {
    el.innerHTML = '<p class="teacher-empty">No announcements sent yet.</p>';
    return;
  }
  const items = announcements.map(a => `
    <div class="teacher-ann-card ${a.active ? '' : 'ann-inactive'}">
      <div class="ann-header">
        <strong>${a.title}</strong>
        <span class="ann-target">${a.targetClass ? '📌 ' + a.targetClass : '🌐 All Classes'}</span>
        <span class="ann-time">${a.timestamp?.toDate ? a.timestamp.toDate().toLocaleDateString() : ''}</span>
      </div>
      <p>${a.body}</p>
      ${a.active
        ? `<button class="btn-sm btn-outline" onclick="window._teacherDeactivateAnn('${a.id}')">Deactivate</button>`
        : '<span class="badge-grey">Inactive</span>'}
    </div>`).join('');
  el.innerHTML = items;
}

// ─── Countdown timer UI renderer (call every second from setInterval) ─────────

export function renderCountdownBanner(countdown, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!countdown) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }
  const remaining = Math.max(0, new Date(countdown.endTime) - Date.now());
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  el.style.display = 'block';
  el.innerHTML = `
    <div class="teacher-countdown-inner">
      <span class="countdown-title">⏱️ ${countdown.labTitle}</span>
      <span class="countdown-time ${mins < 5 ? 'countdown-urgent' : ''}">${mins}m ${secs}s remaining</span>
      <button class="btn-sm btn-outline" onclick="window._teacherStopCountdown()">Stop</button>
    </div>`;
}
