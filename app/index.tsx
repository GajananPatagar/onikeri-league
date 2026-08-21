import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import DashboardScreen from './src/screens/DashboardScreen'; // We will inline the Dashboard layout logic here for immediate entry

export default function App() {
  const [authState, setAuthState] = useState<'LOGIN' | 'SETUP' | 'DASHBOARD'>('LOGIN');
  const [user, setUser] = useState<any>(null);
  const [tempMobile, setTempMobile] = useState('');

  if (authState === 'LOGIN') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090D16" />
        <LoginScreen 
          onLoginSuccess={(userData: any) => { setUser(userData); setAuthState('DASHBOARD'); }}
          onRequireProfile={(mobile: string) => { setTempMobile(mobile); setAuthState('SETUP'); }}
          onAdminUnlock={() => { setUser({ role: 'SuperAdmin', fullName: 'SuperAdmin' }); setAuthState('DASHBOARD'); }}
        />
      </View>
    );
  }

  if (authState === 'SETUP') {
    return (
      <View style={styles.container}>
        <ProfileSetupScreen 
          mobileNumber={tempMobile} 
          onSetupComplete={(userData: any) => { setUser(userData); setAuthState('DASHBOARD'); }} 
        />
      </View>
    );
  }

  // To keep the file manageable, import the remaining Dashboard view here
  // (In your actual codebase, move the large Dashboard return block into app/src/screens/DashboardScreen.tsx)
  return (
    <View style={styles.container}>
      <Text style={{color: '#fff', alignSelf: 'center', marginTop: 100}}>Welcome to Dashboard</Text>
      {/* Import your existing Dashboard Layout Code here. For modularity, connect AdminMatrix and RazorpayWallet components into it! */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' }
});
