import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCXNA7JDiqR6q42sWDHmtC47_5Pn-YVgmo",
  authDomain: "onikeri-premier-league.firebaseapp.com",
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688",
  appId: "1:6768887688:web:4798f5f2ee2aa41fc4dc3d",
  measurementId: "G-K0CZSSKS1F"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
