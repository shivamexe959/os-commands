// scripts/teacher/classRoster.js
// Live roster: who's online, attendance, seating groups, per-student detail view

import { db } from '../firebase/firebase.js';
import {
  collection, query, where, getDocs, doc,
  setDoc, updateDoc, deleteDoc, onSnapshot,
  serverTimestamp, getDoc, orderBy, limit
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStudentsByDivision } from './teacherRole.js';
import { showToast } from '../ui/toast.js';

// ─── Who's online right now (based on sessions active in last 15 min) ─────────

export async function getOnlineStudents(division) {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const q = query(
    collection(db, 'sessions'),
    where('division', '==', division),
    where('startTime', '>=', cutoff)
  );
  const snap = await getDocs(q);
  const seen = new Set();
  const online = [];
  snap.docs.forEach(d => {
    const s = d.data();
    if (!seen.has(s.uid)) { seen.add(s.uid); online.push(s); }
  });
  return online;
}

// ─── Full class roster with XP + last active ──────────────────────────────────

export async function getClassRoster(division) {
  return await getStudentsByDivision(division);
}

// ─── Per-student detail ───────────────────────────────────────────────────────

export async function getStudentDetail(uid) {
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return null;
  const user = userSnap.data();

  const activitySnap = await getDocs(
    query(collection(db, 'users', uid, 'activity'), orderBy('timestamp', 'desc'), limit(20))
  );
  const activity = activitySnap.docs.map(d => d.data());

  return { ...user, uid, activity };
}

// ─── Attendance snapshot (who attended today's lab session) ───────────────────

export async function getTodayAttendance(division, labSessionId) {
  const q = query(
    collection(db, 'teacherLabSessions', labSessionId, 'attendees')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// ─── Seating / Group management ───────────────────────────────────────────────

export async function createGroup(teacherUid, division, groupName) {
  const ref = doc(collection(db, 'teacherGroups'));
  await setDoc(ref, {
    id: ref.id,
    teacherUid,
    division,
    name: groupName,
    members: [],
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function getGroupsByDivision(teacherUid, division) {
  const q = query(
    collection(db, 'teacherGroups'),
    where('teacherUid', '==', teacherUid),
    where('division', '==', division)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function assignStudentToGroup(groupId, uid, studentName) {
  const ref = doc(db, 'teacherGroups', groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const members = snap.data().members || [];
  if (!members.find(m => m.uid === uid)) {
    members.push({ uid, name: studentName });
    await updateDoc(ref, { members });
  }
}

export async function removeStudentFromGroup(groupId, uid) {
  const ref = doc(db, 'teacherGroups', groupId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const members = (snap.data().members || []).filter(m => m.uid !== uid);
  await updateDoc(ref, { members });
}

export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, 'teacherGroups', groupId));
}

// ─── Render roster table ──────────────────────────────────────────────────────

export function renderRosterTable(students, onlineUids, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!students.length) {
    el.innerHTML = '<p class="teacher-empty">No students found in this division.</p>';
    return;
  }

  const rows = students.map(s => {
    const online = onlineUids.has(s.uid);
    const level = s.xp >= 6000 ? 'Grandmaster' : s.xp >= 4200 ? 'Master' :
      s.xp >= 3000 ? 'Expert' : s.xp >= 2200 ? 'Engineer' :
      s.xp >= 1500 ? 'Developer' : s.xp >= 1000 ? 'Analyst' :
      s.xp >= 600 ? 'Practitioner' : s.xp >= 300 ? 'Explorer' :
      s.xp >= 100 ? 'Learner' : 'Beginner';
    return `
      <tr class="${online ? 'roster-online' : ''}">
        <td><span class="online-dot ${online ? 'dot-green' : 'dot-grey'}"></span> ${s.name || 'Unknown'}</td>
        <td>${s.email || ''}</td>
        <td>${s.xp || 0}</td>
        <td>${level}</td>
        <td>${s.totalAlgorithmsUsed || 0}</td>
        <td>${s.currentStreak || 0}🔥</td>
        <td>
          <button class="btn-sm btn-outline" onclick="window._teacherViewStudent('${s.uid}')">View</button>
        </td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <table class="teacher-table">
      <thead>
        <tr>
          <th>Name</th><th>Email</th><th>XP</th><th>Level</th>
          <th>Algos Done</th><th>Streak</th><th>Action</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Student detail modal content ─────────────────────────────────────────────

export function renderStudentDetailPanel(student) {
  const el = document.getElementById('teacher-student-detail');
  if (!el) return;
  const recentAlgos = (student.recentlyViewed || []).slice(0, 10).join(', ') || 'None';
  const bookmarks = (student.bookmarks || []).slice(0, 10).join(', ') || 'None';

  el.innerHTML = `
    <div class="teacher-student-card">
      <img src="${student.photoURL || 'assets/default-avatar.png'}" class="teacher-avatar" alt="avatar">
      <h3>${student.name || 'Unknown'}</h3>
      <p>${student.email}</p>
      <p>Division: <strong>${student.division || 'Unset'}</strong></p>
      <p>Role: ${student.role}</p>
    </div>
    <div class="teacher-stat-row">
      <div class="teacher-stat-box"><span>${student.xp || 0}</span><label>XP</label></div>
      <div class="teacher-stat-box"><span>${student.coins || 0}</span><label>Coins</label></div>
      <div class="teacher-stat-box"><span>${student.currentStreak || 0}</span><label>Streak</label></div>
      <div class="teacher-stat-box"><span>${student.totalAlgorithmsUsed || 0}</span><label>Algos</label></div>
      <div class="teacher-stat-box"><span>${student.pdfDownloads || 0}</span><label>PDFs</label></div>
      <div class="teacher-stat-box"><span>${student.totalSessions || 0}</span><label>Sessions</label></div>
    </div>
    <p><strong>Recent algorithms:</strong> ${recentAlgos}</p>
    <p><strong>Bookmarks:</strong> ${bookmarks}</p>
    <p><strong>Joined:</strong> ${student.joinDate ? new Date(student.joinDate).toLocaleDateString() : 'Unknown'}</p>
    <p><strong>Last Active:</strong> ${student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Unknown'}</p>
    <h4>Recent Activity</h4>
    <ul class="teacher-activity-list">
      ${(student.activity || []).map(a =>
        `<li>${a.type || 'action'} — ${a.algo || ''} <span class="teacher-ts">${a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</span></li>`
      ).join('') || '<li>No recent activity.</li>'}
    </ul>`;
}

// ─── "Algorithms not yet attempted" report ────────────────────────────────────

export async function getNotAttemptedReport(division, allAlgorithmNames) {
  const students = await getStudentsByDivision(division);
  return students.map(s => {
    const attempted = new Set(s.recentlyViewed || []);
    const missing = allAlgorithmNames.filter(a => !attempted.has(a));
    return { uid: s.uid, name: s.name, email: s.email, missing, attempted: attempted.size };
  });
}
