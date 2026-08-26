import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyApQMT3mKXhUTmr3GrZjG1U7tSbP8hMRsQ",
  authDomain: "onikeri-premier-league.firebaseapp.com",
  databaseURL: "https://onikeri-premier-league-default-rtdb.firebaseio.com",
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688",
  appId: "1:6768887688:android:90f7f09cec8bf5c7c4dc3d",
};

// Safe initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 🔥 PRO FIX: Tell Firebase to save the login session permanently on the phone
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Force polling for mobile networks
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Realtime Database
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
