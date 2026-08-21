import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function LoginScreen({ onLoginSuccess, onRequireProfile, onAdminUnlock }: any) {
  const [identifier, setIdentifier] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'OTP' | 'ADMIN'>('INPUT');
  const [serverOtp, setServerOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [adminPass, setAdminPass] = useState('');

  const handleProceed = async () => {
    const input = identifier.trim().toLowerCase();

    // SECRET ADMIN TRIGGER: UI reveals nothing, but typing this unlocks the portal
    if (input === 'admin@onikeri.com') {
      setStep('ADMIN');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(input)) {
      return Alert.alert('Invalid', 'Enter a valid 10-digit mobile number.');
    }

    setIsProcessing(true);
    const token = Math.floor(1000 + Math.random() * 9000).toString();
    setServerOtp(token);

    try {
      // REAL PRODUCTION FAST2SMS API CALL
      // Replace 'YOUR_API_KEY' with your Fast2SMS authorization key
      await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=YOUR_API_KEY&route=dlt&sender_id=ONIKER&message=163737&variables_values=${token}&flash=0&numbers=${input}`);
      
      setIsProcessing(false);
      setStep('OTP');
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Network Error', 'Failed to communicate with SMS gateway.');
    }
  };

  const verifyOtp = async () => {
    if (userOtp !== serverOtp) return Alert.alert('Error', 'Invalid OTP code.');
    
    setIsProcessing(true);
    const uid = `user_${identifier}`;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().photoURL) {
        onLoginSuccess(userDoc.data());
      } else {
        // Strict enforcement: Forces face & name setup
        onRequireProfile(identifier);
      }
    } catch (e) {
      Alert.alert('Database Error', 'Could not verify user profile.');
    }
    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="cricket" size={48} color="#38BDF8" style={{ marginBottom: 20 }} />
      
      {step === 'INPUT' && (
        <>
          <Text style={styles.label}>Enter Mobile Number</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="default" 
            placeholder="10-digit number" 
            placeholderTextColor="#475569"
            autoCapitalize="none"
            value={identifier} 
            onChangeText={setIdentifier} 
          />
          <TouchableOpacity style={styles.btn} onPress={handleProceed} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Proceed</Text>}
          </TouchableOpacity>
        </>
      )}

      {step === 'OTP' && (
        <>
          <Text style={styles.label}>Enter 4-Digit OTP</Text>
          <TextInput style={styles.input} keyboardType="number-pad" maxLength={4} value={userOtp} onChangeText={setUserOtp} />
          <TouchableOpacity style={styles.btn} onPress={verifyOtp}>
            <Text style={styles.btnText}>Verify Identity</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'ADMIN' && (
        <>
          <Text style={[styles.label, { color: '#EF4444' }]}>System Administrator</Text>
          <TextInput style={styles.input} secureTextEntry placeholder="Passkey" placeholderTextColor="#475569" value={adminPass} onChangeText={setAdminPass} />
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#EF4444' }]} onPress={() => {
            if (adminPass === '@1681Admin') onAdminUnlock();
            else Alert.alert('Denied', 'Incorrect credentials.');
          }}>
            <Text style={styles.btnText}>Initialize God Mode</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16', justifyContent: 'center', alignItems: 'center', padding: 24 },
  label: { color: '#94A3B8', alignSelf: 'flex-start', marginBottom: 8, fontWeight: '700' },
  input: { width: '100%', backgroundColor: '#131C2E', color: '#fff', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 },
  btn: { width: '100%', backgroundColor: '#0284C7', padding: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' }
});
