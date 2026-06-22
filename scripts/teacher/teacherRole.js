// scripts/teacher/teacherRole.js
// Role check helpers + promote/demote logic for Teacher role
// Division names: GX, GY, GZ — VVP Engineering College, CSE Dept.

import { db } from '../firebase/firebase.js';
import {
  doc, updateDoc, getDoc, collection,
  query, where, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const DIVISIONS = ['GX', 'GY', 'GZ'];

// ─── Role checks ─────────────────────────────────────────────────────────────

export function isTeacher(userData) {
  return userData?.role === 'teacher' || userData?.role === 'admin';
}

export function isAdmin(userData) {
  return userData?.role === 'admin';
}

export function isStrictTeacher(userData) {
  return userData?.role === 'teacher';
}

// ─── Promote / Demote ────────────────────────────────────────────────────────

/**
 * Promote a user to teacher. assignedDivisions is an array like ['GX','GY'].
 * Called from adminDashboard promote button.
 */
export async function promoteToTeacher(uid, assignedDivisions = []) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    role: 'teacher',
    teacherDivisions: assignedDivisions,
    teacherSince: new Date().toISOString()
  });
}

/**
 * Demote a teacher back to student.
 */
export async function demoteFromTeacher(uid) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    role: 'student',
    teacherDivisions: [],
    teacherSince: null
  });
}

// ─── Fetch teacher's own data ─────────────────────────────────────────────────

export async function getTeacherProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// ─── Fetch all teachers (for admin overview) ─────────────────────────────────

export async function getAllTeachers() {
  const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// ─── Fetch students in a division ────────────────────────────────────────────

export async function getStudentsByDivision(division) {
  const q = query(
    collection(db, 'users'),
    where('division', '==', division)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

// ─── Update teacher's assigned divisions ─────────────────────────────────────

export async function updateTeacherDivisions(uid, divisions) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { teacherDivisions: divisions });
}
