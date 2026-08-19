import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';

export default function App() {
  const [isLogin, setIsLogin] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState(''); 
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Age calculation helper (Must be 14+ years old)
  const isAgeValid = (dobString: string) => {
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 14;
  };

  const handleRegister = () => {
    if (!fullName.trim() || !mobileNumber.trim() || !email.trim() || !dob.trim() || !password) {
      Alert.alert('Required Fields', 'Please fill in all the details.');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(mobileNumber)) {
      Alert.alert('Invalid Mobile', 'Enter a valid 10-digit Indian phone number.');
      return;
    }

    if (!isAgeValid(dob)) {
      Alert.alert('Age Restriction', 'You must be at least 14 years old to register for the Onikeri Premier League.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Password and Confirm Password do not match.');
      return;
    }

    Alert.alert(
      'Registration Success',
      'Now proceed to Face Verification.',
      [{ text: 'OK', onPress: () => console.log('Proceeding to Face ID') }]
    );
  };

  const handleLogin = () => {
    if (!mobileNumber.trim() || !password) {
      Alert.alert('Error', 'Please enter your registered Mobile/Email and Password.');
      return;
    }
    Alert.alert('Welcome!', 'Logging into Onikeri Premier League Dashboard...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Branding */}
        <View style={styles.header}>
          <Text style={styles.badgeText}>🏏 OFFICIAL APP</Text>
          <Text style={styles.title}>Onikeri Premier League</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to join tournaments.'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, !isLogin && styles.activeTab]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, isLogin && styles.activeTab]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Form Inputs */}
        <View style={styles.formCard}>
          {!isLogin ? (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="Enter full name" placeholderTextColor="#64748B" value={fullName} onChangeText={setFullName} />

              <Text style={styles.label}>Mobile Number (+91)</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput style={styles.phoneInput} placeholder="10-digit number" placeholderTextColor="#64748B" keyboardType="numeric" maxLength={10} value={mobileNumber} onChangeText={setMobileNumber} />
              </View>

              <Text style={styles.label}>Email Address</Text>
              <TextInput style={styles.input} placeholder="example@gmail.com" placeholderTextColor="#64748B" keyboardType="email-address" value={email} onChangeText={setEmail} />

              <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="e.g. 2005-08-15" placeholderTextColor="#64748B" value={dob} onChangeText={setDob} />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female'].map((item) => (
                  <TouchableOpacity key={item} style={[styles.genderBtn, gender === item && styles.activeGenderBtn]} onPress={() => setGender(item)}>
                    <Text style={[styles.genderText, gender === item && styles.activeGenderText]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#64748B" secureTextEntry value={password} onChangeText={setPassword} />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput style={styles.input} placeholder="Confirm your password" placeholderTextColor="#64748B" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
                <Text style={styles.buttonText}>Continue to Face Verification</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Registered Mobile or Email</Text>
              <TextInput style={styles.input} placeholder="Enter mobile or email" placeholderTextColor="#64748B" value={mobileNumber} onChangeText={setMobileNumber} />

              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="Enter password" placeholderTextColor="#64748B" secureTextEntry value={password} onChangeText={setPassword} />

              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 25 },
  badgeText: { color: '#38BDF8', fontWeight: '700', fontSize: 12, letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: '#F8FAFC', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#0284C7' },
  tabText: { color: '#94A3B8', fontWeight: '600' },
  activeTabText: { color: '#FFFFFF', fontWeight: '700' },
  formCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' },
  label: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#F8FAFC', borderWidth: 1, borderColor: '#334155', fontSize: 14 },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  countryCode: { color: '#38BDF8', fontWeight: '700', paddingLeft: 14, paddingRight: 8 },
  phoneInput: { flex: 1, paddingVertical: 12, paddingRight: 14, color: '#F8FAFC', fontSize: 14 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  activeGenderBtn: { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)' },
  genderText: { color: '#94A3B8', fontWeight: '600' },
  activeGenderText: { color: '#38BDF8', fontWeight: '700' },
  primaryButton: { backgroundColor: '#0284C7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

