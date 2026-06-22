// scripts/teacher/classReports.js
// CSV export, semester summary, syllabus coverage mapper,
// difficulty heatmap, end-of-semester auto-summary

import { db } from '../firebase/firebase.js';
import {
  collection, query, where, getDocs, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStudentsByDivision } from './teacherRole.js';
import { DIVISIONS } from './teacherRole.js';

// ─── GTU 3150703 Syllabus mapping ─────────────────────────────────────────────
// Maps official syllabus units to algorithm names used in the app

export const GTU_SYLLABUS = [
  {
    unit: 1,
    title: 'Introduction to Algorithm Design and Analysis',
    algorithms: [
      'Binary Search', 'Linear Search', 'Insertion Sort'
    ]
  },
  {
    unit: 2,
    title: 'Divide and Conquer',
    algorithms: [
      'Merge Sort', 'Quick Sort', 'Binary Search', 'Strassen Matrix Multiplication'
    ]
  },
  {
    unit: 3,
    title: 'Greedy Algorithms',
    algorithms: [
      "Kruskal's Algorithm", "Prim's Algorithm", 'Huffman Coding',
      'Activity Selection', "Dijkstra's Algorithm", 'Fractional Knapsack'
    ]
  },
  {
    unit: 4,
    title: 'Dynamic Programming',
    algorithms: [
      'Knapsack 0/1', 'Matrix Chain Multiplication', 'Longest Common Subsequence',
      'Floyd-Warshall', "Bellman-Ford", 'Optimal BST', 'Coin Change'
    ]
  },
  {
    unit: 5,
    title: 'Backtracking',
    algorithms: [
      'N-Queens Problem', 'Subset Sum', 'Graph Coloring', 'Hamiltonian Cycle', 'Rat in Maze'
    ]
  },
  {
    unit: 6,
    title: 'Branch and Bound',
    algorithms: [
      'Travelling Salesman Problem', '0/1 Knapsack Branch & Bound'
    ]
  },
  {
    unit: 7,
    title: 'String Matching',
    algorithms: [
      'Naive String Matching', 'KMP Algorithm', 'Rabin-Karp', 'Boyer-Moore'
    ]
  },
  {
    unit: 8,
    title: 'NP-Completeness',
    algorithms: [
      'Graph Coloring', 'Hamiltonian Cycle', 'Travelling Salesman Problem'
    ]
  }
];

// ─── CSV export for a single division ────────────────────────────────────────

