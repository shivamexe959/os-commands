import { UserService } from '../firebase/database.js';
import { NotificationService } from '../firebase/firestore.js';

export const LEVELS = [
  { level:1,  name:'Beginner',     minXP:0,     icon:'🌱' },
  { level:2,  name:'Learner',      minXP:100,   icon:'📚' },
  { level:3,  name:'Explorer',     minXP:300,   icon:'🔍' },
  { level:4,  name:'Practitioner', minXP:600,   icon:'⚙️'  },
  { level:5,  name:'Analyst',      minXP:1000,  icon:'📊' },
  { level:6,  name:'Developer',    minXP:1500,  icon:'💻' },
  { level:7,  name:'Engineer',     minXP:2200,  icon:'🔧' },
  { level:8,  name:'Expert',       minXP:3000,  icon:'🏅' },
  { level:9,  name:'Master',       minXP:4200,  icon:'🎓' },
  { level:10, name:'Grandmaster',  minXP:6000,  icon:'👑' }
];

export const XP_REWARDS = {
  algoView:        5,
  algoComplete:    20,
  visualStart:     10,
  visualComplete:  25,
  pdfExport:       15,
  quizAttempt:     10,
  quizCorrect:     20,
  searchQuery:     2,
  loginStreak:     50,
  profileComplete: 100,
  bugReport:       30,
  feedback:        25,
  featureRequest:  25,
  bookmarkAlgo:    5,
  shareAlgo:       10,
  noteCreated:     15,
  firstLogin:      100,
  referral:        200,
  donation:        500
};

export function getLevel(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.minXP) current = l; }
  return current;
}

export function getProgress(xp) {
  const lvl = getLevel(xp);
  const idx = LEVELS.indexOf(lvl);
  if (idx === LEVELS.length - 1) return 100;
  const next = LEVELS[idx + 1];
  return Math.round(((xp - lvl.minXP) / (next.minXP - lvl.minXP)) * 100);
}

export async function awardXP(uid, action, notify = true) {
  const amount = XP_REWARDS[action] || 0;
  if (!amount) return 0;
  await UserService.addXP(uid, amount, action.replace(/([A-Z])/g, ' $1').trim());
  if (notify) {
    _showXPToast(amount, action);
  }
  return amount;
}

export function renderXPBar(userData) {
  const { xp = 0 } = userData;
  const level = getLevel(xp);
  const progress = getProgress(xp);
  const bar = document.getElementById('dash-xp-bar'); // BUG FIX: was 'xp-bar'
  const label = document.getElementById('xp-label');
  const lvlEl = document.getElementById('user-level');
  if (bar) bar.style.width = progress + '%';
  if (label) label.textContent = `${xp} XP`;
  if (lvlEl) lvlEl.textContent = `${level.icon} ${level.name}`;
}

function _showXPToast(amount, action) {
  const t = document.createElement('div');
  t.className = 'xp-toast';
  t.innerHTML = `<span>+${amount} XP</span><small>${action.replace(/([A-Z])/g,' $1').trim()}</small>`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2500);
}
