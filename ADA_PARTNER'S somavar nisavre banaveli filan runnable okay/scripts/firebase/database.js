import { db } from './firebase.js';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, increment,
  collection, query, where, orderBy, limit, getDocs, arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const UserService = {
  async createOrUpdateUser(firebaseUser) {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);
    const now = serverTimestamp();
    const ua = navigator.userAgent;
    const deviceInfo = {
      browser: /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Other',
      os: /win/i.test(ua) ? 'Windows' : /mac/i.test(ua) ? 'macOS' : /linux/i.test(ua) ? 'Linux' : /android/i.test(ua) ? 'Android' : /iphone|ipad/i.test(ua) ? 'iOS' : 'Other',
      device: /mobile|android|iphone|ipad/i.test(ua) ? 'Mobile' : 'Desktop',
      screen: `${window.screen.width}x${window.screen.height}`
    };
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        phone: firebaseUser.phoneNumber || '',
        provider: firebaseUser.providerData[0]?.providerId || 'google',
        college: '', university: '', semester: '', branch: '',
        country: '', state: '', city: '',
        joinDate: now, lastLogin: now, lastActive: now,
        role: 'student', isPremium: false, isDonor: false,
        theme: 'dark', language: 'en', animationSpeed: 'medium',
        totalSessions: 1, avgSessionTime: 0, totalAlgorithmsUsed: 0,
        favoriteAlgorithms: [], searchHistory: [], recentlyViewed: [],
        pdfDownloads: 0, quizHistory: [], achievements: [],
        xp: 0, coins: 0, badges: [], bookmarks: [],
        personalNotes: '', feedbackSubmitted: 0, bugReports: 0,
        featureRequests: 0, notificationsEnabled: true,
        currentStreak: 0, longestStreak: 0, lastStreakDate: '',
        profileCompletion: 20, referralCode: _genReferral(firebaseUser.uid),
        referralCount: 0, referredBy: '',
        ...deviceInfo, createdAt: now
      });
    } else {
      await updateDoc(ref, {
        lastLogin: now, lastActive: now,
        totalSessions: increment(1), ...deviceInfo
      });
    }
    return (await getDoc(ref)).data();
  },

  async getUser(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  },

  async updateProfile(uid, data) {
    const allowed = [
      'name','college','university','semester','branch',
      'country','state','city','phone','theme','language','animationSpeed',
      'notificationsEnabled','profileCompletion',
      'cloudBackup',        // BUG FIX: was missing, caused silent cloud backup failure
      'division',           // student's class division: GX / GY / GZ
      'role',               // needed for teacher/admin promotion
      'teacherDivisions','teacherSince',
      'isMuted','mutedBy','mutedReason','mutedAt',
      'bonusXpLog'
    ];
    const filtered = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed.includes(k))
    );
    await updateDoc(doc(db, 'users', uid), { ...filtered, lastActive: serverTimestamp() });
  },

  async addXP(uid, amount, reason = '') {
    await updateDoc(doc(db, 'users', uid), { xp: increment(amount), coins: increment(Math.floor(amount / 10)) });
    if (reason) await this.addActivity(uid, { type: 'xp', description: `+${amount} XP — ${reason}`, xp: amount });
  },

  async addActivity(uid, activity) {
    const ref = collection(db, 'users', uid, 'activity');
    await setDoc(doc(ref), { ...activity, timestamp: serverTimestamp() });
  },

  async addToRecent(uid, algoName) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    let recent = snap.data().recentlyViewed || [];
    recent = [algoName, ...recent.filter(x => x !== algoName)].slice(0, 50);
    await updateDoc(ref, { recentlyViewed: recent, totalAlgorithmsUsed: increment(1), lastActive: serverTimestamp() });
  },

  async toggleBookmark(uid, algoName) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const bm = snap.data().bookmarks || [];
    if (bm.includes(algoName)) {
      await updateDoc(ref, { bookmarks: arrayRemove(algoName) });
      return false;
    } else {
      await updateDoc(ref, { bookmarks: arrayUnion(algoName) });
      return true;
    }
  },

  async toggleFavorite(uid, algoName) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const favs = snap.data().favoriteAlgorithms || [];
    if (favs.includes(algoName)) {
      await updateDoc(ref, { favoriteAlgorithms: arrayRemove(algoName) });
      return false;
    } else {
      await updateDoc(ref, { favoriteAlgorithms: arrayUnion(algoName) });
      return true;
    }
  },

  async updateStreak(uid) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const d = snap.data();
    const today = new Date().toISOString().slice(0, 10);
    if (d.lastStreakDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = d.lastStreakDate === yesterday ? (d.currentStreak || 0) + 1 : 1;
    await updateDoc(ref, {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, d.longestStreak || 0),
      lastStreakDate: today
    });
    return newStreak;
  },

  async saveSearchHistory(uid, query) {
    if (!query.trim()) return;
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    let hist = snap.data().searchHistory || [];
    hist = [query, ...hist.filter(x => x !== query)].slice(0, 100);
    await updateDoc(ref, { searchHistory: hist });
    // global search analytics
    const sref = doc(db, 'analytics', 'searches');
    await setDoc(sref, { [query]: increment(1) }, { merge: true });
  },

  async getAllUsers(limitN = 100) {
    const q = query(collection(db, 'users'), orderBy('joinDate', 'desc'), limit(limitN));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => d.data());
  }
};

function _genReferral(uid) {
  return 'ADA' + uid.slice(0, 6).toUpperCase();
}
