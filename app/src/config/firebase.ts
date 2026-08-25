import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // <-- ADDED: RTDB Import

const firebaseConfig = {
  apiKey: "AIzaSyApQMT3mKXhUTmr3GrZjG1U7tSbP8hMRsQ",
  authDomain: "onikeri-premier-league.firebaseapp.com",
  databaseURL: "https://onikeri-premier-league-default-rtdb.firebaseio.com", // <-- ADDED: RTDB URL
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688",
  appId: "1:6768887688:android:90f7f09cec8bf5c7c4dc3d",
};

// Safe initialization (prevents app crashes on reload)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// PRO FIX: Forces polling to bypass mobile network WebSockets bug
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Realtime Database (for zero-latency live scores)
const rtdb = getDatabase(app);

// Exporting rtdb so your Dashboard can use it!
export { app, auth, db, rtdb };
