import { db } from './firebase.js';
import {
  doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, increment,
  collection, query, where, orderBy, limit, getDocs, onSnapshot, addDoc, arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

/* ── Session Tracking ─────────────────────────────────── */
export const SessionService = {
  _sessionId: null,
  _startTime: null,

  async startSession(uid) {
    this._startTime = Date.now();
    const ref = await addDoc(collection(db, 'sessions'), {
      uid, startTime: serverTimestamp(), endTime: null, duration: 0,
      device: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      browser: navigator.userAgent.slice(0, 60)
    });
    this._sessionId = ref.id;
    localStorage.setItem('ada_session', ref.id);
  },

  async endSession() {
    if (!this._sessionId || !this._startTime) return;
    const duration = Math.round((Date.now() - this._startTime) / 1000);
    await updateDoc(doc(db, 'sessions', this._sessionId), {
      endTime: serverTimestamp(), duration
    });
    // update avg session time on user
    this._sessionId = null;
    this._startTime = null;
  }
};

/* ── Feedback ─────────────────────────────────────────── */
export const FeedbackService = {
  async submit(uid, data) {
    const { rating, comment, category } = data;
    if (!rating || !comment) throw new Error('Rating and comment are required.');
    await addDoc(collection(db, 'feedback'), {
      uid, rating, comment, category: category || 'general',
      status: 'open', timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid), { feedbackSubmitted: increment(1) });
  }
};

/* ── Bug Reports ─────────────────────────────────────── */
export const BugService = {
  async submit(uid, data) {
    const { title, description, priority, page } = data;
    await addDoc(collection(db, 'bug_reports'), {
      uid, title, description, priority: priority || 'medium',
      page: page || '', status: 'open', adminReply: '',
      timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid), { bugReports: increment(1) });
  }
};

/* ── Feature Requests ─────────────────────────────────── */
export const FeatureService = {
  async submit(uid, data) {
    const { title, description } = data;
    await addDoc(collection(db, 'feature_requests'), {
      uid, title, description, status: 'open',
      votes: 0, voters: [], timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid), { featureRequests: increment(1) });
  },

  async vote(uid, requestId) {
    const ref = doc(db, 'feature_requests', requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const voters = snap.data().voters || [];
    if (voters.includes(uid)) return;
    await updateDoc(ref, { votes: increment(1), voters: arrayUnion(uid) });
  }
};

/* ── Notifications ─────────────────────────────────── */
export const NotificationService = {
  async send(uid, notification) {
    const { title, body, type = 'info', link = '' } = notification;
    await addDoc(collection(db, 'users', uid, 'notifications'), {
      title, body, type, link, read: false, timestamp: serverTimestamp()
    });
  },

  async sendGlobal(notification) {
    await addDoc(collection(db, 'announcements'), {
      ...notification, timestamp: serverTimestamp(), active: true
    });
  },

  async markRead(uid, nid) {
    await updateDoc(doc(db, 'users', uid, 'notifications', nid), { read: true });
  },

  async deleteNotification(uid, nid) {
    await deleteDoc(doc(db, 'users', uid, 'notifications', nid));
  },

  listenToNotifications(uid, callback) {
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('timestamp', 'desc'), limit(20)
    );
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  listenToAnnouncements(callback) {
    const q = query(collection(db, 'announcements'), where('active', '==', true),
      orderBy('timestamp', 'desc'), limit(5));
    return onSnapshot(q, snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }
};

/* ── Donations ─────────────────────────────────────── */
export const DonationService = {
  async record(uid, amount, name) {
    await addDoc(collection(db, 'donations'), {
      uid, name, amount, timestamp: serverTimestamp(), verified: false
    });
    await updateDoc(doc(db, 'users', uid), { isDonor: true });
    await setDoc(doc(db, 'stats', 'donations'), {
      totalAmount: increment(amount), totalCount: increment(1)
    }, { merge: true });
  },

  async getStats() {
    const snap = await getDoc(doc(db, 'stats', 'donations'));
    return snap.exists() ? snap.data() : { totalAmount: 0, totalCount: 0 };
  },

  async getTopDonors(n = 5) {
    const q = query(collection(db, 'donations'), orderBy('amount', 'desc'), limit(n));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => d.data());
  }
};

/* ── Leaderboard ─────────────────────────────────── */
export const LeaderboardService = {
  async getTop(n = 20) {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(n));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => d.data());
  },

  async getCollegeRank(college) {
    const q = query(collection(db, 'users'), where('college', '==', college), orderBy('xp', 'desc'), limit(10));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => d.data());
  }
};

/* ── Notes ─────────────────────────────────────────── */
export const NotesService = {
  async save(uid, noteId, data) {
    const ref = noteId
      ? doc(db, 'users', uid, 'notes', noteId)
      : doc(collection(db, 'users', uid, 'notes'));
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return ref.id;
  },

  async getAll(uid) {
    const q = query(collection(db, 'users', uid, 'notes'), orderBy('updatedAt', 'desc'));
    const snaps = await getDocs(q);
    return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async delete(uid, noteId) {
    await deleteDoc(doc(db, 'users', uid, 'notes', noteId));
  }
};

/* ── PDF History ────────────────────────────────────── */
export const PDFService = {
  async record(uid, filename) {
    await addDoc(collection(db, 'users', uid, 'pdf_history'), {
      filename, timestamp: serverTimestamp()
    });
    await updateDoc(doc(db, 'users', uid), { pdfDownloads: increment(1) });
  }
};

/* ── Admin Service ─────────────────────────────────── */
export const AdminService = {
  async getAnalyticsOverview() {
    const [usersSnap, sessionsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'sessions'), orderBy('startTime', 'desc'), limit(500)))
    ]);
    const users = usersSnap.docs.map(d => d.data());
    const sessions = sessionsSnap.docs.map(d => d.data());
    const today = new Date().toISOString().slice(0, 10);
    return {
      totalUsers: users.length,
      todayUsers: users.filter(u => u.lastLogin?.toDate?.().toISOString().slice(0, 10) === today).length,
      totalSessions: sessions.length,
      avgSession: sessions.reduce((a, s) => a + (s.duration || 0), 0) / (sessions.length || 1),
      deviceBreakdown: _count(users, 'device'),
      browserBreakdown: _count(users, 'browser'),
      osBreakdown: _count(users, 'os'),
      collegeBreakdown: _count(users, 'college'),
      countryBreakdown: _count(users, 'country')
    };
  },

  async banUser(uid) {
    await updateDoc(doc(db, 'users', uid), { role: 'banned' });
  },

  async deleteUser(uid) {
    await deleteDoc(doc(db, 'users', uid));
  },

  async promoteAdmin(uid) {
    await updateDoc(doc(db, 'users', uid), { role: 'admin' });
  },

  async exportUsersCSV(users) {
    const headers = ['uid','name','email','college','university','xp','coins','currentStreak','pdfDownloads','totalSessions','joinDate','lastLogin','role'];
    const rows = users.map(u => headers.map(h => `"${(u[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
    return [headers.join(','), ...rows].join('\n');
  },

  listenToFeedback(callback) {
    return onSnapshot(query(collection(db, 'feedback'), orderBy('timestamp', 'desc'), limit(50)), snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  },

  listenToBugReports(callback) {
    return onSnapshot(query(collection(db, 'bug_reports'), orderBy('timestamp', 'desc'), limit(50)), snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }
};

function _count(arr, key) {
  return arr.reduce((acc, item) => {
    const v = item[key] || 'Unknown';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
}
