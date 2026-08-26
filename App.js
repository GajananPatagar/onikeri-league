import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Pointing to your root config file

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Session found! Skip login.
      } else {
        setUser(null); // No session, show login screen.
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return null; // Or return a nice loading spinner/splash screen
  }

  // Your routing logic here...
  // if (!user) return <LoginScreen />
  // return <DashboardScreen user={user} />
}
