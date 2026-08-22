import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';

export default function App() {
  const [authState, setAuthState] = useState<'LOGIN' | 'SETUP' | 'DASHBOARD'>('LOGIN');
  const [user, setUser] = useState<any>(null);
  const [authData, setAuthData] = useState<any>(null);

  if (authState === 'LOGIN') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090D16" />
        <LoginScreen 
          onLoginSuccess={(userData: any) => { setUser(userData); setAuthState('DASHBOARD'); }}
          onRequireProfile={(data: any) => { setAuthData(data); setAuthState('SETUP'); }}
          onAdminUnlock={() => { setUser({ role: 'SuperAdmin', fullName: 'System Admin' }); setAuthState('DASHBOARD'); }}
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
       <StatusBar barStyle="light-content" backgroundColor="#090D16" />
       <DashboardScreen user={user} onLogout={() => { setUser(null); setAuthState('LOGIN'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' }
});
