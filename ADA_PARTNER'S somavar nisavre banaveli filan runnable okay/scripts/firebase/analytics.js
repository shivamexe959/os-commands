import { db } from './firebase.js';
import { doc, setDoc, increment, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const AnalyticsService = {
  async trackAlgoOpen(algoName) {
    const ref = doc(db, 'analytics', 'algorithms');
    await setDoc(ref, { [algoName]: increment(1) }, { merge: true });
  },

  async trackSearch(query) {
    const ref = doc(db, 'analytics', 'searches');
    await setDoc(ref, { [query]: increment(1) }, { merge: true });
  },

  async trackPDF(algo) {
    const ref = doc(db, 'analytics', 'pdfs');
    await setDoc(ref, { [algo]: increment(1), total: increment(1) }, { merge: true });
  },

  async getAlgorithmStats() {
    const snap = await getDoc(doc(db, 'analytics', 'algorithms'));
    return snap.exists() ? snap.data() : {};
  },

  async getSearchStats() {
    const snap = await getDoc(doc(db, 'analytics', 'searches'));
    return snap.exists() ? snap.data() : {};
  }
};
