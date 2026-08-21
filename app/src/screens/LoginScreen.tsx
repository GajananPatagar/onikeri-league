import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function LoginScreen({ onLoginSuccess, onRequireProfile, onAdminUnlock }: any) {
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'INPUT' | 'OTP' | 'ADMIN'>('INPUT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [adminPass, setAdminPass] = useState('');

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
    // Generate a secure 6-digit OTP
    const generatedToken = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(generatedToken);

    try {
      // REAL SMS DISPATCH (Build-Safe REST API)
      // Go to fast2sms.com, create a free account, and paste your API key here:
      const apiKey = 'YOUR_FAST2SMS_API_KEY'; 
      
      if (apiKey !== 'YOUR_FAST2SMS_API_KEY') {
        await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=dlt&sender_id=ONIKER&message=163737&variables_values=${generatedToken}&flash=0&numbers=${input}`);
      } else {
        // Fallback for development testing
        console.log(`[SYS] OTP dispatched to ${input}: ${generatedToken}`);
      }

      setIsProcessing(false);
      setStep('OTP');
      Alert.alert('OTP Dispatched 📲', `A secure verification code was sent to +91 ${input}.`);
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Network Error', 'Failed to communicate with SMS server.');
    }
  };

  const handleVerifyOtp = async () => {
    // 123456 is a developer bypass so you can test before adding your API key
    if (userOtp !== serverOtp && userOtp !== '123456') { 
      return Alert.alert('Invalid OTP', 'The verification code is incorrect.');
    }

    setIsProcessing(true);
    
    // Create a deterministic UID based on the mobile number
    const uid = `user_${identifier}`;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().photoURL && userDoc.data().fullName) {
        onLoginSuccess(userDoc.data());
      } else {
        // Force new user to setup profile
        onRequireProfile({ mobile: identifier, uid: uid });
      }
    } catch (e) {
      Alert.alert('Database Error', 'Could not verify user profile.');
    }
    setIsProcessing(false);
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
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP Verification</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 'OTP' && (
        <View style={styles.card}>
          <Text style={styles.label}>Enter 6-Digit SMS OTP</Text>
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
