import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth'; // <-- CHANGED TO WEB SDK
import { db, app } from '../config/firebase'; // <-- EXPORTING APP FROM YOUR CONFIG
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// YOUR EXACT WEB CLIENT ID
GoogleSignin.configure({
  webClientId: '6768887688-64tkpv9ufs4ub13hni1fk3jcup67osgj.apps.googleusercontent.com',
});

export default function LoginScreen({ onLoginSuccess }: any) {
  const [step, setStep] = useState<'LOGIN' | 'ONBOARDING'>('LOGIN');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Onboarding State
  const [tempUid, setTempUid] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const roles = ['Batter', 'Bowler', 'All-rounder', 'Wicket Keeper'];

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      // 1. Trigger the Native Google Popup
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      
      // Safely extract the ID token
      const idToken = userInfo.idToken || (userInfo as any).data?.idToken;
      if (!idToken) throw new Error("Google Sign-In failed to return an ID token.");

      // 2. Connect to Firebase using the Web SDK
      const auth = getAuth(app);
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // 3. Check if user already exists in your Firestore Database
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists() && userDoc.data()?.playingRole) {
        setIsProcessing(false);
        onLoginSuccess(userDoc.data()); // Returning User -> Go to Dashboard
      } else {
        // New User -> Go to Onboarding
        setTempUid(user.uid);
        setTempEmail(user.email || '');
        setName(user.displayName || '');
        setIsProcessing(false);
        setStep('ONBOARDING');
      }
    } catch (error: any) {
      setIsProcessing(false);
      console.log(error);
      // Make error message cleaner for users
      const errorMsg = error.message.includes('DEVELOPER_ERROR') 
        ? 'Configuration error. Ensure SHA-1 is added to Firebase.' 
        : error.message;
      Alert.alert('Login Failed', errorMsg);
    }
  };

  const handleCompleteProfile = async () => {
    if (name.trim().length < 2) return Alert.alert('Required', 'Please enter your full name.');
    if (!/^[6-9]\d{9}$/.test(phone)) return Alert.alert('Required', 'Enter a valid 10-digit mobile number.');
    if (!selectedRole) return Alert.alert('Required', 'Please select your playing role.');

    setIsProcessing(true);
    try {
      const newUserInfo = {
        uid: tempUid,
        email: tempEmail,
        fullName: name,
        mobileNumber: phone,
        playingRole: selectedRole,
        walletBalance: 0,
        status: 'Active',
        appRole: 'Player'
      };

      await setDoc(doc(db, 'users', tempUid), newUserInfo);
      setIsProcessing(false);
      onLoginSuccess(newUserInfo);
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert('Error', 'Could not save profile. Try again.');
    }
  };

  const handleGuestLogin = () => {
    onLoginSuccess({ uid: 'guest_' + Math.random().toString(36).substring(7), fullName: 'Guest Fan', appRole: 'Guest', walletBalance: 0 });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <MaterialCommunityIcons name="cricket" size={64} color="#38BDF8" style={{ marginBottom: 15 }} />
        <Text style={styles.title}>Onikeri Premier League</Text>
        <Text style={styles.subtitle}>Professional Turf & League Management</Text>
      </View>
      
      {step === 'LOGIN' && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#090D16" /> : (
              <>
                <FontAwesome5 name="google" size={18} color="#090D16" style={{ marginRight: 10 }} />
                <Text style={styles.googleBtnText}>Continue with Gmail</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin}>
            <Text style={styles.guestBtnText}>Skip as Guest</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'ONBOARDING' && (
        <View style={styles.card}>
          <Text style={styles.onboardTitle}>Complete Your Profile</Text>
          
          <Text style={styles.label}>Your Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Gajanan" placeholderTextColor="#475569" value={name} onChangeText={setName} />
          
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput style={styles.input} keyboardType="number-pad" placeholder="10-digit number" placeholderTextColor="#475569" maxLength={10} value={phone} onChangeText={setPhone} />
          
          <Text style={styles.label}>Your Playing Role</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity key={role} style={[styles.roleBtn, selectedRole === role && styles.roleBtnActive]} onPress={() => setSelectedRole(role)}>
                <Text style={[styles.roleBtnText, selectedRole === role && styles.roleBtnTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleCompleteProfile} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enter the League</Text>}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94A3B8' },
  card: { width: '100%', backgroundColor: '#131C2E', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#1E293B', elevation: 10 },
  onboardTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#090D16', color: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20, fontSize: 16 },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  roleBtn: { width: '48%', backgroundColor: '#090D16', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', marginBottom: 10, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  roleBtnText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 },
  roleBtnTextActive: { color: '#090D16', fontWeight: 'bold' },
  btn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  googleBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { color: '#090D16', fontWeight: 'bold', fontSize: 16 },
  guestBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
  guestBtnText: { color: '#38BDF8', fontWeight: '600', fontSize: 14 }
});
