import { db } from '../firebase/firebase.js';
import { doc, updateDoc, arrayUnion, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { NotificationService } from '../firebase/firestore.js';

export const ACHIEVEMENTS = [
  { id:'first_algo',    icon:'🚀', name:'First Step',         desc:'Open your first algorithm',          xp:50  },
  { id:'ten_algos',     icon:'📚', name:'Curious Mind',        desc:'Open 10 different algorithms',       xp:100 },
  { id:'fifty_algos',   icon:'🎯', name:'Algorithm Hunter',    desc:'Open 50 different algorithms',       xp:250 },
  { id:'hundred_algos', icon:'🏆', name:'Algorithm Master',   desc:'Open 100 different algorithms',      xp:500 },
  { id:'first_pdf',     icon:'📄', name:'Print Ready',         desc:'Export your first PDF',              xp:50  },
  { id:'ten_pdfs',      icon:'📋', name:'Report Writer',       desc:'Export 10 PDFs',                    xp:150 },
  { id:'first_visual',  icon:'🎬', name:'Visual Learner',     desc:'Complete a visualization',           xp:75  },
  { id:'streak_7',      icon:'🔥', name:'Week Warrior',       desc:'Maintain a 7-day streak',            xp:200 },
  { id:'streak_30',     icon:'⚡', name:'Month Master',        desc:'Maintain a 30-day streak',           xp:500 },
  { id:'profile_done',  icon:'✨', name:'Profile Pro',         desc:'Complete your profile 100%',         xp:100 },
  { id:'first_note',    icon:'📝', name:'Note Taker',         desc:'Create your first cloud note',       xp:50  },
  { id:'first_bug',     icon:'🐛', name:'Bug Hunter',          desc:'Submit a bug report',               xp:75  },
  { id:'donor',         icon:'💎', name:'Supporter',           desc:'Support the developer',              xp:500 },
  { id:'referral_1',    icon:'🤝', name:'Referrer',            desc:'Refer your first friend',           xp:200 },
  { id:'night_owl',     icon:'🦉', name:'Night Owl',           desc:'Study after midnight',               xp:75  },
  { id:'early_bird',    icon:'🐦', name:'Early Bird',          desc:'Study before 6 AM',                  xp:75  },
  { id:'quiz_first',    icon:'❓', name:'Quiz Starter',        desc:'Attempt your first quiz',           xp:50  },
  { id:'quiz_perfect',  icon:'💯', name:'Quiz Master',         desc:'Score 100% on a quiz',              xp:300 },
  { id:'top_10',        icon:'👑', name:'Leaderboard Elite',  desc:'Reach top 10 on leaderboard',       xp:400 },
  { id:'bookmark_10',   icon:'🔖', name:'Bookmarker',          desc:'Bookmark 10 algorithms',            xp:100 }
];

export async function checkAndAward(uid, userData, trigger) {
  const owned = userData.achievements || [];
  const newAchievements = [];

  const checks = {
    first_algo:    () => (userData.totalAlgorithmsUsed || 0) >= 1,
    ten_algos:     () => (userData.totalAlgorithmsUsed || 0) >= 10,
    fifty_algos:   () => (userData.totalAlgorithmsUsed || 0) >= 50,
    hundred_algos: () => (userData.totalAlgorithmsUsed || 0) >= 100,
    first_pdf:     () => (userData.pdfDownloads || 0) >= 1,
    ten_pdfs:      () => (userData.pdfDownloads || 0) >= 10,
    streak_7:      () => (userData.currentStreak || 0) >= 7,
    streak_30:     () => (userData.currentStreak || 0) >= 30,
    profile_done:  () => (userData.profileCompletion || 0) >= 100,
    donor:         () => !!userData.isDonor,
    first_note:    () => trigger === 'noteCreated',
    first_bug:     () => (userData.bugReports || 0) >= 1,
    quiz_first:    () => (userData.quizHistory || []).length >= 1,
    bookmark_10:   () => (userData.bookmarks || []).length >= 10,
    night_owl:     () => { const h = new Date().getHours(); return h >= 0 && h < 4; },
    early_bird:    () => { const h = new Date().getHours(); return h >= 4 && h < 6; },
    // BUG FIX: 4 achievement checks were missing entirely — added below
    first_visual:  () => trigger === 'visualizationCompleted' || (userData.visualizationsCompleted || 0) >= 1,
    referral_1:    () => (userData.referralCount || 0) >= 1,
    quiz_perfect:  () => (userData.quizHistory || []).some(q => q.score === 100),
    top_10:        () => trigger === 'reachedTop10' || (userData.leaderboardRank || Infinity) <= 10
  };

  for (const ach of ACHIEVEMENTS) {
    if (owned.includes(ach.id)) continue;
    if (checks[ach.id] && checks[ach.id]()) {
      newAchievements.push(ach);
    }
  }

  if (newAchievements.length > 0) {
    const ids = newAchievements.map(a => a.id);
    await updateDoc(doc(db, 'users', uid), {
      achievements: arrayUnion(...ids),
      xp: userData.xp + newAchievements.reduce((s, a) => s + a.xp, 0)
    });
    for (const ach of newAchievements) {
      _showAchievementToast(ach);
      await NotificationService.send(uid, {
        title: `Achievement Unlocked: ${ach.name}`,
        body: ach.desc,
        type: 'achievement'
      });
    }
  }
  return newAchievements;
}

export function renderAchievements(userData) {
  const owned = userData.achievements || [];
  const container = document.getElementById('achievements-grid');
  if (!container) return;
  container.innerHTML = ACHIEVEMENTS.map(a => `
    <div class="achievement-card ${owned.includes(a.id) ? 'earned' : 'locked'}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
      <div class="ach-xp">+${a.xp} XP</div>
      ${owned.includes(a.id) ? '<div class="ach-badge">✓ Earned</div>' : '<div class="ach-badge locked">🔒 Locked</div>'}
    </div>`).join('');
}

function _showAchievementToast(ach) {
  const t = document.createElement('div');
  t.className = 'achievement-toast';
  t.innerHTML = `<div class="ach-toast-icon">${ach.icon}</div>
    <div><strong>Achievement Unlocked!</strong><br>${ach.name}<br><small>+${ach.xp} XP</small></div>`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 4000);
}
