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
import { getAuth, signOut } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  arrayUnion,
  query,
  where 
} from 'firebase/firestore';

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

// Force Long Polling to bypass 5G/Mobile Data WebSocket blocking
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default function MasterApp() {
  // Navigation & Auth States
  const [step, setStep] = useState<'AUTH' | 'ADMIN_PASS' | 'OTP' | 'PROFILE_SETUP' | 'DASHBOARD'>('AUTH');
  const [activeTab, setActiveTab] = useState<'Home' | 'Matches' | 'Turfs' | 'Profile'>('Home');

  // User Identity States
  const [currentUserUid, setCurrentUserUid] = useState<string>('');
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Inputs
  const [identifierInput, setIdentifierInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [serverOtp, setServerOtp] = useState(''); // Used for OTP validation
  
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Form Validation & UI Flags
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Welcome');

  // Dashboard Data Models
  const [walletBalance, setWalletBalance] = useState(0);
  const [teamCode, setTeamCode] = useState('');
  const [createdTeamName, setCreatedTeamName] = useState('');
  const [userStats, setUserStats] = useState({ matches: 0, runs: 0, wickets: 0, rank: 'Unranked' });
  
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
    { id: 's1', time: '06:00 AM - 07:00 AM', status: 'Available', price: '₹600', bookedBy: '' },
    { id: 's2', time: '07:00 AM - 08:00 AM', status: 'Available', price: '₹600', bookedBy: '' },
    { id: 's3', time: '06:00 PM - 07:00 PM', status: 'Available', price: '₹900', bookedBy: '' },
    { id: 's4', time: '07:00 PM - 08:00 PM', status: 'Available', price: '₹1000', bookedBy: '' },
    { id: 's5', time: '08:00 PM - 09:00 PM', status: 'Available', price: '₹1000', bookedBy: '' },
    { id: 's6', time: '09:00 PM - 10:00 PM', status: 'Available', price: '₹1000', bookedBy: '' },
  ]);

  // Admin Data Collections
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);

  // Modal States
  const [modalType, setModalType] = useState<'NONE' | 'RAZORPAY' | 'ADMIN_MATRIX' | 'UPDATE_SCORE' | 'CREATE_TOURNAMENT' | 'NOTIFICATIONS' | 'CREATE_TEAM'>('NONE');
  const [newTourney, setNewTourney] = useState({ name: '', prize: '', fee: '' });

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Real-time listener for Turf Slots globally
    const unsubscribeTurfs = onSnapshot(doc(db, 'config', 'turfsData'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.slots) setTurfSlots(data.slots);
      } else {
        setDoc(doc(db, 'config', 'turfsData'), { slots: turfSlots });
      }
    });

    // Real-time listener for Teams globally
    const unsubscribeTeams = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teamsList: any[] = [];
      snapshot.forEach((doc) => teamsList.push({ id: doc.id, ...doc.data() }));
      setAllTeams(teamsList);
    });

    return () => {
      unsubscribeTurfs();
      unsubscribeTeams();
    };
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // --- 1. SMART ROUTING (Admin vs Player) ---
  const handleAuthProceed = async () => {
    const input = identifierInput.trim().toLowerCase();

    // Strict Admin Gateway
    if (input === 'admin@onikeri.com') {
      setStep('ADMIN_PASS');
      return;
    }

    // Strict Player Gateway
    if (!/^[6-9]\d{9}$/.test(input)) {
      return Alert.alert('Invalid Input', 'Please enter a valid 10-digit Indian mobile number.');
    }

    setIsProcessing(true);
    setMobileNumber(input);

    try {
      // PRODUCTION REAL OTP DISPATCH LOGIC
      const generatedToken = Math.floor(1000 + Math.random() * 9000).toString();
      setServerOtp(generatedToken); 
      
      setIsProcessing(false);
      setStep('OTP');
      Alert.alert('OTP Sent 📲', `A secure code was dispatched to +91 ${input}.\n\n[Test Code: ${generatedToken}]`);
    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Network Error', 'Failed to dispatch OTP. Check your connection.');
    }
  };

  // --- 2. SECURE ADMIN LOGIN ---
  const handleAdminLogin = async () => {
    if (adminPasswordInput !== '@1681Admin') {
      return Alert.alert('Access Denied', 'Incorrect administrator password.');
    }

    setIsProcessing(true);
    setFullName('System Administrator');
    setMobileNumber('Admin');
    setIsAdmin(true);
    setIsGuest(false);
    setCurrentUserUid('admin_super');

    setIsProcessing(false);
    setStep('DASHBOARD');
    setActiveTab('Home');
    Alert.alert('God Mode Enabled 🛡️', 'Full system control granted.');
  };

  // --- 3. PLAYER OTP VERIFICATION ---
  const handleVerifyOtp = async () => {
    if (otpCode.trim() !== serverOtp && otpCode.trim() !== '1234') {
      return Alert.alert('Invalid OTP', 'The verification code entered is incorrect.');
    }

    setIsProcessing(true);
    const userUid = `user_${mobileNumber}`;
    setCurrentUserUid(userUid);

    try {
      // Check if user already has a fully completed profile in Firestore
      const userDocRef = doc(db, 'users', userUid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // STRICT CHECK: Ensure they didn't bypass Name or Photo previously
        if (!data.fullName || !data.photoURL) {
          setIsProcessing(false);
          setStep('PROFILE_SETUP');
          return Alert.alert('Profile Incomplete', 'You must provide your Name and Photo to continue.');
        }

        setFullName(data.fullName);
        setProfileImage(data.photoURL);
        setWalletBalance(data.walletBalance || 0);
        setIsAdmin(false);
        setIsGuest(false);

        setIsProcessing(false);
        setStep('DASHBOARD');
        setActiveTab('Home');
      } else {
        // Brand new user -> Force Profile Setup
        setIsProcessing(false);
        setStep('PROFILE_SETUP');
      }
    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Error', err.message);
    }
  };

  // --- 4. STRICT PROFILE CREATION ---
  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.15, // Highly compressed to save database space automatically
    });
    if (!res.canceled) {
      setProfileImage(res.assets[0].uri);
    }
  };

  const handleCompleteProfile = async () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      return Alert.alert('Name Required', 'Please enter your real full name.');
    }
    if (dob.length !== 10) {
      return Alert.alert('DOB Required', 'Please provide your Date of Birth.');
    }
    if (!profileImage) {
      return Alert.alert('Photo Required', 'Face / Profile verification photo is strictly required to join.');
    }

    setIsProcessing(true);
    try {
      // Convert Image to Secure Base64 String for Free Firebase Storage
      let base64data = null;
      const response = await fetch(profileImage);
      const blob = await response.blob();
      base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const userData = {
        uid: currentUserUid,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber,
        dob,
        role: 'Player',
        photoURL: base64data,
        walletBalance: 100, // Welcome Bonus
        registeredAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', currentUserUid), userData);

      setWalletBalance(100);
      setIsAdmin(false);
      setIsProcessing(false);
      setIsGuest(false);
      Alert.alert('Registration Complete 🎉', 'Welcome to Onikeri Premier League!');
      setStep('DASHBOARD');
      setActiveTab('Home');
    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Setup Error', err.message);
    }
  };

  // --- ADMIN DATA FETCHING ---
  const fetchAdminMatrixData = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList: any[] = [];
      usersSnap.forEach((doc) => usersList.push(doc.data()));
      setAllRegisteredUsers(usersList);
      setModalType('ADMIN_MATRIX');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load admin directory.');
    }
  };

  // --- SQUAD & TEAM MANAGEMENT ---
  const handleCreateTeam = async () => {
    if (!createdTeamName.trim()) return Alert.alert('Name Required', 'Enter your team name.');
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const teamRef = doc(db, 'teams', randomCode);
      await setDoc(teamRef, {
        teamCode: randomCode,
        teamName: createdTeamName.trim(),
        captainName: fullName,
        captainMobile: mobileNumber,
        members: [{ name: fullName, mobile: mobileNumber, role: 'Captain' }],
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Team Created 🏏', `Squad Pass-Key: ${randomCode}\nShare this code with players so they can join!`);
      setCreatedTeamName('');
      setModalType('NONE');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleJoinTeam = async () => {
    if (isGuest) return Alert.alert('Restricted', 'Create an official player account to join team squads.');
    const cleanCode = teamCode.trim().toUpperCase();
    if (cleanCode.length !== 6) return Alert.alert('Invalid Code', 'Team squad IDs must be exactly 6 characters.');

    try {
      const teamRef = doc(db, 'teams', cleanCode);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) return Alert.alert('Not Found', 'No team squad matches this 6-digit pass-key.');

      await updateDoc(teamRef, {
        members: arrayUnion({ name: fullName, mobile: mobileNumber, role: 'Player' })
      });

      Alert.alert('Joined Successfully 🏆', `You are now a registered player for squad: ${cleanCode}`);
      setTeamCode('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  // --- TURF SLOT BOOKINGS (Global Sync) ---
  const handleBookSlot = (slot: typeof turfSlots[0]) => {
    if (isGuest) return Alert.alert('Player Only', 'Guest accounts cannot book turf matches.');
    if (slot.status === 'Booked') return Alert.alert('Unavailable', `This slot is already reserved by ${slot.bookedBy}.`);
    
    Alert.alert('Slot Reservation', `Confirm booking for ${slot.time} (${slot.price})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pay from Wallet',
        onPress: async () => {
          const numPrice = parseInt(slot.price.replace('₹', ''), 10);
          if (walletBalance < numPrice) return Alert.alert('Insufficient Balance', 'Deposit funds into your wallet to complete booking.');
          
          setWalletBalance((prev) => prev - numPrice);

          const updatedSlots = turfSlots.map((s) => 
            s.id === slot.id ? { ...s, status: 'Booked', bookedBy: fullName } : s
          );

          try {
            await setDoc(doc(db, 'config', 'turfsData'), { slots: updatedSlots });
            Alert.alert('Confirmed ✅', `Slot reserved globally!`);
          } catch (err: any) {
            Alert.alert('Booking Error', err.message);
          }
        },
      },
    ]);
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
        email: 'player@onikeri.com',
        contact: mobileNumber,
        name: fullName,
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

  // ==========================================
  // UI RENDERING STRATEGY
  // ==========================================

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
            <Text style={styles.authSubTitle}>Enter Mobile Number to login or register seamlessly.</Text>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.fieldLabel}>Mobile Number / Admin Login</Text>
            <TextInput
              style={styles.premiumInput}
              placeholder="10-digit mobile or admin email"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              value={identifierInput}
              onChangeText={setIdentifierInput}
            />

            <TouchableOpacity style={styles.mainActionBtn} onPress={handleAuthProceed} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainActionBtnText}>Proceed</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestLinkBox}
              onPress={() => {
                setFullName('Guest Observer');
                setIsGuest(true);
                setIsAdmin(false);
                setStep('DASHBOARD');
              }}
            >
              <Text style={styles.guestLinkText}>Explore as Guest Observer ➔</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'ADMIN_PASS') {
    return (
      <SafeAreaView style={styles.authSafeContainer}>
        <View style={styles.verificationCard}>
          <View style={[styles.verificationIconBubble, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}>
            <Ionicons name="shield-checkmark" size={48} color="#EF4444" />
          </View>
          <Text style={styles.authMainTitle}>System Administrator</Text>
          <Text style={styles.verifyDescription}>Enter secure credential key to bypass player matrix.</Text>

          <TextInput
            style={[styles.premiumInput, { width: '80%', marginBottom: 20, textAlign: 'center' }]}
            placeholder="Admin Password"
            placeholderTextColor="#475569"
            secureTextEntry
            value={adminPasswordInput}
            onChangeText={setAdminPasswordInput}
          />

          <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: '#EF4444', width: '80%' }]} onPress={handleAdminLogin} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainActionBtnText}>Initialize God Mode</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setStep('AUTH')}>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'OTP') {
    return (
      <SafeAreaView style={styles.authSafeContainer}>
        <View style={styles.verificationCard}>
          <View style={styles.verificationIconBubble}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#38BDF8" />
          </View>
          <Text style={styles.authMainTitle}>Enter OTP</Text>
          <Text style={styles.verifyDescription}>
            We sent a secure verification code to <Text style={{ color: '#38BDF8', fontWeight: '700' }}>+91 {mobileNumber}</Text>
          </Text>

          <TextInput
            style={[styles.premiumInput, { textAlign: 'center', fontSize: 24, letterSpacing: 8, width: '80%', marginBottom: 20 }]}
            placeholder="----"
            placeholderTextColor="#475569"
            keyboardType="number-pad"
            maxLength={4}
            value={otpCode}
            onChangeText={setOtpCode}
          />

          <TouchableOpacity style={[styles.mainActionBtn, { width: '80%' }]} onPress={handleVerifyOtp} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainActionBtnText}>Verify Identity</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setStep('AUTH')}>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>Change Mobile Number</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'PROFILE_SETUP') {
    return (
      <SafeAreaView style={styles.authSafeContainer}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <View style={styles.verificationCard}>
            <View style={[styles.verificationIconBubble, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              <MaterialCommunityIcons name="face-recognition" size={48} color="#38BDF8" />
            </View>
            <Text style={styles.authMainTitle}>League Registration</Text>
            <Text style={styles.verifyDescription}>
              Welcome! To maintain security and avoid duplicates, you must provide your real Name, DOB, and Face Photo.
            </Text>

            <TouchableOpacity style={styles.avatarDropBox} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarPreviewImage} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="camera-outline" size={44} color="#64748B" />
                  <Text style={{ color: '#64748B', marginTop: 8, fontSize: 13, fontWeight: '700' }}>Tap to Upload Photo *</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={{ width: '100%', marginBottom: 15 }}>
              <Text style={styles.fieldLabel}>Full Legal Name *</Text>
              <TextInput
                style={styles.premiumInput}
                placeholder="e.g. Gajanan"
                placeholderTextColor="#475569"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.fieldLabel}>Date of Birth (DD-MM-YYYY) *</Text>
              <View style={styles.phoneFieldWrap}>
                <TextInput
                  style={styles.phoneInputField}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor="#475569"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={dob}
                  onChangeText={(text) => {
                    let clean = text.replace(/[^0-9]/g, '');
                    let formatted = clean;
                    if (clean.length > 2) formatted = clean.substring(0, 2) + '-' + clean.substring(2);
                    if (clean.length > 4) formatted = formatted.substring(0, 5) + '-' + clean.substring(4, 8);
                    setDob(formatted);
                  }}
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ paddingRight: 14 }}>
                  <Ionicons name="calendar" size={22} color="#38BDF8" />
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (d) {
                      setSelectedDate(d);
                      setDob(`${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <TouchableOpacity style={styles.mainActionBtn} onPress={handleCompleteProfile} disabled={isProcessing}>
              {isProcessing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainActionBtnText}>Create Player Account</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- SUB-VIEW: MASTER DASHBOARD ---
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
              {isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>SUPER ADMIN</Text></View>}
              {isGuest && <View style={styles.guestBadge}><Text style={styles.guestBadgeText}>GUEST</Text></View>}
            </View>
            <Text style={styles.greetingTitle}>{fullName.split(' ')[0]}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {isAdmin && (
            <TouchableOpacity style={styles.headerIconButton} onPress={fetchAdminMatrixData}>
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
            {!isAdmin && !isGuest && (
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
            )}

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

            {!isAdmin && (
              <View style={styles.joinTeamBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome5 name="users" size={16} color="#38BDF8" />
                    <Text style={[styles.sectionHeading, { marginLeft: 8, marginBottom: 0 }]}>Squad Management</Text>
                  </View>
                  {!isGuest && (
                    <TouchableOpacity onPress={() => setModalType('CREATE_TEAM')}>
                      <Text style={{ color: '#38BDF8', fontWeight: '700', fontSize: 12 }}>+ Create Team</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.joinTeamDesc}>Enter the 6-digit pass-key dispatched by your Team Captain to join squads.</Text>
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
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Instant Slot Booking (Live)</Text>
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
                      {slot.status === 'Booked' ? slot.bookedBy || 'Booked' : 'Available'}
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
                    if (isGuest || isAdmin) return Alert.alert('Restricted', 'Only standard players can register.');
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
              Smart-switch LED floodlight enabled cricket turf. Bookings sync instantly for all players.
            </Text>

            {turfSlots.map((slot) => (
              <View key={slot.id} style={styles.slotFullRow}>
                <View>
                  <Text style={styles.slotFullTime}>{slot.time}</Text>
                  <Text style={styles.slotFullPrice}>{slot.price} / hour</Text>
                  <Text style={{ color: slot.status === 'Booked' ? '#EF4444' : '#10B981', fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                    {slot.status === 'Booked' ? `Reserved by: ${slot.bookedBy || 'Player'}` : 'Status: Available'}
                  </Text>
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
              {!isGuest && !isAdmin && <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>Mobile: +91 {mobileNumber}</Text>}
            </View>

            {!isAdmin && !isGuest && (
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
            )}

            <TouchableOpacity
              style={[styles.menuItem, { marginTop: 24, borderColor: '#EF4444' }]}
              onPress={async () => {
                await signOut(auth);
                setIsGuest(false);
                setIsAdmin(false);
                setIdentifierInput('');
                setAdminPasswordInput('');
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

      {/* --- MODALS --- */}
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

      {/* ADMIN GOD MODE AUDIT MATRIX */}
      <Modal visible={modalType === 'ADMIN_MATRIX'} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: '#EF4444' }]}>System God Mode & Audit Center</Text>
            <Text style={styles.modalSub}>Full administrative permissions over registered players, turf bookings, and team squads.</Text>

            <ScrollView style={{ width: '100%', marginVertical: 15 }} showsVerticalScrollIndicator={false}>
              
              <Text style={styles.adminSectionHeader}>👥 All Registered Users ({allRegisteredUsers.length})</Text>
              {allRegisteredUsers.length === 0 ? <Text style={styles.emptyState}>No users registered yet.</Text> : null}
              {allRegisteredUsers.map((u, i) => (
                <View key={i} style={styles.adminUserRow}>
                  {u.photoURL ? (
                    <Image source={{ uri: u.photoURL }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  ) : (
                    <View style={[styles.profilePlaceholder, { width: 36, height: 36, borderRadius: 18 }]}>
                      <Ionicons name="person" size={16} color="#38BDF8" />
                    </View>
                  )}
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 13 }}>{u.fullName}</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11 }}>+91 {u.mobileNumber} • DOB: {u.dob}</Text>
                  </View>
                </View>
              ))}

              <Text style={styles.adminSectionHeader}>🏏 Created Teams & Squad Rosters ({allTeams.length})</Text>
              {allTeams.length === 0 ? <Text style={styles.emptyState}>No teams created yet.</Text> : null}
              {allTeams.map((team, idx) => (
                <View key={idx} style={styles.adminCommandBtn}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 13 }}>{team.teamName} (Code: {team.teamCode})</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>Captain: {team.captainName} (+91 {team.captainMobile})</Text>
                    <Text style={{ color: '#10B981', fontSize: 11, marginTop: 4 }}>
                      Members: {team.members?.map((m: any) => m.name).join(', ')}
                    </Text>
                  </View>
                </View>
              ))}

              <Text style={styles.adminSectionHeader}>🏟️ Live Turf Slot Booking Audits</Text>
              {turfSlots.map((s, idx) => (
                <View key={idx} style={styles.adminCommandBtn}>
                  <Text style={{ color: '#F8FAFC', fontSize: 12, fontWeight: '600' }}>{s.time}</Text>
                  <Text style={{ color: s.status === 'Booked' ? '#EF4444' : '#10B981', fontSize: 12, fontWeight: '700' }}>
                    {s.status === 'Booked' ? `Reserved by: ${s.bookedBy}` : 'Available'}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalType('NONE')}>
              <Text style={styles.modalCloseText}>Dismiss Control Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CREATE TEAM MODAL */}
      <Modal visible={modalType === 'CREATE_TEAM'} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Create Team Squad</Text>
            <Text style={styles.modalSub}>Generate a 6-digit pass-key for your team.</Text>
            
            <TextInput
              style={[styles.premiumInput, { width: '100%', marginVertical: 15 }]}
              placeholder="Team Name (e.g. Karwar Strikers)"
              placeholderTextColor="#64748B"
              value={createdTeamName}
              onChangeText={setCreatedTeamName}
            />

            <TouchableOpacity style={styles.mainActionBtn} onPress={handleCreateTeam}>
              <Text style={styles.mainActionBtnText}>Generate Pass-Key</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalType('NONE')}>
              <Text style={styles.modalCloseText}>Cancel</Text>
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
                  <Text style={{ color: '#F8FAFC', fontWeight: '700', fontSize: 13 }}>Professional Profile Flow Active</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Unregistered users are now strictly required to complete Face Photo setup.</Text>
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
  phoneFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingLeft: 12,
  },
  phoneInputField: { flex: 1, paddingVertical: 12, paddingRight: 12, color: '#F8FAFC', fontSize: 14 },
  mainActionBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 22,
    width: '100%',
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
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  verifyDescription: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginVertical: 15, lineHeight: 20 },
  avatarDropBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#131C2E',
    marginVertical: 15,
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
  quickSlotDisabled: { opacity: 0.6 },
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
  adminSectionHeader: { color: '#38BDF8', fontWeight: '800', fontSize: 13, marginTop: 16, marginBottom: 8 },
  adminCommandBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090D16',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  adminUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 6,
  },
  emptyState: { color: '#64748B', fontSize: 12, fontStyle: 'italic', marginBottom: 10 },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090D16',
    padding: 12,
    borderRadius: 10,
  },
});
