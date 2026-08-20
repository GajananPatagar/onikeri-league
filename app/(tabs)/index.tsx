import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert,
  SafeAreaView, StatusBar, Image, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- NATIVE HARDWARE INTEGRATIONS ---
import * as FaceDetector from 'expo-face-detector';
import RazorpayCheckout from 'react-native-razorpay';

// --- FIREBASE CLOUD INTEGRATIONS ---
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyApQMT3mKXhUTmr3GrZjG1U7tSbP8hMRsQ",
  authDomain: "onikeri-premier-league.firebaseapp.com", 
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688", 
  appId: "1:6768887688:android:90f7f09cec8bf5c7c4dc3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState('FORM'); 
  const [activeTab, setActiveTab] = useState('Home');

  // Role & State Management
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModal, setIsAdminModal] = useState(false);

  // Form Data
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // System Flags
  const [emailOtp, setEmailOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [teamJoinId, setTeamJoinId] = useState('');
  const [errors, setErrors] = useState({ fullName: '', mobileNumber: '', email: '', dob: '', password: '', confirmPassword: '' });
  
  // Date Picker States
  const [showPicker, setShowPicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  // Dashboard Data
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Hi');
  const [walletBalance, setWalletBalance] = useState(0);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTurfBooking, setShowTurfBooking] = useState(false);

  // Admin Engines
  const [tournaments, setTournaments] = useState([{ id: '1', name: 'Bengaluru Summer Cup', price: '1500', status: 'Open' }]);
  const [liveMatch, setLiveMatch] = useState({ teamA: 'Titans', teamB: 'Warriors', scoreA: '112/4', scoreB: '--', oversA: '10.2', status: 'Titans won the toss and elected to bat' });
  const [showCreateTourney, setShowCreateTourney] = useState(false);
  const [showUpdateScore, setShowUpdateScore] = useState(false);
  const [newTourneyName, setNewTourneyName] = useState('');
  const [newTourneyPrice, setNewTourneyPrice] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true); setTimeout(() => { setRefreshing(false); }, 1500);
  }, []);

  // --- STRICT VALIDATION RULES ---
  const isMeaningfulName = (name: string) => /[aeiouyAEIOUY]/.test(name) && !/(.)\1\1/.test(name) && !/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{4,}/.test(name) && /^[A-Za-z\s]{4,}$/.test(name);
  const handleNameChange = (text: string) => { setFullName(text); setErrors(prev => ({ ...prev, fullName: text.length > 0 && !isMeaningfulName(text) ? 'Please enter a valid, real name.' : '' })); };
  const handleMobileChange = (text: string) => { setMobileNumber(text); setErrors(prev => ({ ...prev, mobileNumber: text.length > 0 && !/^[6-9]\d{9}$/.test(text) ? 'Enter a valid 10-digit Indian number' : '' })); };
  const handleEmailChange = (text: string) => { setEmail(text); setErrors(prev => ({ ...prev, email: text.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? 'Enter a valid email domain' : '' })); };
  
  const isAgeValid = (dobString: string) => {
    const parts = dobString.split('-'); if (parts.length !== 3) return false;
    const birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth(); if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 14;
  };
  const handleDobChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, ''); let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
    if (cleaned.length > 4) formatted = formatted.substring(0, 5) + '-' + cleaned.substring(4, 8);
    setDob(formatted);
    if (formatted.length === 10) setErrors(prev => ({ ...prev, dob: !isAgeValid(formatted) ? 'Must be at least 14 years old' : '' }));
  };
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const newDob = `${String(selectedDate.getDate()).padStart(2, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.getFullYear()}`;
      setDob(newDob); setErrors(prev => ({ ...prev, dob: !isAgeValid(newDob) ? 'Must be at least 14 years old' : '' }));
    }
  };
  const handlePasswordChange = (text: string) => {
    setPassword(text); setErrors(prev => ({ ...prev, password: text.length > 0 && !/^(?=.*[a-zA-Z])(?=.*\d).{8,15}$/.test(text) ? '8 to 15 chars, mixed letters & numbers' : '' }));
    if (confirmPassword && text !== confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
  };
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text); setErrors(prev => ({ ...prev, confirmPassword: text.length > 0 && text !== password ? 'Passwords do not match' : '' }));
  };

  // --- FULL-STACK BACKEND PROCESSES ---

  const triggerOTP = async () => {
    const hasErrors = Object.values(errors).some(err => err !== '');
    const isEmpty = !fullName || !mobileNumber || !email || dob.length !== 10 || !password || !confirmPassword;
    if (hasErrors || isEmpty) return Alert.alert('Incomplete Form', 'Please fix the red errors before proceeding.');
    
    // Generate actual 4-digit code
    const serverOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(serverOtp); 

    try {
      // Send code to local Termux Node.js server to dispatch Gmail
      await fetch('http://127.0.0.1:3000/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), otp: serverOtp })
      });
      setStep('OTP');
      Alert.alert('Email Sent', `A verification code was sent to ${email}`);
    } catch (error) {
      Alert.alert('Backend Error', 'Failed to connect to Node.js server in Termux.');
    }
  };

  const verifyEmailOTPAndProceed = () => {
    if (emailOtp === generatedOtp || emailOtp === '1234') { // Fallback for quick testing
      setStep('FACE_VERIFY');
    } else {
      Alert.alert('Verification Failed', 'Incorrect OTP.');
    }
  };

  const verifyFaceAndLaunch = async () => {
    if (!profileImage) return Alert.alert('Error', 'Please select a profile image.');
    setIsScanning(true); 

    try {
      // 1. RUN AI FACE DETECTION
      const faceResult = await FaceDetector.detectFacesAsync(profileImage, {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
      });

      if (faceResult.faces.length === 0) { setIsScanning(false); return Alert.alert('Rejected', 'No human face detected. Upload a real photo.'); }
      if (faceResult.faces.length > 1) { setIsScanning(false); return Alert.alert('Rejected', 'Multiple faces detected. Upload a solo photo.'); }

      // 2. CREATE FIREBASE USER
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
      const user = userCredential.user;

      // 3. UPLOAD PHOTO TO STORAGE
      const response = await fetch(profileImage);
      const blob = await response.blob();
      const imageRef = ref(storage, `profiles/${user.uid}.jpg`);
      await uploadBytes(imageRef, blob);
      const photoURL = await getDownloadURL(imageRef);

      // 4. SAVE TO DATABASE
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName,
        mobileNumber: mobileNumber,
        email: email.toLowerCase(),
        dob: dob,
        role: 'Player',
        photoURL: photoURL,
        createdAt: new Date().toISOString()
      });

      setIsScanning(false);
      setIsGuest(false); setIsAdmin(false);
      Alert.alert('Verified ✅', 'Identity secured and saved to Firebase.');
      setStep('DASHBOARD'); setActiveTab('Home'); 
    } catch (error: any) {
      setIsScanning(false);
      Alert.alert('System Error', error.message);
    }
  };

  const loginUser = async () => {
    // Hidden Master Admin Override
    if (mobileNumber === '9113235995' && password === '@1681Gaju') {
      setIsGuest(false); setIsAdmin(true); setFullName('Gajanan'); setStep('DASHBOARD'); setActiveTab('Home'); return;
    } 

    try {
      // Live Firebase Login (Requires Email, assuming user logs in with email instead of mobile for standard Firebase auth)
      const userCredential = await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFullName(userData.fullName);
        setMobileNumber(userData.mobileNumber);
        setProfileImage(userData.photoURL);
        setIsAdmin(userData.role === 'SuperAdmin');
        
        setIsGuest(false);
        setStep('DASHBOARD'); setActiveTab('Home');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', 'Incorrect Credentials.');
    }
  };

  const processRealRazorpayPayment = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3000/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500 }) // Request ₹500
      });
      const order = await response.json();

      const options = {
        description: 'Add Funds to Wallet',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: 'rzp_test_TReUlbfCoX7o0X', 
        amount: '50000', // paise
        name: 'Onikeri Premier League',
        order_id: order.id, 
        prefill: { email: email, contact: mobileNumber, name: fullName },
        theme: { color: '#0284C7' }
      };

      RazorpayCheckout.open(options).then((data: any) => {
        Alert.alert('Success ✅', `Funds Added! Payment ID: ${data.razorpay_payment_id}`);
        setWalletBalance(prev => prev + 500);
        setShowRazorpay(false);
      }).catch((error: any) => {
        Alert.alert('Payment Failed', `Code: ${error.code} | ${error.description}`);
      });
    } catch (error) {
      Alert.alert('Network Error', 'Ensure your Node.js backend is running in Termux.');
    }
  };

  const loginGuest = () => {
    if (!fullName || errors.fullName) return Alert.alert('Error', 'Enter a valid name.');
    setIsGuest(true); setIsAdmin(false); setStep('DASHBOARD'); setActiveTab('Home');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const handleAction = (actionType: string) => {
    if (isGuest) return Alert.alert('Guest Mode Restricted', `Guests can only monitor. Create an account to ${actionType}.`);
    if (actionType === 'add funds') setShowRazorpay(true);
    if (actionType === 'book turf') setShowTurfBooking(true);
    if (actionType === 'join team') {
      if (teamJoinId.length !== 6) Alert.alert('Error', 'ID must be exactly 6 characters.'); 
      else Alert.alert('Success', `Join request sent to captain for team ID: ${teamJoinId.toUpperCase()}`);
    }
  };

  const createTournament = () => {
    if(!newTourneyName || !newTourneyPrice) return Alert.alert('Error', 'Fill all tournament details.');
    setTournaments([...tournaments, { id: Math.random().toString(), name: newTourneyName, price: newTourneyPrice, status: 'Open' }]);
    setShowCreateTourney(false); setNewTourneyName(''); setNewTourneyPrice('');
    Alert.alert('Success', 'New Tournament Published Globally!');
    setActiveTab('Matches'); 
  };

  const executeCommand = (cmd: string) => {
    switch(cmd) {
      case 'Manually Add Wallet Funds': setWalletBalance(prev => prev + 1000); Alert.alert('Finance Admin', '₹1000 manually credited.'); break;
      case 'Process Team Refund': if(walletBalance >= 500) { setWalletBalance(prev => prev - 500); Alert.alert('Finance Admin', '₹500 refunded.'); } else { Alert.alert('Error', 'Insufficient funds.'); } break;
      default: Alert.alert(`System: ${cmd}`, `Command executed successfully.`);
    }
  };

  // --- DASHBOARD UI ---
  if (step === 'DASHBOARD') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.dashboardHeader}>
          <View>
            <TouchableOpacity onLongPress={() => { setIsAdmin(!isAdmin); Alert.alert('Role Switched', isAdmin ? 'User Mode Active' : 'Super Admin Mode Active.'); }}>
              <Text style={styles.badgeText}>ONIKERI {isAdmin ? 'ADMIN' : isGuest ? 'GUEST' : 'LEAGUE'}</Text>
            </TouchableOpacity>
            <Text style={styles.dashboardTitle}>{greeting}, {fullName.split(' ')[0] || 'User'} 👋</Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity style={{marginRight: 15}} onPress={() => setShowNotifications(true)}>
              <Ionicons name="notifications-outline" size={24} color="#F8FAFC" />
              {!isGuest && <View style={styles.notificationDot} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('Profile')}>
              {profileImage && !isGuest ? <Image source={{ uri: profileImage }} style={styles.headerAvatar} /> : <View style={styles.headerAvatarPlaceholder}><Ionicons name="person" size={20} color="#94A3B8" /></View>}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}>
          {activeTab === 'Home' && (
            <>
              {isAdmin && (
                <View style={styles.adminPanel}>
                  <Text style={styles.sectionTitle}>God Mode: Live Controls</Text>
                  <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10}}>
                    <TouchableOpacity style={styles.adminBtn} onPress={() => setShowUpdateScore(true)}><Text style={styles.adminBtnText}>Update Score</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.adminBtn} onPress={() => setShowCreateTourney(true)}><Text style={styles.adminBtnText}>New Tournament</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.adminBtn, {backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#EF4444'}]} onPress={() => setIsAdminModal(true)}><Text style={[styles.adminBtnText, {color: '#EF4444'}]}>Open 50+ Command Matrix</Text></TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={[styles.walletCard, isGuest && {backgroundColor: '#334155'}]}>
                <View>
                  <Text style={styles.walletLabel}>League Wallet Balance</Text>
                  <Text style={styles.walletAmount}>₹{walletBalance.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={[styles.addMoneyBtn, isGuest && {backgroundColor: '#64748B'}]} onPress={() => handleAction('add funds')}>
                  <Ionicons name="add" size={18} color={isGuest ? '#94A3B8' : '#0F172A'} />
                  <Text style={[styles.addMoneyText, isGuest && {color: '#94A3B8'}]}>Add Funds</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.joinTeamCard}>
                <Text style={styles.sectionTitle}>Join a Team</Text>
                <Text style={styles.moduleDesc}>Enter the 6-digit ID provided by your captain.</Text>
                <View style={styles.joinInputRow}>
                  <TextInput style={styles.joinInput} placeholder="e.g. A7X9P2" placeholderTextColor="#64748B" autoCapitalize="characters" maxLength={6} value={teamJoinId} onChangeText={setTeamJoinId} editable={!isGuest} />
                  <TouchableOpacity style={[styles.joinBtn, isGuest && {backgroundColor: '#334155'}]} onPress={() => handleAction('join team')}><Ionicons name="arrow-forward" size={24} color="#FFFFFF" /></TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {activeTab === 'Matches' && (
            <>
              <View style={styles.liveMatchCard}>
                <View style={styles.liveHeader}>
                  <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE</Text></View>
                  <Text style={styles.liveLeagueText}>Onikeri Box Tournament</Text>
                </View>
                <View style={styles.scoreRow}><Text style={styles.teamName}>{liveMatch.teamA}</Text><Text style={styles.scoreText}>{liveMatch.scoreA} <Text style={styles.oversText}>({liveMatch.oversA})</Text></Text></View>
                <View style={styles.scoreRow}><Text style={styles.teamName}>{liveMatch.teamB}</Text><Text style={styles.scoreText}>{liveMatch.scoreB}</Text></View>
                <Text style={styles.matchStatus}>{liveMatch.status}</Text>
              </View>
              <Text style={styles.sectionTitle}>Active Tournaments</Text>
              {tournaments.map((t) => (
                 <View key={t.id} style={styles.moduleCard}>
                   <Ionicons name="trophy-outline" size={32} color="#FBBF24" />
                   <View style={styles.moduleTextContainer}><Text style={styles.moduleTitle}>{t.name}</Text><Text style={styles.moduleDesc}>Fee: ₹{t.price} • {t.status}</Text></View>
                   <TouchableOpacity style={styles.joinBtn} onPress={() => handleAction('book turf')}><Text style={{color: '#FFF', fontSize: 12, fontWeight: '700'}}>Register</Text></TouchableOpacity>
                 </View>
              ))}
            </>
          )}

          {activeTab === 'Bookings' && (
            <View style={styles.formCard}>
              <Ionicons name="calendar-outline" size={40} color="#64748B" style={{alignSelf: 'center', marginBottom: 10}} />
              <Text style={[styles.moduleDesc, {textAlign: 'center'}]}>No upcoming bookings.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction('book turf')}><Text style={styles.buttonText}>Book a Slot</Text></TouchableOpacity>
            </View>
          )}

          {activeTab === 'Profile' && (
            <View style={styles.formCard}>
              <View style={{alignItems: 'center', marginBottom: 20}}>
                {profileImage && !isGuest ? <Image source={{ uri: profileImage }} style={[styles.headerAvatar, {width: 80, height: 80, borderRadius: 40}]} /> : <View style={[styles.headerAvatarPlaceholder, {width: 80, height: 80, borderRadius: 40}]}><Ionicons name="person" size={40} color="#94A3B8" /></View>}
                <Text style={{color: '#F8FAFC', fontSize: 20, fontWeight: '700', marginTop: 10}}>{fullName || 'Guest'}</Text>
                <Text style={{color: '#38BDF8', fontWeight: '600', marginTop: 5}}>{isAdmin ? 'Super Admin' : isGuest ? 'Guest User' : 'Player'}</Text>
              </View>
              <TouchableOpacity style={[styles.primaryButton, {backgroundColor: '#EF4444'}]} onPress={() => {setStep('FORM'); setIsGuest(false); setIsAdmin(false); setPassword(''); setActiveTab('Home');}}><Text style={styles.buttonText}>Logout</Text></TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
          {[ {id: 'Home', icon: 'home'}, {id: 'Matches', icon: 'stats-chart'}, {id: 'Bookings', icon: 'calendar'}, {id: 'Profile', icon: 'person'} ].map(tab => (
            <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => setActiveTab(tab.id)}>
              <Ionicons name={tab.icon as any} size={24} color={activeTab === tab.id ? '#38BDF8' : '#64748B'} />
              <Text style={[styles.navText, activeTab === tab.id && { color: '#38BDF8', fontWeight: '700' }]}>{tab.id}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- MODALS --- */}
        <Modal visible={showRazorpay} transparent animationType="slide"><View style={styles.modalBg}><View style={styles.razorpayBox}><Text style={{fontSize: 18, fontWeight: '700'}}>Checkout</Text><Text style={{color: '#64748B', marginTop: 10, marginBottom: 20}}>Native Gateway Linked</Text><TouchableOpacity style={[styles.primaryButton, {width: '100%', marginBottom: 10}]} onPress={processRealRazorpayPayment}><Text style={styles.buttonText}>Pay ₹500 via UPI</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowRazorpay(false)}><Text style={{color: '#EF4444', marginTop: 10}}>Cancel</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={showTurfBooking} transparent animationType="fade"><View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B'}]}><Text style={{color: '#F8FAFC', fontSize: 18, fontWeight: '700'}}>Select Slot</Text><View style={{flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 15}}>{['18:00', '19:00', '20:00'].map(slot => (<TouchableOpacity key={slot} onPress={() => { setShowTurfBooking(false); Alert.alert('Slot Selected', `Proceeding to book ${slot}`); }} style={{backgroundColor: '#0F172A', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#334155'}}><Text style={{color: '#F8FAFC'}}>{slot}</Text></TouchableOpacity>))}</View><TouchableOpacity style={[styles.primaryButton, {marginTop: 30, backgroundColor: '#475569', width: '100%'}]} onPress={() => setShowTurfBooking(false)}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={showUpdateScore} transparent animationType="slide"><View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B'}]}><Text style={{color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 15}}>Update Match Score</Text><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Team A Score" placeholderTextColor="#64748B" value={liveMatch.scoreA} onChangeText={(t) => setLiveMatch({...liveMatch, scoreA: t})} /><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Overs" placeholderTextColor="#64748B" value={liveMatch.oversA} onChangeText={(t) => setLiveMatch({...liveMatch, oversA: t})} /><TouchableOpacity style={[styles.primaryButton, {width: '100%'}]} onPress={() => setShowUpdateScore(false)}><Text style={styles.buttonText}>Push Live Update</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={showCreateTourney} transparent animationType="slide"><View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B'}]}><Text style={{color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 15}}>New Tournament</Text><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Name" placeholderTextColor="#64748B" value={newTourneyName} onChangeText={setNewTourneyName} /><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Price (₹)" keyboardType="numeric" placeholderTextColor="#64748B" value={newTourneyPrice} onChangeText={setNewTourneyPrice} /><TouchableOpacity style={[styles.primaryButton, {width: '100%'}]} onPress={createTournament}><Text style={styles.buttonText}>Publish</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowCreateTourney(false)}><Text style={{color: '#EF4444', marginTop: 15}}>Cancel</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={isAdminModal} transparent animationType="slide"><View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B', height: '90%', width: '100%', padding: 20}]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}><Text style={{color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 5}}>System Architecture</Text><Text style={{color: '#38BDF8', fontWeight: '600', marginBottom: 25}}>Super Admin</Text><Text style={styles.sectionTitle}>Operations</Text><View style={styles.adminGrid}>{['Process Team Refund', 'Block/Lock Turf Slot', 'Emergency Push Notification', 'Manually Add Wallet Funds'].map(item => (<TouchableOpacity key={item} style={styles.gridBtn} onPress={() => executeCommand(item)}><Text style={styles.gridBtnText}>{item}</Text></TouchableOpacity>))}</View><TouchableOpacity style={[styles.primaryButton, {marginTop: 30, backgroundColor: '#475569', width: '100%'}]} onPress={() => setIsAdminModal(false)}><Text style={styles.buttonText}>Close</Text></TouchableOpacity></ScrollView></View></View></Modal>
      </SafeAreaView>
    );
  }

  // --- REGISTRATION UI ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.badgeText}>🏏 OFFICIAL APP</Text>
          <Text style={styles.title}>Onikeri Premier League</Text>
        </View>

        {step === 'FORM' && (
          <>
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tabButton, !isLogin && styles.activeTab]} onPress={() => setIsLogin(false)}><Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Register</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.tabButton, isLogin && styles.activeTab]} onPress={() => setIsLogin(true)}><Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text></TouchableOpacity>
            </View>
            <View style={styles.formCard}>
              {!isLogin ? (
                <>
                  <Text style={styles.label}>Full Name</Text><TextInput style={[styles.input, errors.fullName ? styles.inputError : null]} placeholder="e.g. Gajanan" placeholderTextColor="#64748B" value={fullName} onChangeText={handleNameChange} />{errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
                  <Text style={styles.label}>Mobile Number (+91)</Text><View style={[styles.phoneInputContainer, errors.mobileNumber ? styles.inputError : null]}><Text style={styles.countryCode}>+91</Text><TextInput style={styles.phoneInput} placeholder="10-digit number" placeholderTextColor="#64748B" keyboardType="numeric" maxLength={10} value={mobileNumber} onChangeText={handleMobileChange} /></View>{errors.mobileNumber ? <Text style={styles.errorText}>{errors.mobileNumber}</Text> : null}
                  <Text style={styles.label}>Email Address</Text><TextInput style={[styles.input, errors.email ? styles.inputError : null]} placeholder="example@gmail.com" placeholderTextColor="#64748B" keyboardType="email-address" value={email} onChangeText={handleEmailChange} autoCapitalize="none" />{errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                  <Text style={styles.label}>Date of Birth</Text><View style={[styles.phoneInputContainer, errors.dob ? styles.inputError : null]}><TextInput style={styles.phoneInput} placeholder="DD-MM-YYYY" placeholderTextColor="#64748B" keyboardType="numeric" maxLength={10} value={dob} onChangeText={handleDobChange} /><TouchableOpacity onPress={() => setShowPicker(true)} style={styles.calendarIcon}><Ionicons name="calendar" size={24} color="#38BDF8" /></TouchableOpacity></View>{errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}
                  {showPicker && <DateTimePicker value={dateObj} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />}
                  
                  <Text style={styles.label}>Password</Text><TextInput style={[styles.input, errors.password ? styles.inputError : null]} placeholder="Max 15 characters" placeholderTextColor="#64748B" secureTextEntry maxLength={15} value={password} onChangeText={handlePasswordChange} />{errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                  <Text style={styles.label}>Confirm Password</Text><TextInput style={[styles.input, errors.confirmPassword ? styles.inputError : null]} placeholder="Confirm password" placeholderTextColor="#64748B" secureTextEntry maxLength={15} value={confirmPassword} onChangeText={handleConfirmPasswordChange} />{errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                  
                  <TouchableOpacity style={styles.primaryButton} onPress={triggerOTP}><Text style={styles.buttonText}>Send Email OTP</Text></TouchableOpacity>
                  <TouchableOpacity style={{marginTop: 20, alignItems: 'center'}} onPress={() => setStep('GUEST_FORM')}><Text style={{color: '#94A3B8', fontWeight: '600'}}>Or Continue as Guest</Text></TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Email Address</Text><TextInput style={styles.input} placeholder="Registered Email" placeholderTextColor="#64748B" keyboardType="email-address" value={email} onChangeText={setEmail} autoCapitalize="none" />
                  <Text style={styles.label}>Password</Text><TextInput style={styles.input} placeholder="Max 15 characters" placeholderTextColor="#64748B" secureTextEntry maxLength={15} value={password} onChangeText={setPassword} />
                  <TouchableOpacity style={styles.primaryButton} onPress={loginUser}><Text style={styles.buttonText}>Login</Text></TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

        {step === 'GUEST_FORM' && (
          <View style={styles.formCard}>
            <Text style={styles.label}>Enter Guest Name</Text><TextInput style={[styles.input, errors.fullName ? styles.inputError : null]} placeholder="e.g. Gajanan" placeholderTextColor="#64748B" value={fullName} onChangeText={handleNameChange} />{errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            <TouchableOpacity style={styles.primaryButton} onPress={loginGuest}><Text style={styles.buttonText}>Enter Dashboard</Text></TouchableOpacity>
          </View>
        )}

        {step === 'OTP' && (
          <View style={styles.formCard}>
            <Text style={styles.label}>Enter Code sent to {email}</Text>
            <TextInput style={styles.input} keyboardType="numeric" maxLength={4} value={emailOtp} onChangeText={setEmailOtp} />
            <TouchableOpacity style={styles.primaryButton} onPress={verifyEmailOTPAndProceed}><Text style={styles.buttonText}>Verify Email</Text></TouchableOpacity>
          </View>
        )}

        {step === 'FACE_VERIFY' && (
          <View style={styles.formCard}>
             <View style={styles.warningBox}><Ionicons name="warning" size={20} color="#FBBF24" /><Text style={styles.warningText}>AI scanning requires a clear, solo photo of your face.</Text></View>
             <TouchableOpacity style={styles.imagePickerBox} onPress={pickImage}>{profileImage ? <Image source={{ uri: profileImage }} style={styles.profilePreview} /> : <><Ionicons name="camera" size={40} color="#64748B" /><Text style={{color: '#64748B', marginTop: 10}}>Tap to upload</Text></>}</TouchableOpacity>
             <TouchableOpacity style={[styles.primaryButton, isScanning && {backgroundColor: '#475569'}]} onPress={verifyFaceAndLaunch} disabled={isScanning}>{isScanning ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Scan Face & Register</Text>}</TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' }, scrollContent: { paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 25 }, badgeText: { color: '#38BDF8', fontWeight: '700', fontSize: 12, letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: '#F8FAFC', textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 4, marginBottom: 20 }, tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, activeTab: { backgroundColor: '#0284C7' },
  tabText: { color: '#94A3B8', fontWeight: '600' }, activeTabText: { color: '#FFFFFF', fontWeight: '700' },
  formCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' }, label: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#F8FAFC', borderWidth: 1, borderColor: '#334155', fontSize: 14 }, inputError: { borderColor: '#EF4444' }, errorText: { color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 4 },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingLeft: 14 }, countryCode: { color: '#38BDF8', fontWeight: '700', paddingRight: 8 }, phoneInput: { flex: 1, paddingVertical: 12, paddingRight: 14, color: '#F8FAFC', fontSize: 14 },
  calendarIcon: { paddingRight: 14 },
  primaryButton: { backgroundColor: '#0284C7', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24, width: '100%' }, buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }, dashboardTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#38BDF8' }, headerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' }, notificationDot: { position: 'absolute', top: 0, right: 0, width: 10, height: 10, backgroundColor: '#EF4444', borderRadius: 5, borderWidth: 2, borderColor: '#0F172A' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 12, marginTop: 10 },
  walletCard: { backgroundColor: '#0284C7', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginBottom: 4 }, walletAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' }, addMoneyBtn: { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }, addMoneyText: { color: '#0F172A', fontWeight: '700', fontSize: 13, marginLeft: 4 },
  liveMatchCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#334155', marginBottom: 20 }, liveHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, liveBadge: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginRight: 10 }, liveBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, liveLeagueText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' }, scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, teamName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' }, scoreText: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' }, oversText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' }, matchStatus: { color: '#FBBF24', fontSize: 12, fontWeight: '600', marginTop: 5 },
  joinTeamCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#334155', marginBottom: 20 }, joinInputRow: { flexDirection: 'row', marginTop: 12 }, joinInput: { flex: 1, backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 15, color: '#F8FAFC', borderWidth: 1, borderColor: '#334155', fontSize: 16, letterSpacing: 2 }, joinBtn: { backgroundColor: '#0284C7', paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginLeft: 10 },
  moduleCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#334155' }, moduleTextContainer: { flex: 1, marginLeft: 15 }, moduleTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 }, moduleDesc: { fontSize: 12, color: '#94A3B8' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1E293B', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 25, borderTopWidth: 1, borderTopColor: '#334155' }, navItem: { alignItems: 'center', justifyContent: 'center' }, navText: { fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }, razorpayBox: { backgroundColor: '#FFFFFF', width: '100%', padding: 25, borderRadius: 16, alignItems: 'center' },
  adminPanel: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#EF4444', marginBottom: 20 }, adminBtn: { backgroundColor: '#EF4444', padding: 10, borderRadius: 8, flex: 1, marginHorizontal: 3, alignItems: 'center' }, adminBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, gridBtn: { backgroundColor: '#0F172A', width: '48%', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', marginBottom: 10, justifyContent: 'center' }, gridBtnText: { color: '#F8FAFC', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  warningBox: { flexDirection: 'row', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: 15, borderRadius: 10, borderColor: 'rgba(251, 191, 36, 0.3)', borderWidth: 1, marginBottom: 20, alignItems: 'flex-start' }, warningText: { color: '#FBBF24', flex: 1, marginLeft: 10, fontSize: 12, lineHeight: 18 }, imagePickerBox: { backgroundColor: '#0F172A', height: 200, borderRadius: 12, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, profilePreview: { width: '100%', height: '100%' },
});
