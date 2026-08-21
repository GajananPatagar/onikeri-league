import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { PhoneAuthProvider, signInWithCredential, signInWithPhoneNumber } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { db, auth, app } from '../config/firebase';

export default function LoginScreen({ onLoginSuccess, onRequireProfile, onAdminUnlock }: any) {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'INPUT' | 'OTP' | 'ADMIN'>('INPUT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userOtp, setUserOtp] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  // Firebase Phone Auth States
  const [verificationId, setVerificationId] = useState('');
  const recaptchaVerifier = useRef(null);

  const handleProceed = async () => {
    const input = identifier.trim().toLowerCase();

    // 1. SECRET ADMIN GATEWAY
    if (input === 'admin@onikeri.com') {
      setStep('ADMIN');
      return;
    }

    // 2. PLAYER MOBILE GATEWAY
    if (!/^[6-9]\d{9}$/.test(input)) {
      return Alert.alert('Invalid', 'Enter a valid 10-digit mobile number.');
    }

    setIsProcessing(true);
    try {
      // REAL FIREBASE NATIVE OTP DISPATCH
      const phoneNumber = `+91${input}`;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
      
      setVerificationId(confirmationResult.verificationId);
      setIsProcessing(false);
      setStep('OTP');
      Alert.alert('OTP Sent 📲', 'Firebase has dispatched a secure 6-digit OTP to your mobile.');
    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Firebase Error', err.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (userOtp.length !== 6) {
      return Alert.alert('Invalid OTP', 'Firebase verification codes are 6 digits long.');
    }

    setIsProcessing(true);
    try {
      // VERIFY FIREBASE CREDENTIALS
      const credential = PhoneAuthProvider.credential(verificationId, userOtp);
      const userCredential = await signInWithCredential(auth, credential);
      const uid = userCredential.user.uid; // This generates a highly secure Firebase Auth UID
      
      // CHECK IF USER COMPLETED PROFILE
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().photoURL && userDoc.data().fullName) {
        onLoginSuccess(userDoc.data());
      } else {
        // Force new user to setup profile with their new Secure UID
        onRequireProfile({ mobile: identifier, uid: uid });
      }
    } catch (e: any) {
      setIsProcessing(false);
      Alert.alert('Verification Failed', 'The OTP entered is incorrect or expired.');
    }
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND RECAPTCHA FOR FIREBASE SECURITY */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={false} 
      />

      <MaterialCommunityIcons name="cricket" size={54} color="#38BDF8" style={{ marginBottom: 20 }} />
      <Text style={styles.title}>Onikeri Premier League</Text>
      
      {step === 'INPUT' && (
        <View style={styles.card}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput style={styles.input} keyboardType="number-pad" placeholder="10-digit number" placeholderTextColor="#475569" autoCapitalize="none" value={identifier} onChangeText={setIdentifier} />
          <TouchableOpacity style={styles.btn} onPress={handleProceed} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Firebase OTP</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 'OTP' && (
        <View style={styles.card}>
          <Text style={styles.label}>Enter 6-Digit OTP</Text>
          <TextInput style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]} keyboardType="number-pad" maxLength={6} value={userOtp} onChangeText={setUserOtp} />
          <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Identity</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 'ADMIN' && (
        <View style={[styles.card, { borderColor: '#EF4444' }]}>
          <Text style={[styles.label, { color: '#EF4444' }]}>System Administrator</Text>
          <TextInput style={[styles.input, { textAlign: 'center' }]} secureTextEntry placeholder="Passkey" placeholderTextColor="#475569" value={adminPass} onChangeText={setAdminPass} />
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={() => {
            if (adminPass === '@1681Admin') onAdminUnlock();
            else Alert.alert('Denied', 'Incorrect access key.');
          }}>
            <Text style={styles.btnText}>Initialize God Mode</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 30 },
  card: { width: '100%', backgroundColor: '#131C2E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B' },
  label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12 },
  input: { backgroundColor: '#090D16', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 },
  btn: { backgroundColor: '#0284C7', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' }
});

