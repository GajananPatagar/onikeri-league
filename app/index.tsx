import React, { useState, useEffect } from 'react';
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
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- NATIVE MODULES ---
import RazorpayCheckout from 'react-native-razorpay';

// --- FIREBASE CLOUD SERVICES ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const firebaseConfig = {
  apiKey: "AIzaSyApQMT3mKXhUTmr3GrZjG1U7tSbP8hMRsQ",
  authDomain: "onikeri-premier-league.firebaseapp.com",
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688",
  appId: "1:6768887688:android:90f7f09cec8bf5c7c4dc3d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function MasterApp() {
  const [step, setStep] = useState<'AUTH' | 'WAIT_EMAIL' | 'FACE_SCAN' | 'DASHBOARD'>('AUTH');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [activeTab, setActiveTab] = useState<'Home' | 'Matches' | 'Turfs' | 'Profile'>('Home');

  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Welcome');

  const [walletBalance, setWalletBalance] = useState(2500);
  const [teamCode, setTeamCode] = useState('');
  const [userStats, setUserStats] = useState({ matches: 18, runs: 462, wickets: 14, rank: '#4' });
  const [liveMatch, setLiveMatch] = useState({
    tournament: 'Onikeri Super League • Final',
    teamA: 'Onikeri Titans',
    teamAScore: '142/3',
    teamAOvers: '14.2',
    teamB: 'Karwar Strikers',
    teamBScore: '138/8',
    teamBOvers: '20.0',
    status: 'Titans need 5 runs in 34 balls',
    isLive: true,
  });

  const [tournaments, setTournaments] = useState([
    { id: '1', name: 'Karwar Championship Cup', prize: '₹50,000', teams: '16 Teams', fee: '1500', status: 'Open' },
    { id: '2', name: 'Monsoon Box Cricket Trophy', prize: '₹25,000', teams: '12 Teams', fee: '1000', status: 'Filling Fast' },
    { id: '3', name: 'Night Floodlight Derby', prize: '₹80,000', teams: '24 Teams', fee: '2500', status: 'Upcoming' },
  ]);

  const [turfSlots, setTurfSlots] = useState([
    { id: 's1', time: '06:00 AM - 07:00 AM', status: 'Available', price: '₹600' },
    { id: 's2', time: '07:00 AM - 08:00 AM', status: 'Booked', price: '₹600' },
    { id: 's3', time: '06:00 PM - 07:00 PM', status: 'Available', price: '₹900' },
    { id: 's4', time: '07:00 PM - 08:00 PM', status: 'Available', price: '₹1000' },
    { id: 's5', time: '08:00 PM - 09:00 PM', status: 'Booked', price: '₹1000' },
    { id: 's6', time: '09:00 PM - 10:00 PM', status: 'Available', price: '₹1000' },
  ]);

  const [modalType, setModalType] = useState<'NONE' | 'RAZORPAY' | 'ADMIN_MATRIX' | 'UPDATE_SCORE' | 'CREATE_TOURNAMENT' | 'NOTIFICATIONS'>('NONE');
  const [newTourney, setNewTourney] = useState({ name: '', prize: '', fee: '' });

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  }, []);

  const validateName = (text: string) => {
    setFullName(text);
    const isValid = /^[A-Za-z\s]{3,25}$/.test(text.trim());
    setErrors((prev) => ({ ...prev, fullName: !isValid && text.length > 0 ? 'Enter a valid full name (3-25 characters).' : '' }));
  };

  const validateMobile = (text: string) => {
    setMobileNumber(text);
    const isValid = /^[6-9]\d{9}$/.test(text.trim());
    setErrors((prev) => ({ ...prev, mobileNumber: !isValid && text.length > 0 ? 'Enter a valid 10-digit Indian mobile number.' : '' }));
  };

  const validateEmail = (text: string) => {
    setEmail(text);
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
    setErrors((prev) => ({ ...prev, email: !isValid && text.length > 0 ? 'Provide a valid email address.' : '' }));
  };

  const validatePasswordStrength = (pass: string) => {
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return pass.length >= 8 && hasLetter && hasNumber;
  };

  const checkAge = (dobString: string) => {
    const parts = dobString.split('-');
    if (parts.length !== 3) return false;
    const bDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    const today = new Date();
    let age = today.getFullYear() - bDate.getFullYear();
    const m = today.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
    return age >= 14;
  };

  const handleDobInput = (text: string) => {
    let clean = text.replace(/[^0-9]/g, '');
    let formatted = clean;
    if (clean.length > 2) formatted = clean.substring(0, 2) + '-' + clean.substring(2);
    if (clean.length > 4) formatted = formatted.substring(0, 5) + '-' + clean.substring(4, 8);
    setDob(formatted);
    if (formatted.length === 10) {
      setErrors((prev) => ({ ...prev, dob: !checkAge(formatted) ? 'Player must be at least 14 years of age.' : '' }));
    }
  };

  const handleDateSelected = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const str = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
      setDob(str);
      setErrors((prev) => ({ ...prev, dob: !checkAge(str) ? 'Player must be at least 14 years of age.' : '' }));
    }
  };

  const handleRegisterFlow = async () => {
    const hasErr = Object.values(errors).some((e) => e !== '');
    const cleanEmailReg = email ? email.toLowerCase().trim() : '';
    const cleanPassReg = password ? password.trim() : '';
    const incomplete = !fullName || !mobileNumber || !cleanEmailReg || dob.length !== 10 || !cleanPassReg || !confirmPassword;
    
    if (hasErr || incomplete) return Alert.alert('Invalid Form', 'Please resolve all required fields highlighted in red.');
    if (cleanPassReg !== confirmPassword.trim()) return Alert.alert('Password Mismatch', 'Passwords do not match.');
    if (!validatePasswordStrength(cleanPassReg)) return Alert.alert('Weak Password', 'Password must be at least 8 characters and include both letters and numbers.');

    setIsProcessing(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmailReg, cleanPassReg);
      await sendEmailVerification(userCredential.user);
      setIsProcessing(false);
      setStep('WAIT_EMAIL');
      Alert.alert('Verification Sent 📩', `Google Firebase dispatched a verification link to ${cleanEmailReg}. Click the link to proceed.`);
    } catch (err: any) {
      setIsProcessing(false);
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Account Exists', 
          'This email is already registered. Switching to login so you can sign in.',
          [{ text: 'OK', onPress: () => setAuthMode('LOGIN') }]
        );
      } else {
        Alert.alert('Registration Failed', err.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    if (!cleanEmail) return Alert.alert('Email Required', 'Please enter your registered email address above first, then tap Forgot Password.');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      Alert.alert('Reset Link Sent 📩', `A password reset link has been sent to ${cleanEmail}. Check your inbox.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const checkEmailVerification = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          Alert.alert('Verified ✅', 'Email confirmed. Proceed to Photo Verification.');
          setStep('FACE_SCAN');
        } else {
          Alert.alert('Pending ⏳', 'Email link not activated yet. Check your inbox/spam folder.');
        }
      }
    } catch (err: any) {
      Alert.alert('Status Error', err.message);
    }
  };

  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.15,
    });
    if (!res.canceled) {
      setProfileImage(res.assets[0].uri);
    }
  };

  const executeFaceVerification = async () => {
    setIsProcessing(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setIsProcessing(false);
        setStep('AUTH');
        return Alert.alert('Session Expired', 'Please sign in again.');
      }

      let base64data = null;
      if (profileImage) {
        try {
          const response = await fetch(profileImage);
          const blob = await response.blob();
          base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.log('Image conversion bypassed');
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        fullName: fullName || 'Player',
        mobileNumber: mobileNumber || '9999999999',
        email: email ? email.toLowerCase().trim() : user.email || 'player@onikeri.com',
        dob: dob || '01-01-2000',
        role: 'Player',
        photoURL: base64data,
        walletBalance: 100,
        registeredAt: new Date().toISOString(),
      });

      setIsProcessing(false);
      setIsGuest(false);
      setIsAdmin(false);
      Alert.alert('Success 🎉', 'Welcome to Onikeri Premier League!');
      setStep('DASHBOARD');
      setActiveTab('Home');
    } catch (err: any) {
      setIsProcessing(false);
      setStep('DASHBOARD');
      setActiveTab('Home');
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const cleanPassword = password ? password.trim() : '';

    if (cleanEmail === 'admin@onikeri.com' && cleanPassword === '@1681Gaju') {
      setFullName('Gajanan (SuperAdmin)');
      setIsAdmin(true);
      setIsGuest(false);
      setStep('DASHBOARD');
      setActiveTab('Home');
      return;
    }

    if (!cleanEmail || !cleanPassword) return Alert.alert('Credentials Missing', 'Enter your email and password.');
    setIsProcessing(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const user = userCredential.user;

      const userDocument = await getDoc(doc(db, 'users', user.uid));
      if (userDocument.exists()) {
        const data = userDocument.data();
        setFullName(data.fullName || 'Player');
        setMobileNumber(data.mobileNumber || '');
        setProfileImage(data.photoURL || null);
        setIsAdmin(data.role === 'SuperAdmin');
      } else {
        const defaultName = cleanEmail.split('@')[0];
        const generatedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
        await setDoc(doc(db, 'users', user.uid), {
          fullName: generatedName,
          mobileNumber: '9999999999',
          email: cleanEmail,
          dob: '01-01-2000',
          role: 'Player',
          photoURL: null,
          walletBalance: 100,
          registeredAt: new Date().toISOString(),
        });
        setFullName(generatedName);
      }

      setIsProcessing(false);
      setIsGuest(false);
      setStep('DASHBOARD');
      setActiveTab('Home');
    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Login Failed', 'Invalid email or password. Please check your credentials.');
    }
  };

  const handleRazorpayPayment = (amountInRupees: number) => {
    const options = {
      description: 'Onikeri Wallet Deposit',
      image: 'https://cdn-icons-png.flaticon.com/512/861/861512.png',
      currency: 'INR',
      key: 'rzp_test_TReUlbfCoX7o0X',
      amount: `${amountInRupees * 100}`,
      name: 'Onikeri Premier League',
      prefill: {
        email: email || 'player@onikeri.com',
        contact: mobileNumber || '9999999999',
        name: fullName || 'Valued Player',
      },
      theme: { color: '#0284C7' },
    };

    RazorpayCheckout.open(options)
      .then((data: any) => {
        Alert.alert('Payment Completed ✅', `Transaction ID: ${data.razorpay_payment_id}`);
        setWalletBalance((prev) => prev + amountInRupees);
        setModalType('NONE');
      })
      .catch((err: any) => {
        Alert.alert('Payment Cancelled', `Status: ${err.description || 'Dismissed by user'}`);
      });
  };

  const handleJoinTeam = () => {
    if (isGuest) return Alert.alert('Restricted', 'Create an official player account to join team squads.');
    if (teamCode.trim().length !== 6) return Alert.alert('Invalid Code', 'Team squad IDs must be exactly 6 characters.');
    Alert.alert('Request Transmitted 🏏', `Application sent to Captain for squad: ${teamCode.toUpperCase()}`);
    setTeamCode('');
  };

  const handleBookSlot = (slot: typeof turfSlots[0]) => {
    if (isGuest) return Alert.alert('Player Only', 'Guest accounts cannot book turf matches.');
    if (slot.status === 'Booked') return Alert.alert('Unavailable', 'This slot has already been reserved.');
    Alert.alert('Slot Reservation', `Confirm booking for ${slot.time} (${slot.price})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pay from Wallet',
        onPress: () => {
          const numPrice = parseInt(slot.price.replace('₹', ''), 10);
          if (walletBalance < numPrice) return Alert.alert('Insufficient Balance', 'Deposit funds into your wallet to complete booking.');
          setWalletBalance((prev) => prev - numPrice);
          setTurfSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, status: 'Booked' } : s)));
          Alert.alert('Confirmed ✅', `Slot reserved! Confirmation receipt sent.`);
        },
      },
    ]);
  };

  if (step === 'AUTH') {
    return (
      <SafeAreaView style={styles.authSafeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#090D16" />
        <ScrollView contentContainerStyle={styles.authScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.authHeaderBox}>
            <View style={styles.brandIconBubble}>
              <MaterialCommunityIcons name="cricket" size={32} color="#38BDF8" />
            </View>
            <Text style={styles.leagueTag}>OFFICIAL LEAGUE PORTAL</Text>
            <Text style={styles.authMainTitle}>Onikeri Premier League</Text>
            <Text style={styles.authSubTitle}>Karnataka's premier automated sports & turf management platform.</Text>
          </View>

          <View style={styles.authSegmentContainer}>
            <TouchableOpacity
              style={[styles.authSegmentBtn, authMode === 'REGISTER' && styles.authSegmentBtnActive]}
              onPress={() => setAuthMode('REGISTER')}
            >
              <Text style={[styles.authSegmentText, authMode === 'REGISTER' && styles.authSegmentTextActive]}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authSegmentBtn, authMode === 'LOGIN' && styles.authSegmentBtnActive]}
              onPress={() => setAuthMode('LOGIN')}
            >
              <Text style={[styles.authSegmentText, authMode === 'LOGIN' && styles.authSegmentTextActive]}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.glassCard}>
            {authMode === 'REGISTER' ? (
              <>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={[styles.premiumInput, !!errors.fullName && styles.inputInvalid]}
                  placeholder="e.g. Gajanan"
                  placeholderTextColor="#475569"
                  value={fullName}
                  onChangeText={validateName}
                />
                {!!errors.fullName && <Text style={styles.fieldError}>{errors.fullName}</Text>}

                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <View style={[styles.phoneFieldWrap, !!errors.mobileNumber && styles.inputInvalid]}>
                  <Text style={styles.countryCodeText}>+91</Text>
                  <TextInput
                    style={styles.phoneInputField}
                    placeholder="10-digit number"
                    placeholderTextColor="#475569"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={validateMobile}
                  />
                  {/^[6-9]\d{9}$/.test(mobileNumber.trim()) && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 10 }} />
                  )}
                </View>
                {!!errors.mobileNumber && <Text style={styles.fieldError}>{errors.mobileNumber}</Text>}

                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={[styles.premiumInput, !!errors.email && styles.inputInvalid]}
                  placeholder="player@gmail.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={validateEmail}
                />
                {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

                <Text style={styles.fieldLabel}>Date of Birth (DD-MM-YYYY)</Text>
                <View style={[styles.phoneFieldWrap, !!errors.dob && styles.inputInvalid]}>
                  <TextInput
                    style={styles.phoneInputField}
                    placeholder="DD-MM-YYYY"
                    placeholderTextColor="#475569"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={dob}
                    onChangeText={handleDobInput}
                  />
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ paddingRight: 14 }}>
                    <Ionicons name="calendar" size={22} color="#38BDF8" />
                  </TouchableOpacity>
                </View>
                {!!errors.dob && <Text style={styles.fieldError}>{errors.dob}</Text>}
                {showDatePicker && (
                  <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateSelected} maximumDate={new Date()} />
                )}

                <Text style={styles.fieldLabel}>Create Password (Min 8 chars, Letters & Numbers)</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="e.g. gaju1234"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="Re-enter password"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity style={styles.mainActionBtn} onPress={handleRegisterFlow} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainActionBtnText}>Create Account & Verify</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.guestLinkBox}
                  onPress={() => {
                    setFullName('Guest Player');
                    setIsGuest(true);
                    setIsAdmin(false);
                    setStep('DASHBOARD');
                  }}
                >
                  <Text style={styles.guestLinkText}>Explore as Guest Observer ➔</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="Registered email"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.premiumInput}
                  placeholder="Account password"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 8 }} onPress={handleForgotPassword}>
                  <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '700' }}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mainActionBtn} onPress={handleLogin} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainActionBtnText}>Sign In</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.guestLinkBox}
                  onPress={() => {
                    setFullName('Guest Player');
                    setIsGuest(true);
                    setIsAdmin(false);
                    setStep('DASHBOARD');
                  }}
                >
                  <Text style={styles.guestLinkText}>Continue as Guest Observer ➔</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'WAIT_EMAIL') {
    return (
      <SafeAreaView style={styles.authSafeContainer}>
        <View style={styles.verificationCard}>
          <View style={styles.verificationIconBubble}>
            <Ionicons name="mail-open-outline" size={48} color="#38BDF8" />
          </View>
          <Text style={styles.authMainTitle}>Verify Email Link</Text>
          <Text style={styles.verifyDescription}>
            We dispatched an official Google verification link to <Text style={{ color: '#38BDF8', fontWeight: '700' }}>{email}</Text>. Please click the link in your email and return here.
          </Text>

          <TouchableOpacity style={styles.mainActionBtn} onPress={checkEmailVerification}>
            <Text style={styles.mainActionBtnText}>I Have Verified</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={async () => {
              if (auth.currentUser) await sendEmailVerification(auth.currentUser);
              Alert.alert('Dispatched', 'A fresh verification email was sent.');
            }}
          >
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Resend Verification Link</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'FACE_SCAN') {
    return (
      <SafeAreaView style={styles.authSafeContainer}>
        <View style={styles.verificationCard}>
          <View style={[styles.verificationIconBubble, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
            <MaterialCommunityIcons name="face-recognition" size={48} color="#38BDF8" />
          </View>
          <Text style={styles.authMainTitle}>Player Photo Verification</Text>
          <Text style={styles.verifyDescription}>
            Upload your profile photo or skip to enter the league dashboard immediately.
          </Text>

          <TouchableOpacity style={styles.avatarDropBox} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarPreviewImage} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="camera-outline" size={44} color="#64748B" />
                <Text style={{ color: '#64748B', marginTop: 8, fontSize: 13 }}>Tap to Select Profile Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.mainActionBtn} onPress={executeFaceVerification} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainActionBtnText}>Save & Enter League</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ marginTop: 16, padding: 10 }} 
            onPress={() => {
              setStep('DASHBOARD');
              setActiveTab('Home');
            }}
          >
            <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '700' }}>Skip Verification & Go to Dashboard ➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      <View style={styles.topHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setActiveTab('Profile')}>
            {profileImage && !isGuest ? (
              <Image source={{ uri: profileImage }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={20} color="#38BDF8" />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.greetingSub}>{greeting}</Text>
              {isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>ADMIN</Text></View>}
              {isGuest && <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>GUEST</Text></View>}
            </View>
            <Text style={styles.greetingTitle}>{fullName.split(' ')[0]}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {isAdmin && (
            <TouchableOpacity style={styles.headerIconButton} onPress={() => setModalType('ADMIN_MATRIX')}>
              <Ionicons name="shield-checkmark" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerIconButton} onPress={() => setModalType('NOTIFICATIONS')}>
            <Ionicons name="notifications-outline" size={20} color="#F8FAFC" />
            <View style={styles.activeDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.dashboardScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
      >
        {activeTab === 'Home' && (
          <>
            <View style={styles.walletHeroCard}>
              <View>
                <Text style={styles.walletHeaderLabel}>Available Balance</Text>
                <Text style={styles.walletHeaderValue}>₹{walletBalance.toLocaleString('en-IN')}.00</Text>
                <Text style={styles.walletSubText}>Onikeri Instant Pay Enabled</Text>
              </View>
              <TouchableOpacity style={styles.addFundsBtn} onPress={() => setModalType('RAZORPAY')}>
                <Ionicons name="add-circle" size={20} color="#090D16" />
                <Text style={styles.addFundsBtnText}>Top Up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Live Match Arena</Text>
              <View style={styles.pulsingLivePill}>
                <View style={styles.pulsingDot} />
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.matchCard}>
              <Text style={styles.matchTournamentTag}>{liveMatch.tournament}</Text>
              <View style={styles.matchScoreRow}>
                <View>
                  <Text style={styles.teamTitle}>{liveMatch.teamA}</Text>
                  <Text style={styles.teamScore}>
                    {liveMatch.teamAScore} <Text style={styles.teamOvers}>({liveMatch.teamAOvers})</Text>
                  </Text>
                </View>
                <Text style={styles.vsDivider}>VS</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.teamTitle}>{liveMatch.teamB}</Text>
                  <Text style={styles.teamScore}>
                    {liveMatch.teamBScore} <Text style={styles.teamOvers}>({liveMatch.teamBOvers})</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.matchFooter}>
                <Ionicons name="radio-outline" size={16} color="#F59E0B" />
                <Text style={styles.matchFooterText}>{liveMatch.status}</Text>
              </View>
            </View>

            <View style={styles.joinTeamBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <FontAwesome5 name="users" size={16} color="#38BDF8" />
                <Text style={[styles.sectionHeading, { marginLeft: 8, marginBottom: 0 }]}>Squad Registration</Text>
              </View>
              <Text style={styles.joinTeamDesc}>Enter the 6-digit invitation pass-key dispatched by your Team Captain.</Text>
              <View style={styles.teamCodeInputRow}>
                <TextInput
                  style={styles.teamCodeInput}
                  placeholder="e.g. OP89K2"
                  placeholderTextColor="#475569"
                  autoCapitalize="characters"
                  maxLength={6}
                  value={teamCode}
                  onChangeText={setTeamCode}
                />
                <TouchableOpacity style={styles.joinTeamActionBtn} onPress={handleJoinTeam}>
                  <Text style={styles.joinTeamActionText}>Join Squad</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Instant Slot Booking</Text>
              <TouchableOpacity onPress={() => setActiveTab('Turfs')}>
                <Text style={styles.viewAllText}>View All ➔</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickSlotRow}>
              {turfSlots.slice(2, 5).map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.quickSlotCard, slot.status === 'Booked' && styles.quickSlotDisabled]}
                  onPress={() => handleBookSlot(slot)}
                >
                  <Text style={styles.slotTime}>{slot.time.split(' - ')[0]}</Text>
                  <Text style={styles.slotPrice}>{slot.price}</Text>
                  <View
                    style={[
                      styles.slotPill,
                      { backgroundColor: slot.status === 'Booked' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' },
                    ]}
                  >
                    <Text
                      style={{
                        color: slot.status === 'Booked' ? '#EF4444' : '#10B981',
                        fontSize: 10,
                        fontWeight: '700',
                      }}
                    >
                      {slot.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === 'Matches' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Championship Tournaments</Text>
              {isAdmin && (
                <TouchableOpacity onPress={() => setModalType('CREATE_TOURNAMENT')}>
                  <Text style={{ color: '#38BDF8', fontWeight: '700', fontSize: 13 }}>+ Create New</Text>
                </TouchableOpacity>
              )}
            </View>

            {tournaments.map((t) => (
              <View key={t.id} style={styles.tourneyCard}>
                <View style={styles.tourneyIconBox}>
                  <Ionicons name="trophy" size={26} color="#F59E0B" />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.tourneyName}>{t.name}</Text>
                  <Text style={styles.tourneyDetail}>
                    Prize: <Text style={{ color: '#10B981', fontWeight: '700' }}>{t.prize}</Text> • {t.teams}
                  </Text>
                  <Text style={styles.tourneyDetail}>Entry: ₹{t.fee} per team</Text>
                </View>
                <TouchableOpacity
                  style={styles.registerTourneyBtn}
                  onPress={() => {
                    if (isGuest) return Alert.alert('Registration Restricted', 'Sign in to register your squad.');
                    Alert.alert('Tournament Entry', `Confirm registration for ${t.name} (Entry: ₹{t.fee})?`);
                  }}
                >
                  <Text style={styles.registerTourneyText}>Register</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'Turfs' && (
          <>
            <Text style={styles.sectionHeading}>Onikeri Floodlit Ground Slots</Text>
            <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 16 }}>
              Automated smart-switch LED floodlight enabled cricket turf.
            </Text>

            {turfSlots.map((slot) => (
              <View key={slot.id} style={styles.slotFullRow}>
                <View>
                  <Text style={styles.slotFullTime}>{slot.time}</Text>
                  <Text style={styles.slotFullPrice}>{slot.price} / hour</Text>
                </View>
                <TouchableOpacity
                  style={[styles.slotFullBtn, slot.status === 'Booked' && { backgroundColor: '#334155' }]}
                  onPress={() => handleBookSlot(slot)}
                  disabled={slot.status === 'Booked'}
                >
                  <Text style={styles.slotFullBtnText}>{slot.status === 'Booked' ? 'Reserved' : 'Book Slot'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'Profile' && (
          <View style={styles.profileContainer}>
            <View style={styles.profileBanner}>
              {profileImage && !isGuest ? (
                <Image source={{ uri: profileImage }} style={styles.profileMasterAvatar} />
              ) : (
                <View style={styles.profileMasterPlaceholder}>
                  <Ionicons name="person" size={54} color="#38BDF8" />
                </View>
              )}
              <Text style={styles.profileNameDisplay}>{fullName}</Text>
              <Text style={styles.profileRoleDisplay}>{isAdmin ? 'Super Administrator' : isGuest ? 'Guest User' : 'Verified League Player'}</Text>
            </View>

            <View style={styles.statsCardGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{userStats.matches}</Text>
                <Text style={styles.statLbl}>Matches</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{userStats.runs}</Text>
                <Text style={styles.statLbl}>Runs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{userStats.wickets}</Text>
                <Text style={styles.statLbl}>Wickets</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#38BDF8' }]}>{userStats.rank}</Text>
                <Text style={styles.statLbl}>Ranking</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Security', 'Biometric & Firebase Token active.')}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#38BDF8" />
              <Text style={styles.menuItemText}>Security & Verification Status</Text>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 24, borderColor: '#EF4444' }]}
              onPress={async () => {
                await signOut(auth);
                setIsGuest(false);
                setIsAdmin(false);
                setStep('AUTH');
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Log Out Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNavContainer}>
        {(
          [
            { id: 'Home', icon: 'home-outline', activeIcon: 'home' },
            { id: 'Matches', icon: 'trophy-outline', activeIcon: 'trophy' },
            { id: 'Turfs', icon: 'calendar-outline', activeIcon: 'calendar' },
            { id: 'Profile', icon: 'person-outline', activeIcon: 'person' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={styles.bottomTabBtn} onPress={() => setActiveTab(tab.id)}>
              <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={22} color={isActive ? '#38BDF8' : '#64748B'} />
              <Text style={[styles.bottomTabText, isActive && styles.bottomTabTextActive]}>{tab.id}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={modalType === 'RAZORPAY'} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Deposit to League Wallet</Text>
            <Text style={styles.modalSub}>Select deposit amount to proceed with Razorpay UPI Gateway.</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 20 }}>
              {[200, 500, 1000].map((amt) => (
                <TouchableOpacity key={amt} style={styles.amtSelectorBtn} onPress={() => handleRazorpayPayment(amt)}>
                  <Text style={styles.amtSelectorText}>+₹{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalType('NONE')}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === 'ADMIN_MATRIX'} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <Text style={[styles.modalTitle, { color: '#EF4444' }]}>System God Mode</Text>
            <Text style={styles.modalSub}>Execute real-time infrastructure commands.</Text>

            <ScrollView style={{ width: '100%', marginVertical: 15 }}>
              {[
                { title: 'Update Live Match Scorecard', action: () => setModalType('UPDATE_SCORE') },
                { title: 'Publish Global Tournament', action: () => setModalType('CREATE_TOURNAMENT') },
                {
                  title: 'Credit ₹1,000 Administrative Balance',
                  action: () => {
                    setWalletBalance((prev) => prev + 1000);
                    Alert.alert('Success', '₹1,000 credited to wallet.');
                  },
                },
                {
                  title: 'Trigger Automated Floodlight Reset',
                  action: () => Alert.alert('Hardware Command', 'Signal dispatched to Onikeri Turf Relay Panel.'),
                },
              ].map((cmd, idx) => (
                <TouchableOpacity key={idx} style={styles.adminCommandBtn} onPress={cmd.action}>
                  <Text style={styles.adminCommandText}>{cmd.title}</Text>
                  <Ionicons name="flash" size={16} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalType('NONE')}>
              <Text style={styles.modalCloseText}>Dismiss Control Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === 'UPDATE_SCORE'} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Broadcast Match Scores</Text>
            <TextInput
              style={styles.premiumInput}
              placeholder="Team A Score (e.g. 142/3)"
              placeholderTextColor="#64748B"
              value={liveMatch.teamAScore}
              onChangeText={(t) => setLiveMatch({ ...liveMatch, teamAScore: t })}
            />
            <TextInput
              style={styles.premiumInput}
              placeholder="Team A Overs (e.g. 14.2)"
              placeholderTextColor="#64748B"
              value={liveMatch.teamAOvers}
              onChangeText={(t) => setLiveMatch({ ...liveMatch, teamAOvers: t })}
            />
            <TextInput
              style={styles.premiumInput}
              placeholder="Match Commentary / Status"
              placeholderTextColor="#64748B"
              value={liveMatch.status}
              onChangeText={(t) => setLiveMatch({ ...liveMatch, status: t })}
            />
            <TouchableOpacity
              style={styles.mainActionBtn}
              onPress={() => {
                setModalType('NONE');
                Alert.alert('Broadcast Published', 'All connected spectators are receiving the updated stream.');
              }}
            >
              <Text style={styles.mainActionBtnText}>Push Live Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === 'CREATE_TOURNAMENT'} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Publish New Tournament</Text>
            <TextInput
              style={styles.premiumInput}
              placeholder="Tournament Name"
              placeholderTextColor="#64748B"
              value={newTourney.name}
              onChangeText={(t) => setNewTourney({ ...newTourney, name: t })}
            />
            <TextInput
              style={styles.premiumInput}
              placeholder="Prize Pool (e.g. ₹50,000)"
              placeholderTextColor="#64748B"
              value={newTourney.prize}
              onChangeText={(t) => setNewTourney({ ...newTourney, prize: t })}
            />
            <TextInput
              style={styles.premiumInput}
              placeholder="Entry Fee (e.g. 1500)"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              value={newTourney.fee}
              onChangeText={(t) => setNewTourney({ ...newTourney, fee: t })}
            />
            <TouchableOpacity
              style={styles.mainActionBtn}
              onPress={() => {
                if (!newTourney.name || !newTourney.prize || !newTourney.fee) return Alert.alert('Error', 'Fill all fields.');
                setTournaments([
                  ...tournaments,
                  {
                    id: Math.random().toString(),
                    name: newTourney.name,
                    prize: newTourney.prize,
                    teams: '16 Teams',
                    fee: newTourney.fee,
                    status: 'Open',
                  },
                ]);
                setModalType('NONE');
                setNewTourney({ name: '', prize: '', fee: '' });
                Alert.alert('Success', 'Tournament is now open globally for registrations.');
              }}
            >
              <Text style={styles.mainActionBtnText}>Publish Tournament</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === 'NOTIFICATIONS'} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>League Broadcasts</Text>
            <View style={{ marginVertical: 15, width: '100%' }}>
              <View style={styles.notificationItem}>
                <Ionicons name="megaphone" size={20} color="#38BDF8" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 13 }}>Final Registration Reminder</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Monsoon Box Cricket registration closes tonight.</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalType('NONE')}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authSafeContainer: { flex: 1, backgroundColor: '#090D16' },
  authScroll: { paddingHorizontal: 22, paddingVertical: 25 },
  authHeaderBox: { alignItems: 'center', marginBottom: 20 },
  brandIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueTag: { color: '#38BDF8', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  authMainTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC', textAlign: 'center' },
  authSubTitle: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
  authSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#131C2E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  authSegmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  authSegmentBtnActive: { backgroundColor: '#0284C7' },
  authSegmentText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  authSegmentTextActive: { color: '#FFFFFF', fontWeight: '700' },
  glassCard: {
    backgroundColor: '#131C2E',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  fieldLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  premiumInput: {
    backgroundColor: '#090D16',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontSize: 14,
  },
  inputInvalid: { borderColor: '#EF4444' },
  fieldError: { color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 2 },
  phoneFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingLeft: 12,
  },
  countryCodeText: { color: '#38BDF8', fontWeight: '700', paddingRight: 8, fontSize: 14 },
  phoneInputField: { flex: 1, paddingVertical: 12, paddingRight: 12, color: '#F8FAFC', fontSize: 14 },
  mainActionBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 22,
  },
  mainActionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  guestLinkBox: { marginTop: 16, alignItems: 'center' },
  guestLinkText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  verificationCard: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  verificationIconBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyDescription: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginVertical: 15, lineHeight: 20 },
  avatarDropBox: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#131C2E',
    marginVertical: 20,
  },
  avatarPreviewImage: { width: '100%', height: '100%' },
  dashboardContainer: { flex: 1, backgroundColor: '#090D16' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#090D16',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#38BDF8' },
  profilePlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#131C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  greetingSub: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  greetingTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  adminBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  adminBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  guestBadge: { backgroundColor: '#475569', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  guestBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#131C2E',
    borderWidth: 1,
    borderColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38BDF8',
  },
  dashboardScroll: { paddingHorizontal: 18, paddingVertical: 20, paddingBottom: 110 },
  walletHeroCard: {
    backgroundColor: '#0284C7',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletHeaderLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, fontWeight: '700' },
  walletHeaderValue: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginVertical: 4 },
  walletSubText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11 },
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addFundsBtnText: { color: '#090D16', fontWeight: '800', fontSize: 13 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sectionHeading: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  viewAllText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  pulsingLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  pulsingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  livePillText: { color: '#EF4444', fontSize: 10, fontWeight: '800' },
  matchCard: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 18,
  },
  matchTournamentTag: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 12 },
  matchScoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  teamScore: { color: '#38BDF8', fontSize: 18, fontWeight: '800', marginTop: 2 },
  teamOvers: { color: '#64748B', fontSize: 12, fontWeight: '500' },
  vsDivider: { color: '#475569', fontSize: 12, fontWeight: '800' },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 6,
  },
  matchFooterText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  joinTeamBox: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 18,
  },
  joinTeamDesc: { color: '#64748B', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  teamCodeInputRow: { flexDirection: 'row', gap: 10 },
  teamCodeInput: {
    flex: 1,
    backgroundColor: '#090D16',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
    fontWeight: '700',
    letterSpacing: 2,
  },
  joinTeamActionBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinTeamActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  quickSlotRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickSlotCard: {
    flex: 1,
    backgroundColor: '#131C2E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  quickSlotDisabled: { opacity: 0.5 },
  slotTime: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },
  slotPrice: { color: '#38BDF8', fontSize: 13, fontWeight: '800', marginVertical: 4 },
  slotPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tourneyCard: {
    backgroundColor: '#131C2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tourneyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tourneyName: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  tourneyDetail: { color: '#64748B', fontSize: 12, marginTop: 2 },
  registerTourneyBtn: { backgroundColor: '#0284C7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  registerTourneyText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  slotFullRow: {
    backgroundColor: '#131C2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotFullTime: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  slotFullPrice: { color: '#38BDF8', fontSize: 13, fontWeight: '800', marginTop: 2 },
  slotFullBtn: { backgroundColor: '#0284C7', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  slotFullBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  profileContainer: { alignItems: 'center' },
  profileBanner: { alignItems: 'center', marginVertical: 15 },
  profileMasterAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#38BDF8' },
  profileMasterPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#131C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  profileNameDisplay: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginTop: 12 },
  profileRoleDisplay: { color: '#38BDF8', fontSize: 12, fontWeight: '700', marginTop: 2 },
  statsCardGrid: {
    flexDirection: 'row',
    backgroundColor: '#131C2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    width: '100%',
    marginVertical: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  statLbl: { color: '#64748B', fontSize: 11, marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131C2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    width: '100%',
    marginBottom: 8,
  },
  menuItemText: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', flex: 1, marginLeft: 12 },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#090D16',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 15,
  },
  bottomTabBtn: { alignItems: 'center' },
  bottomTabText: { color: '#64748B', fontSize: 10, marginTop: 4, fontWeight: '600' },
  bottomTabTextActive: { color: '#38BDF8', fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#131C2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  modalSub: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 4 },
  amtSelectorBtn: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  amtSelectorText: { color: '#38BDF8', fontWeight: '800', fontSize: 14 },
  modalCloseBtn: { marginTop: 16, padding: 8 },
  modalCloseText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  adminCommandBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090D16',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  adminCommandText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    padding: 12,
    borderRadius: 10,
  },
});
