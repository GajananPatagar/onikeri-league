import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, firebaseConfig } from './firebaseConfig';

export default function App() {
  const recaptchaVerifier = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) return Alert.alert('Invalid Number');
    try {
      setLoading(true);
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationIdResult = await phoneProvider.verifyPhoneNumber(phoneNumber.trim(), recaptchaVerifier.current);
      setVerificationId(verificationIdResult);
    } catch (error) { Alert.alert('Error', error.message); } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!verificationCode || verificationCode.trim().length < 6) return Alert.alert('Invalid Code');
    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode.trim());
      const userCredential = await signInWithCredential(auth, credential);
      setUser(userCredential.user);
    } catch (error) { Alert.alert('Error', error.message); } finally { setLoading(false); }
  };

  if (user) return (<SafeAreaView style={styles.container}><Text style={styles.title}>Welcome {user.phoneNumber}!</Text></SafeAreaView>);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.innerContainer}>
          <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={firebaseConfig} attemptInvisibleVerification={true} />
          <Text style={styles.title}>Onikeri Premier League</Text>
          {!verificationId ? (
            <View>
              <TextInput style={styles.input} placeholder="+91 98765 43210" keyboardType="phone-pad" onChangeText={setPhoneNumber} />
              <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}><Text style={styles.buttonText}>Send OTP</Text></TouchableOpacity>
            </View>
          ) : (
            <View>
              <TextInput style={styles.input} placeholder="123456" keyboardType="number-pad" onChangeText={setVerificationCode} />
              <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}><Text style={styles.buttonText}>Verify OTP</Text></TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  innerContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 22, color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#161b22', borderWidth: 1, borderColor: '#30363d', borderRadius: 8, padding: 14, color: '#ffffff', marginBottom: 16 },
  button: { backgroundColor: '#1f6feb', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontWeight: '600' },
});
