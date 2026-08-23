import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import auth from '@react-native-firebase/auth';
import Constants from 'expo-constants';

export default function LoginScreen({ onLoginSuccess, onRequireProfile, onAdminUnlock }: any) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'INPUT' | 'OTP' | 'ADMIN'>('INPUT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userOtp, setUserOtp] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminTaps, setAdminTaps] = useState(0);
  
  const [timer, setTimer] = useState(0);
  const [confirmResult, setConfirmResult] = useState<any>(null);

  useEffect(() => {
    let interval: any;
    if (timer > 0) interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // SECRET ADMIN TRIGGER: Tap the logo 5 times rapidly
  const handleLogoTap = () => {
    setAdminTaps(prev => prev + 1);
    if (adminTaps >= 4) {
      setStep('ADMIN');
      setAdminTaps(0);
    }
  };

  const handleProceed = async () => {
    if (name.trim().length < 2) return Alert.alert('Required', 'Please enter your name.');
    if (!/^[6-9]\d{9}$/.test(identifier)) return Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number.');

    // EXPO GO SAFEGUARD
    if (Constants.appOwnership === 'expo') {
      return Alert.alert(
        'Testing Environment Error 🛑', 
        'You are running this inside Expo Go!\n\nNative Firebase SMS does not exist in Expo Go. You MUST build and install the actual APK to receive the OTP.'
      );
    }

    setIsProcessing(true);
    try {
      // 100% REAL FIREBASE SMS REQUEST
      const confirmation = await auth().signInWithPhoneNumber(`+91${identifier}`);
      setConfirmResult(confirmation);
      setIsProcessing(false);
      setStep('OTP');
      setTimer(30);
    } catch (err: any) {
      setIsProcessing(false);
      console.log(err);
      Alert.alert('Verification Error', err?.message || 'Firebase failed to send the code.');
    }
  };

  const handleVerifyOtp = async () => {
    if (userOtp.length !== 6) return Alert.alert('Invalid Code', 'Verification codes must be 6 digits long.');

    setIsProcessing(true);
    try {
      const userCredential = await confirmResult.confirm(userOtp);
      const uid = userCredential.user.uid; 
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data()?.photoURL) {
        onLoginSuccess(userDoc.data());
      } else {
        onRequireProfile({ mobile: identifier, uid: uid, predefinedName: name });
      }
    } catch (e: any) {
      setIsProcessing(false);
      Alert.alert('Verification Failed', 'The code entered is incorrect or expired.');
    }
  };

  const handleGuestLogin = () => {
    onLoginSuccess({
      uid: 'guest_' + Math.random().toString(36).substring(7),
      fullName: 'Guest User',
      role: 'Guest',
      walletBalance: 0
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={handleLogoTap}>
        <View style={{ alignItems: 'center' }}>
          <MaterialCommunityIcons name="cricket" size={64} color="#38BDF8" style={{ marginBottom: 15 }} />
          <Text style={styles.title}>Onikeri Premier League</Text>
          <Text style={styles.subtitle}>Professional Turf & League Management</Text>
        </View>
      </TouchableWithoutFeedback>
      
      {step === 'INPUT' && (
        <View style={styles.card}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Gajanan" placeholderTextColor="#475569" autoCapitalize="words" value={name} onChangeText={setName} />
          
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput style={styles.input} keyboardType="number-pad" placeholder="10-digit number" placeholderTextColor="#475569" maxLength={10} value={identifier} onChangeText={setIdentifier} />
          
          <TouchableOpacity style={styles.btn} onPress={handleProceed} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Get Verification Code</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={handleGuestLogin}>
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'OTP' && (
        <View style={styles.card}>
          <Text style={styles.label}>Enter 6-Digit Code</Text>
          <Text style={styles.helperText}>Sent to +91 {identifier}</Text>
          <TextInput style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]} keyboardType="number-pad" maxLength={6} value={userOtp} onChangeText={setUserOtp} />
          
          <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Identity</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.resendBtn, timer > 0 && { opacity: 0.5 }]} onPress={handleProceed} disabled={timer > 0 || isProcessing}>
            <Text style={styles.resendBtnText}>{timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code Now'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'ADMIN' && (
        <View style={[styles.card, { borderColor: '#EF4444' }]}>
          <Text style={[styles.label, { color: '#EF4444' }]}>God Mode Gateway</Text>
          <TextInput style={[styles.input, { textAlign: 'center' }]} secureTextEntry placeholder="Enter Master Passkey" placeholderTextColor="#475569" value={adminPass} onChangeText={setAdminPass} />
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={() => {
            if (adminPass === '@1681Admin') onAdminUnlock();
            else { Alert.alert('Access Denied', 'Intruder logged.'); setStep('INPUT'); }
          }}>
            <Text style={styles.btnText}>Initialize System</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16', justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94A3B8', marginBottom: 35 },
  card: { width: '100%', backgroundColor: '#131C2E', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#1E293B', elevation: 10 },
  label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  helperText: { color: '#64748B', fontSize: 12, marginBottom: 15 },
  input: { backgroundColor: '#090D16', color: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20, fontSize: 16 },
  btn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  guestBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
  guestBtnText: { color: '#38BDF8', fontWeight: '600', fontSize: 14 },
  resendBtn: { marginTop: 20, alignItems: 'center' },
  resendBtnText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 }
});
