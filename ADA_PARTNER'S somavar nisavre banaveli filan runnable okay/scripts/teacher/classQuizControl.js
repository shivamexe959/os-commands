// scripts/teacher/classQuizControl.js
// Quiz set management, quiz results dashboard, custom questions, practical marking

import { db } from '../firebase/firebase.js';
import {
  collection, query, where, getDocs, doc,
  setDoc, updateDoc, deleteDoc, getDoc,
  serverTimestamp, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from '../ui/toast.js';

// ─── Quiz Sets ────────────────────────────────────────────────────────────────

export async function createQuizSet(teacherUid, name, questions = []) {
  const ref = doc(collection(db, 'teacherQuizSets'));
  await setDoc(ref, {
    id: ref.id,
    teacherUid,
    name,
    questions,
    activeFor: [],
    activatedAt: null,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function getQuizSetsByTeacher(teacherUid) {
  const q = query(
    collection(db, 'teacherQuizSets'),
    where('teacherUid', '==', teacherUid)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function activateQuizForDivision(quizSetId, division) {
  // Deactivate any other quiz active for this division first
  const q = query(
    collection(db, 'teacherQuizSets'),
    where('activeFor', 'array-contains', division)
  );
  const existing = await getDocs(q);
  for (const d of existing.docs) {
    const active = (d.data().activeFor || []).filter(x => x !== division);
    await updateDoc(d.ref, { activeFor: active });
  }
  // Activate this one
  const ref = doc(db, 'teacherQuizSets', quizSetId);
  const snap = await getDoc(ref);
  const activeFor = snap.data().activeFor || [];
  if (!activeFor.includes(division)) activeFor.push(division);
  await updateDoc(ref, { activeFor, activatedAt: serverTimestamp() });
}

export async function deactivateQuizForDivision(quizSetId, division) {
  const ref = doc(db, 'teacherQuizSets', quizSetId);
  const snap = await getDoc(ref);
  const activeFor = (snap.data().activeFor || []).filter(x => x !== division);
  await updateDoc(ref, { activeFor });
}

export async function deleteQuizSet(quizSetId) {
  await deleteDoc(doc(db, 'teacherQuizSets', quizSetId));
}

// ─── Custom quiz question add ─────────────────────────────────────────────────

export async function addCustomQuestion(quizSetId, question) {
  // question: { question, options: [4], answer: 0-3, difficulty: 'easy|medium|hard' }
  const ref = doc(db, 'teacherQuizSets', quizSetId);
  const snap = await getDoc(ref);
  const questions = snap.data().questions || [];
  questions.push({ ...question, id: `q_${Date.now()}`, custom: true });
  await updateDoc(ref, { questions });
}

export async function removeQuestion(quizSetId, questionId) {
  const ref = doc(db, 'teacherQuizSets', quizSetId);
  const snap = await getDoc(ref);
  const questions = (snap.data().questions || []).filter(q => q.id !== questionId);
  await updateDoc(ref, { questions });
}

// ─── Quiz Results ─────────────────────────────────────────────────────────────

/**
 * Fetch quiz attempt results for a division.
 * Results stored at: quizResults/{uid_timestamp} with field division.
 */
export async function getQuizResultsByDivision(division) {
  const q = query(
    collection(db, 'quizResults'),
    where('division', '==', division),
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveQuizResult(uid, division, name, score, total, answers) {
  const ref = doc(collection(db, 'quizResults'));
  await setDoc(ref, {
    uid, division, name, score, total,
    percentage: Math.round((score / total) * 100),
    answers: answers || [],
    timestamp: serverTimestamp()
  });
}

// ─── Quiz results analysis ────────────────────────────────────────────────────

export function analyzeQuizResults(results) {
  if (!results.length) return { avg: 0, highest: 0, lowest: 0, hardestQ: null, questionStats: {} };
  const scores = results.map(r => r.percentage || 0);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);

  // Per-question wrong count
  const questionStats = {};
  results.forEach(r => {
    (r.answers || []).forEach((ans, i) => {
      if (!questionStats[i]) questionStats[i] = { wrong: 0, total: 0 };
      questionStats[i].total++;
      if (!ans.correct) questionStats[i].wrong++;
    });
  });
  const hardestQ = Object.entries(questionStats)
    .sort((a, b) => (b[1].wrong / b[1].total) - (a[1].wrong / a[1].total))[0]?.[0];

  return { avg, highest, lowest, hardestQ, questionStats };
}

// ─── Practical exercise marking ───────────────────────────────────────────────

export async function markAlgoAsPractical(teacherUid, division, algoName, labDate) {
  const ref = doc(db, 'teacherPracticals', `${teacherUid}_${division}_${algoName.replace(/\s/g, '_')}`);
  await setDoc(ref, {
    teacherUid, division, algoName,
    labDate: labDate || new Date().toISOString().split('T')[0],
    markedAt: serverTimestamp()
  }, { merge: true });
}

export async function getPracticalsForDivision(division) {
  const q = query(
    collection(db, 'teacherPracticals'),
    where('division', '==', division)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data());
}

// ─── Render quiz results panel ────────────────────────────────────────────────

export function renderQuizResultsPanel(results, analysis, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!results.length) {
    el.innerHTML = '<p class="teacher-empty">No quiz attempts found for this division yet.</p>';
    return;
  }

  const rows = results.slice(0, 30).map(r => `
    <tr>
      <td>${r.name || r.uid}</td>
      <td>${r.score}/${r.total}</td>
      <td class="${r.percentage >= 70 ? 'score-good' : r.percentage >= 40 ? 'score-mid' : 'score-low'}">${r.percentage}%</td>
      <td>${r.timestamp?.toDate ? r.timestamp.toDate().toLocaleDateString() : ''}</td>
    </tr>`).join('');

  el.innerHTML = `
    <div class="teacher-stat-row">
      <div class="teacher-stat-box"><span>${analysis.avg}%</span><label>Avg Score</label></div>
      <div class="teacher-stat-box"><span>${analysis.highest}%</span><label>Highest</label></div>
      <div class="teacher-stat-box"><span>${analysis.lowest}%</span><label>Lowest</label></div>
      <div class="teacher-stat-box"><span>${results.length}</span><label>Attempts</label></div>
    </div>
    ${analysis.hardestQ !== null ? `<p class="teacher-hint">🔴 Hardest question: Q${parseInt(analysis.hardestQ)+1} (most students got it wrong)</p>` : ''}
    <table class="teacher-table">
      <thead><tr><th>Student</th><th>Score</th><th>%</th><th>Date</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Render quiz sets panel ───────────────────────────────────────────────────

export function renderQuizSetsPanel(sets, activeDivision, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const cards = sets.map(s => {
    const isActive = s.activeFor?.includes(activeDivision);
    return `
      <div class="teacher-quiz-card ${isActive ? 'quiz-active' : ''}">
        <strong>${s.name}</strong>
        <span>${s.questions?.length || 0} questions</span>
        ${isActive ? `<span class="badge-green">Active for ${activeDivision}</span>` : ''}
        <div class="teacher-quiz-actions">
          ${isActive
            ? `<button class="btn-sm btn-outline" onclick="window._teacherDeactivateQuiz('${s.id}')">Deactivate</button>`
            : `<button class="btn-sm btn-primary" onclick="window._teacherActivateQuiz('${s.id}')">Activate for ${activeDivision}</button>`
          }
          <button class="btn-sm btn-outline" onclick="window._teacherDeleteQuizSet('${s.id}')">Delete</button>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = cards || '<p class="teacher-empty">No quiz sets yet. Create one below.</p>';
}
