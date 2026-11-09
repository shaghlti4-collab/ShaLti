import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAfyUgXJJ-gssbqfzyEPXG3KrryZ3BHqWI",
  authDomain: "shaghlti.firebaseapp.com",
  projectId: "shaghlti",
  storageBucket: "shaghlti.firebasestorage.app",
  messagingSenderId: "163010135885",
  appId: "1:163010135885:web:b397a5dec386962a2d1904",
  measurementId: "G-BX4WKB7THD"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
