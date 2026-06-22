import { db } from '../firebase/firebase.js';
import { doc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { awardXP } from './xp.js';

export const QUIZ_QUESTIONS = [
  { q: 'What is the time complexity of Bubble Sort?', options: ['O(n)', 'O(n²)', 'O(n log n)', 'O(log n)'], answer: 1 },
  { q: 'Which algorithm uses divide and conquer?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], answer: 2 },
  { q: 'Best case complexity of Binary Search?', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], answer: 0 },
  { q: 'Which data structure does DFS use?', options: ['Queue', 'Stack', 'Heap', 'Array'], answer: 1 },
  { q: "Dijkstra's algorithm finds?", options: ['MST', 'Shortest path', 'Longest path', 'Topological sort'], answer: 1 },
  { q: 'N-Queens is solved using?', options: ['Greedy', 'DP', 'Backtracking', 'Divide and Conquer'], answer: 2 },
  { q: 'Knapsack problem optimal solution uses?', options: ['Greedy', 'Brute Force', 'Dynamic Programming', 'Binary Search'], answer: 2 },
  { q: 'Time complexity of Heap Sort?', options: ['O(n)', 'O(n²)', 'O(n log n)', 'O(log n)'], answer: 2 },
  { q: 'Quick Sort worst case?', options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(1)'], answer: 1 },
  { q: 'LCS stands for?', options: ['Longest Common Substring', 'Largest Common Sequence', 'Longest Common Subsequence', 'Linear Common Sort'], answer: 2 }
];

let _uid = null;
let _currentQ = 0;
let _score = 0;
let _shuffled = [];

export function initQuiz(uid) {
  _uid = uid;
  _shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
}

export function startQuiz() {
  _currentQ = 0; _score = 0;
  renderQuestion();
  document.getElementById('quiz-container')?.classList.remove('hidden');
  document.getElementById('quiz-result')?.classList.add('hidden');
}

export function renderQuestion() {
  const container = document.getElementById('quiz-question');
  if (!container || _currentQ >= _shuffled.length) { endQuiz(); return; }
  const q = _shuffled[_currentQ];
  container.innerHTML = `
    <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:8px">Question ${_currentQ+1} of ${_shuffled.length}</div>
    <div style="font-size:1rem;font-weight:600;margin-bottom:16px">${_esc(q.q)}</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${q.options.map((opt, i) => `<button class="quiz-opt" onclick="window._quizAnswer(${i})">${_esc(opt)}</button>`).join('')}
    </div>`;
}

window._quizAnswer = async function(idx) {
  const q = _shuffled[_currentQ];
  if (idx === q.answer) { _score++; if (_uid) await awardXP(_uid, 'quizCorrect', false); }
  else if (_uid) await awardXP(_uid, 'quizAttempt', false);
  _currentQ++;
  if (_currentQ < _shuffled.length) renderQuestion();
  else endQuiz();
};

async function endQuiz() {
  const accuracy = Math.round((_score / _shuffled.length) * 100);
  if (_uid) {
    await updateDoc(doc(db, 'users', _uid), {
      quizHistory: arrayUnion({ score: _score, total: _shuffled.length, accuracy, date: new Date().toISOString() })
    });
    if (accuracy === 100) await awardXP(_uid, 'quizCorrect', true);
  }
  const res = document.getElementById('quiz-result');
  if (res) {
    res.innerHTML = `<div style="text-align:center"><div style="font-size:3rem">${accuracy===100?'💯':accuracy>=70?'🎉':'📚'}</div>
      <div style="font-size:1.5rem;font-weight:700;margin:8px 0">${_score}/${_shuffled.length}</div>
      <div style="color:var(--text-muted)">${accuracy}% accuracy</div>
      <button class="btn-primary" style="margin-top:16px" onclick="startQuiz()">Try Again</button></div>`;
    res.classList.remove('hidden');
  }
  document.getElementById('quiz-container')?.classList.add('hidden');
}

function _esc(s) { return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