export async function exportClassCSV(division) {
  const students = await getStudentsByDivision(division);

  // Fetch quiz results per student
  const quizQ = query(collection(db, 'quizResults'), where('division', '==', division));
  const quizSnap = await getDocs(quizQ);
  const quizByUid = {};
  quizSnap.docs.forEach(d => {
    const r = d.data();
    if (!quizByUid[r.uid]) quizByUid[r.uid] = [];
    quizByUid[r.uid].push(r.percentage || 0);
  });

  const headers = [
    'Name', 'Email', 'Division', 'XP', 'Level', 'Streak',
    'Algos Completed', 'PDF Downloads', 'Sessions', 'Quiz Avg %',
    'Bookmarks', 'Join Date', 'Last Active'
  ];

  const getLevel = xp => xp >= 6000 ? 'Grandmaster' : xp >= 4200 ? 'Master' :
    xp >= 3000 ? 'Expert' : xp >= 2200 ? 'Engineer' : xp >= 1500 ? 'Developer' :
    xp >= 1000 ? 'Analyst' : xp >= 600 ? 'Practitioner' : xp >= 300 ? 'Explorer' :
    xp >= 100 ? 'Learner' : 'Beginner';

  const rows = students.map(s => {
    const quizScores = quizByUid[s.uid] || [];
    const quizAvg = quizScores.length
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;
    return [
      s.name || '', s.email || '', s.division || division,
      s.xp || 0, getLevel(s.xp || 0),
      s.currentStreak || 0, s.totalAlgorithmsUsed || 0,
      s.pdfDownloads || 0, s.totalSessions || 0, quizAvg,
      (s.bookmarks || []).length,
      s.joinDate ? new Date(s.joinDate).toLocaleDateString() : '',
      s.lastActive ? new Date(s.lastActive).toLocaleDateString() : ''
    ].map(v => `"${v}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  downloadCSV(csv, `ADA_Lab_${division}_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Semester summary (compare all 3 divisions) ──────────────────────────────

export async function getSemesterSummary() {
  const summary = {};
  for (const div of DIVISIONS) {
    const students = await getStudentsByDivision(div);
    const quizQ = query(collection(db, 'quizResults'), where('division', '==', div));
    const quizSnap = await getDocs(quizQ);
    const quizScores = quizSnap.docs.map(d => d.data().percentage || 0);

    const totalXP = students.reduce((s, u) => s + (u.xp || 0), 0);
    const avgXP = students.length ? Math.round(totalXP / students.length) : 0;
    const avgAlgos = students.length
      ? Math.round(students.reduce((s, u) => s + (u.totalAlgorithmsUsed || 0), 0) / students.length)
      : 0;
    const quizAvg = quizScores.length
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;

    summary[div] = {
      division: div,
      studentCount: students.length,
      avgXP,
      avgAlgos,
      quizAvg,
      quizAttempts: quizScores.length
    };
  }
  return summary;
}

// ─── Syllabus coverage mapper ─────────────────────────────────────────────────
// Shows what % of the official GTU syllabus is covered by algorithms in the app

export function computeSyllabusCoverage(attemptedAlgoNames) {
  const attempted = new Set(attemptedAlgoNames);
  return GTU_SYLLABUS.map(unit => {
    const covered = unit.algorithms.filter(a => attempted.has(a)).length;
    const pct = unit.algorithms.length
      ? Math.round((covered / unit.algorithms.length) * 100)
      : 0;
    return { ...unit, covered, total: unit.algorithms.length, pct };
  });
}

export async function getClassSyllabusCoverage(division) {
  const students = await getStudentsByDivision(division);
  const allAttempted = new Set();
  students.forEach(s => (s.recentlyViewed || []).forEach(a => allAttempted.add(a)));
  return computeSyllabusCoverage([...allAttempted]);
}

// ─── Difficulty heatmap per class ────────────────────────────────────────────
// Which algorithms the whole class struggles with most (based on quiz wrong answers)

export async function getDifficultyHeatmap(division) {
  const quizQ = query(collection(db, 'quizResults'), where('division', '==', division));
  const snap = await getDocs(quizQ);
  const algoWrong = {};
  snap.docs.forEach(d => {
    const r = d.data();
    (r.answers || []).forEach(ans => {
      const algo = ans.algo || 'General';
      if (!algoWrong[algo]) algoWrong[algo] = { wrong: 0, total: 0 };
      algoWrong[algo].total++;
      if (!ans.correct) algoWrong[algo].wrong++;
    });
  });
  return Object.entries(algoWrong)
    .map(([algo, stats]) => ({
      algo,
      wrongRate: stats.total ? Math.round((stats.wrong / stats.total) * 100) : 0,
      ...stats
    }))
    .sort((a, b) => b.wrongRate - a.wrongRate);
}

// ─── End-of-semester auto-summary export ─────────────────────────────────────

export async function generateEndOfSemesterSummary() {
  const summary = await getSemesterSummary();
  const lines = [
    `ADA Algorithm Lab — End of Semester Report`,
    `Generated: ${new Date().toLocaleString()}`,
    `VVP Engineering College, CSE Department`,
    `Subject: Design and Analysis of Algorithms (3150703)`,
    ``,
    `DIVISION COMPARISON`,
    `${'='.repeat(60)}`,
  ];

  for (const div of DIVISIONS) {
    const s = summary[div];
    lines.push(
      ``,
      `Division: ${div}`,
      `  Students: ${s.studentCount}`,
      `  Average XP: ${s.avgXP}`,
      `  Avg Algorithms Explored: ${s.avgAlgos}`,
      `  Quiz Average: ${s.quizAvg}%  (${s.quizAttempts} attempts)`,
    );
  }

  lines.push(``, `--- End of Report ---`);
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ADA_Semester_Summary_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Render semester comparison chart ─────────────────────────────────────────

export function renderSemesterComparisonChart(summary, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const maxXP = Math.max(...DIVISIONS.map(d => summary[d]?.avgXP || 1), 1);
  const maxAlgos = Math.max(...DIVISIONS.map(d => summary[d]?.avgAlgos || 1), 1);
  const maxQuiz = 100;

  const metrics = [
    { label: 'Avg XP', key: 'avgXP', max: maxXP, color: '#6c63ff' },
    { label: 'Avg Algos', key: 'avgAlgos', max: maxAlgos, color: '#43c6a8' },
    { label: 'Quiz Avg %', key: 'quizAvg', max: maxQuiz, color: '#f4a261' }
  ];

  const rows = metrics.map(m => {
    const bars = DIVISIONS.map(div => {
      const val = summary[div]?.[m.key] || 0;
      const pct = Math.round((val / m.max) * 100);
      return `
        <div class="chart-bar-group">
          <span class="chart-div-label">${div}</span>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width:${pct}%;background:${m.color}">
              <span class="chart-bar-val">${val}</span>
            </div>
          </div>
        </div>`;
    }).join('');
    return `
      <div class="chart-metric-group">
        <strong class="chart-metric-label">${m.label}</strong>
        ${bars}
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="teacher-comparison-chart">
      <h4>GX vs GY vs GZ — Semester Comparison</h4>
      ${rows}
      <div class="chart-student-counts">
        ${DIVISIONS.map(div => `
          <span class="chart-count-pill">
            ${div}: ${summary[div]?.studentCount || 0} students
          </span>`).join('')}
      </div>
    </div>`;
}

// ─── Render syllabus coverage grid ───────────────────────────────────────────

export function renderSyllabusGrid(coverage, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const totalAlgos = coverage.reduce((s, u) => s + u.total, 0);
  const totalCovered = coverage.reduce((s, u) => s + u.covered, 0);
  const overallPct = totalAlgos ? Math.round((totalCovered / totalAlgos) * 100) : 0;

  const units = coverage.map(u => {
    const algos = u.algorithms.map(a => {
      const covered = (u.algorithms.filter(x => x === a).length > 0) ? true : false;
      return `<span class="syllabus-algo ${u.covered > 0 ? 'algo-covered' : 'algo-missing'}">${a}</span>`;
    }).join('');
    return `
      <div class="syllabus-unit">
        <div class="syllabus-unit-header">
          <strong>Unit ${u.unit}: ${u.title}</strong>
          <span class="syllabus-pct ${u.pct === 100 ? 'pct-full' : u.pct >= 50 ? 'pct-mid' : 'pct-low'}">${u.pct}%</span>
        </div>
        <div class="syllabus-bar">
          <div class="syllabus-bar-fill" style="width:${u.pct}%"></div>
        </div>
        <div class="syllabus-algos">${algos}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="syllabus-overall">
      <strong>Overall GTU 3150703 Coverage: ${overallPct}%</strong>
      (${totalCovered} of ${totalAlgos} algorithm topics)
    </div>
    ${units}`;
}

// ─── Render difficulty heatmap ────────────────────────────────────────────────

export function renderDifficultyHeatmap(heatmap, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!heatmap.length) {
    el.innerHTML = '<p class="teacher-empty">Not enough quiz data yet.</p>';
    return;
  }
  el.innerHTML = `
    <p class="teacher-hint">Based on quiz answer data — red = class struggles most here</p>
    ${heatmap.slice(0, 15).map(h => `
      <div class="heatmap-row">
        <span class="heatmap-algo">${h.algo}</span>
        <div class="heatmap-bar-track">
          <div class="heatmap-bar-fill" style="width:${h.wrongRate}%;background:${
            h.wrongRate >= 70 ? '#e74c3c' : h.wrongRate >= 40 ? '#f39c12' : '#2ecc71'
          }"></div>
        </div>
        <span class="heatmap-val">${h.wrongRate}% wrong</span>
      </div>`).join('')}`;
}
