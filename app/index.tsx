import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, Text } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
// Keep your other imports here...

export default function App() {
  const [authState, setAuthState] = useState<'LOGIN' | 'SETUP' | 'DASHBOARD'>('LOGIN');
  const [user, setUser] = useState<any>(null);
  
  // This now holds both the Mobile Number AND the secure Firebase UID
  const [authData, setAuthData] = useState<{mobile: string, uid: string} | null>(null);

  if (authState === 'LOGIN') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090D16" />
        <LoginScreen 
          onLoginSuccess={(userData: any) => { setUser(userData); setAuthState('DASHBOARD'); }}
          onRequireProfile={(data: any) => { setAuthData(data); setAuthState('SETUP'); }}
          onAdminUnlock={() => { setUser({ role: 'SuperAdmin', fullName: 'SuperAdmin' }); setAuthState('DASHBOARD'); }}
        />
      </View>
    );
  }

  if (authState === 'SETUP') {
    return (
      <View style={styles.container}>
        <ProfileSetupScreen 
          authData={authData} 
          onSetupComplete={(userData: any) => { setUser(userData); setAuthState('DASHBOARD'); }} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
       {/* YOUR DASHBOARD REMAINS HERE */}
       <Text style={{color: '#fff', marginTop: 100, textAlign: 'center'}}>Dashboard Loaded!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' }
});
