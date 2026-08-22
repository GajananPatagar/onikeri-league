import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// PRO FIX: Explicit Native Imports to prevent Web SDK collisions
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';

export default function LoginScreen({ onLoginSuccess, onRequireProfile, onAdminUnlock }: any) {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'INPUT' | 'OTP' | 'ADMIN'>('INPUT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userOtp, setUserOtp] = useState('');
  const [adminPass, setAdminPass] = useState('');
  
  const [confirmResult, setConfirmResult] = useState<any>(null);

  const handleProceed = async () => {
    const input = identifier.trim().toLowerCase();

    // SECRET ADMIN GATEWAY
    if (input === 'admin@onikeri.com') {
      setStep('ADMIN');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(input)) {
      return Alert.alert('Invalid', 'Enter a valid 10-digit mobile number.');
    }

    setIsProcessing(true);
    try {
      // EXPLICIT NATIVE CALL: Bypasses bundler confusion
      const confirmation = await firebase.auth().signInWithPhoneNumber(`+91${input}`);
      setConfirmResult(confirmation);
      
      setIsProcessing(false);
      setStep('OTP');
      Alert.alert('OTP Sent 📲', 'Firebase has dispatched a secure 6-digit OTP to your mobile.');
    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Firebase Error', err.message || 'Failed to send OTP. Ensure your SHA keys are correctly linked.');
    }
  };

  const handleVerifyOtp = async () => {
    if (userOtp.length !== 6) {
      return Alert.alert('Invalid OTP', 'Firebase verification codes must be 6 digits long.');
    }

    setIsProcessing(true);
    try {
      const userCredential = await confirmResult.confirm(userOtp);
      const uid = userCredential.user.uid; 
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data()?.photoURL && userDoc.data()?.fullName) {
        onLoginSuccess(userDoc.data());
      } else {
        onRequireProfile({ mobile: identifier, uid: uid });
      }
    } catch (e: any) {
      setIsProcessing(false);
      Alert.alert('Verification Failed', 'The OTP entered is incorrect or expired.');
    }
  };

  return (
    <View style={styles.container}>
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
