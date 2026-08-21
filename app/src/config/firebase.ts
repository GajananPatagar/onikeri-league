import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyApQMT3mKXhUTmr3GrZjG1U7tSbP8hMRsQ",
  authDomain: "onikeri-premier-league.firebaseapp.com",
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688",
  appId: "1:6768887688:android:90f7f09cec8bf5c7c4dc3d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// PRO FIX: Forces polling to bypass mobile network WebSocket blocks
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export { app, auth, db };
