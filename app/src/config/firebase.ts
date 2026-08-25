import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // <-- NEW RTDB IMPORT

const firebaseConfig = {
  apiKey: "AIzaSyCXNA7JDiqR6q42sWDHmtC47_5Pn-YVgmo",
  authDomain: "onikeri-premier-league.firebaseapp.com",
  databaseURL: "https://onikeri-premier-league-default-rtdb.firebaseio.com", // <-- ADDED RTDB URL
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688",
  appId: "1:6768887688:web:4798f5f2ee2aa41fc4dc3d",
  measurementId: "G-K0CZSSKS1F"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore (For saving User Profiles & Wallets)
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

// Realtime Database (For Live Match Scores with zero lag)
const rtdb = getDatabase(app);

export { db, rtdb, app };
