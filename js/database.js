import { db } from './firebase-config.js';
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, limit, where, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const JOBS_LIMIT = 200;

export async function fetchJobs() {
  const snap = await getDocs(query(collection(db, 'jobs'), orderBy('createdAt', 'desc'), limit(JOBS_LIMIT)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fetchMyJobs(uid) {
  // Single-field equality query: no composite index needed. Sorted on the client.
  const snap = await getDocs(query(collection(db, 'jobs'), where('userId', '==', uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

export async function addJob(user, data) {
  const ref = doc(collection(db, 'jobs'));
  await setDoc(ref, { jobId: ref.id, userId: user.uid, ...data, createdAt: serverTimestamp() });
  return { id: ref.id, jobId: ref.id, userId: user.uid, ...data, createdAt: Timestamp.now() };
}

export const removeJob = id => deleteDoc(doc(db, 'jobs', id));

export async function ensureUserDoc(user, nameOverride) {
  try {
    const ref = doc(db, 'users', user.uid);
    if ((await getDoc(ref)).exists()) return;
    await setDoc(ref, {
      uid: user.uid,
      name: nameOverride || user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp()
    });
  } catch (e) { console.warn('ensureUserDoc', e); }
}
