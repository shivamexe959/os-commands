import { auth } from './firebase.js';
import {
  GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { UserService } from './database.js';
import { SessionService } from './firestore.js';
import { ADMIN_CONFIG } from '../../config/adminConfig.js';

const provider = new GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

export let currentUser = null;
export let isAdmin = false;
export let isTeacher = false;

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    console.error('Sign-in error:', e);
    throw e;
  }
}

export async function signOutUser() {
  await SessionService.endSession();
  await signOut(auth);
  currentUser = null;
  isAdmin = false;
  isTeacher = false;
}

export function isTeacherRole(userData) {
  return userData?.role === 'teacher' || userData?.role === 'admin';
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      // BUG FIX: filter empty string from adminUIDs so it doesn't falsely match
      isAdmin = ADMIN_CONFIG.adminEmails.includes(user.email) ||
                ADMIN_CONFIG.adminUIDs.filter(u => u).includes(user.uid);

      // createOrUpdateUser can throw on Firestore permission errors —
      // fall back to a minimal object so the UI always renders
      let userData = null;
      try {
        userData = await UserService.createOrUpdateUser(user);
      } catch(e) {
        console.warn('createOrUpdateUser failed, falling back to getUser:', e);
        try { userData = await UserService.getUser(user.uid); } catch(_) {}
      }

      // Role promotions are best-effort — NEVER block login if they fail
      // (Firestore rules may not be applied yet, or network may be slow)
      try {
        if (isAdmin && userData?.role !== 'admin') {
          await UserService.updateProfile(user.uid, { role: 'admin' });
          userData = { ...userData, role: 'admin' };
        }
      } catch(e) { console.warn('Admin role promotion skipped:', e.code || e.message); }

      // Teacher: detected by config teacherEmails OR already has teacher role in Firestore
      const teacherDetected = (ADMIN_CONFIG.teacherEmails || []).includes(user.email) ||
        userData?.role === 'teacher';
      isTeacher = teacherDetected;

      try {
        if (teacherDetected && userData?.role === 'student') {
          await UserService.updateProfile(user.uid, { role: 'teacher' });
          userData = { ...userData, role: 'teacher' };
        }
      } catch(e) { console.warn('Teacher role promotion skipped:', e.code || e.message); }

      try { await SessionService.startSession(user.uid); } catch(e) {}

      // Always call callback — navbar must render regardless of any above errors
      callback(user, isAdmin, userData);
    } else {
      currentUser = null;
      isAdmin = false;
      isTeacher = false;
      callback(null, false, null);
    }
  });
}
