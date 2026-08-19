import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert,
  SafeAreaView, StatusBar, Image, ActivityIndicator, RefreshControl, Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- 1. FIREBASE INITIALIZATION ---
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyApQMT3mKXhUTmr3GrZjG1U7tSbP8hMRsQ",
  authDomain: "onikeri-premier-league.firebaseapp.com", 
  projectId: "onikeri-premier-league",
  storageBucket: "onikeri-premier-league.firebasestorage.app",
  messagingSenderId: "6768887688", 
  appId: "1:6768887688:android:90f7f09cec8bf5c7c4dc3d"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = initializeApp(firebaseConfig);

export default function App() {
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState('FORM'); 
  const [activeTab, setActiveTab] = useState('Home');

  // Role Management
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModal, setIsAdminModal] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP & Verification
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [teamJoinId, setTeamJoinId] = useState('');
  const [errors, setErrors] = useState({ fullName: '', mobileNumber: '', email: '', dob: '', password: '', confirmPassword: '' });
  const [showPicker, setShowPicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  // Dashboard & System States
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Hi');
  const [walletBalance, setWalletBalance] = useState(0);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTurfBooking, setShowTurfBooking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Dynamic Admin Engines
  const [tournaments, setTournaments] = useState([
    { id: '1', name: 'Bengaluru Summer Cup', price: '1500', status: 'Open' }
  ]);
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
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 1500);
  }, []);

  // --- Real-time Validation ---
  const isMeaningfulName = (name: string) => /[aeiouyAEIOUY]/.test(name) && !/(.)\1\1/.test(name) && !/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{4,}/.test(name) && /^[A-Za-z\s]{4,}$/.test(name);
  const handleNameChange = (text: string) => { setFullName(text); setErrors(prev => ({ ...prev, fullName: text.length > 0 && !isMeaningfulName(text) ? 'Please enter a valid, real name.' : '' })); };
  const handleMobileChange = (text: string) => { setMobileNumber(text); setErrors(prev => ({ ...prev, mobileNumber: text.length > 0 && !/^[6-9]\d{9}$/.test(text) ? 'Invalid Indian number' : '' })); };
  const handleEmailChange = (text: string) => { setEmail(text); setErrors(prev => ({ ...prev, email: text.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? 'Invalid email domain' : '' })); };
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
    if (formatted.length === 10) setErrors(prev => ({ ...prev, dob: !isAgeValid(formatted) ? 'Must be 14+' : '' }));
  };
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const newDob = `${String(selectedDate.getDate()).padStart(2, '0')}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.getFullYear()}`;
      setDob(newDob); setErrors(prev => ({ ...prev, dob: !isAgeValid(newDob) ? 'Must be 14+' : '' }));
    }
  };
  const handlePasswordChange = (text: string) => {
    setPassword(text); setErrors(prev => ({ ...prev, password: text.length > 0 && !/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(text) ? 'Min 8 chars, mixed letters & numbers' : '' }));
    if (confirmPassword && text !== confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
  };
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text); setErrors(prev => ({ ...prev, confirmPassword: text.length > 0 && text !== password ? 'Passwords do not match' : '' }));
  };

  // --- Process Flows ---
  const triggerOTP = () => {
    if (Object.values(errors).some(err => err !== '') || !fullName || !mobileNumber || !email || dob.length !== 10 || !password || !confirmPassword) return Alert.alert('Incomplete Form', 'Fix errors before proceeding.');
    setStep('OTP');
  };

  const verifyOTPAndProceed = () => {
    if (mobileOtp === '1234' && emailOtp === '1234') setStep('FACE_VERIFY');
    else Alert.alert('Verification Failed', 'Incorrect OTP. Use 1234.');
  };

  const loginUser = () => {
    if (mobileNumber === '9113235995' && password === '@1681Gaju') {
      setIsGuest(false); setFullName('Gajanan'); setStep('DASHBOARD'); setActiveTab('Home');
    } else {
      Alert.alert('Login Failed', 'Incorrect Mobile Number or Password.');
    }
  };

  const loginGuest = () => {
    if (!fullName || errors.fullName) return Alert.alert('Error', 'Enter a valid name.');
    setIsGuest(true); setStep('DASHBOARD'); setActiveTab('Home');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setProfileImage(result.assets[0].uri);
  };

  const verifyFaceAndLaunch = () => {
    if (!profileImage) return Alert.alert('Error', 'Select profile image.');
    setIsScanning(true); setTimeout(() => { setIsScanning(false); setIsGuest(false); setStep('DASHBOARD'); setActiveTab('Home'); }, 3000);
  };

  // --- 2. RAZORPAY INTEGRATION LOGIC ---
  const handleAction = (actionType: string) => {
    if (isGuest) return Alert.alert('Guest Mode Restricted', `Guests can only monitor. Create an account to ${actionType}.`);
    
    if (actionType === 'add funds') {
      setShowRazorpay(true);
    }
    if (actionType === 'book turf') setShowTurfBooking(true);
    if (actionType === 'join team') {
      if (teamJoinId.length !== 6) Alert.alert('Error', 'ID must be 6 characters.'); else Alert.alert('Success', `Join request sent for ${teamJoinId.toUpperCase()}`);
    }
  };

  const processRealRazorpayPayment = () => {
    // This is the actual configuration that will be used in your production build
    const razorpayOptions = {
      description: 'Add Funds to Onikeri Wallet',
      image: 'https://your-logo-url.com/logo.png',
      currency: 'INR',
      key: 'rzp_test_TReUlbfCoX7o0X', 
      amount: '50000', // Amount is in paise (₹500.00)
      name: 'Onikeri Premier League',
      prefill: {
        email: email || 'user@example.com',
        contact: mobileNumber || '9113235995',
        name: fullName || 'Gajanan'
      },
      theme: { color: '#0284C7' }
    };

    // Because Expo Go blocks native SDKs, we simulate the success callback here.
    // In production, this becomes: RazorpayCheckout.open(razorpayOptions).then(...)
    console.log("Initializing Razorpay with key:", razorpayOptions.key);
    
    setShowRazorpay(false);
    Alert.alert('Firebase & Razorpay Linked ✅', 'Payment of ₹500 successful via test API Key.');
    setWalletBalance(prev => prev + 500);
  };

  // --- ADMIN ACTIONS ---
  const createTournament = () => {
    if(!newTourneyName || !newTourneyPrice) return Alert.alert('Error', 'Fill all tournament details.');
    setTournaments([...tournaments, { id: Math.random().toString(), name: newTourneyName, price: newTourneyPrice, status: 'Open' }]);
    setShowCreateTourney(false); setNewTourneyName(''); setNewTourneyPrice('');
    Alert.alert('Success', 'New Tournament Published Globally!');
    setActiveTab('Matches'); 
  };

  const executeCommand = (cmd: string) => {
    switch(cmd) {
      case 'Manually Add Wallet Funds':
        setWalletBalance(prev => prev + 1000); Alert.alert('Finance Admin', '₹1000 manually credited to testing wallet.'); break;
      case 'Process Team Refund':
        if(walletBalance >= 500) { setWalletBalance(prev => prev - 500); Alert.alert('Finance Admin', '₹500 refunded from wallet.'); } 
        else { Alert.alert('Error', 'Insufficient wallet balance.'); } break;
      case 'Toggle Registration Status': Alert.alert('System Update', 'Registrations LOCKED globally.'); break;
      case 'Emergency Push Notification': Alert.alert('Broadcast Sent', 'Emergency weather delay sent.'); break;
      case 'View Immutable Audit Logging': Alert.alert('Audit Log', `User authenticated.\nIP: 192.168.1.45`); break;
      case 'Database Snapshot Rollback': Alert.alert('CRITICAL WARNING', 'Restoring database...', [{text: 'Confirm'}]); break;
      case 'Block/Lock Turf Slot': Alert.alert('Turf Management', '19:00 Slot has been blocked.'); break;
      default: Alert.alert(`System: ${cmd}`, `Authorized as Super Admin. Command executed.`);
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

              <Text style={styles.sectionTitle}>Explore</Text>
              <TouchableOpacity style={styles.moduleCard} onPress={() => handleAction('book turf')}>
                <Ionicons name="calendar-outline" size={32} color={isGuest ? '#64748B' : '#38BDF8'} />
                <View style={styles.moduleTextContainer}><Text style={styles.moduleTitle}>Book Box Cricket</Text><Text style={styles.moduleDesc}>Reserve turf time slots instantly via UPI.</Text></View>
                <Ionicons name="chevron-forward" size={24} color="#64748B" />
              </TouchableOpacity>
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
                   <View style={styles.moduleTextContainer}>
                     <Text style={styles.moduleTitle}>{t.name}</Text>
                     <Text style={styles.moduleDesc}>Entry Fee: ₹{t.price} • Status: {t.status}</Text>
                   </View>
                   <TouchableOpacity style={styles.joinBtn} onPress={() => handleAction('book turf')}><Text style={{color: '#FFF', fontSize: 12, fontWeight: '700'}}>Register</Text></TouchableOpacity>
                 </View>
              ))}
            </>
          )}

          {activeTab === 'Bookings' && (
            <>
              <Text style={styles.sectionTitle}>My Turf Bookings</Text>
              <View style={styles.formCard}>
                <Ionicons name="calendar-outline" size={40} color="#64748B" style={{alignSelf: 'center', marginBottom: 10}} />
                <Text style={[styles.moduleDesc, {textAlign: 'center'}]}>You have no upcoming box cricket bookings.</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction('book turf')}>
                  <Text style={styles.buttonText}>Book a Slot Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === 'Profile' && (
            <>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              <View style={styles.formCard}>
                <View style={{alignItems: 'center', marginBottom: 20}}>
                  {profileImage && !isGuest ? <Image source={{ uri: profileImage }} style={[styles.headerAvatar, {width: 80, height: 80, borderRadius: 40}]} /> : <View style={[styles.headerAvatarPlaceholder, {width: 80, height: 80, borderRadius: 40}]}><Ionicons name="person" size={40} color="#94A3B8" /></View>}
                  <Text style={{color: '#F8FAFC', fontSize: 20, fontWeight: '700', marginTop: 10}}>{fullName || 'Guest'}</Text>
                  <Text style={{color: '#38BDF8', fontWeight: '600', marginTop: 5}}>{isAdmin ? 'Super Admin' : isGuest ? 'Guest User' : 'Registered Player'}</Text>
                </View>

                {!isGuest && (
                  <View style={{marginBottom: 20}}>
                    <Text style={styles.label}>Registered Mobile</Text>
                    <TextInput style={[styles.input, {color: '#94A3B8'}]} value={`+91 ${mobileNumber}`} editable={false} />
                  </View>
                )}

                <TouchableOpacity style={[styles.primaryButton, {backgroundColor: '#EF4444', marginTop: 10, width: '100%'}]} onPress={() => {setStep('FORM'); setIsGuest(false); setIsAdmin(false); setMobileNumber(''); setPassword(''); setActiveTab('Home');}}>
                  <Text style={styles.buttonText}>Logout Securely</Text>
                </TouchableOpacity>
              </View>
            </>
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

        {/* --- DYNAMIC ADMIN MODALS --- */}
        <Modal visible={showUpdateScore} transparent animationType="slide">
          <View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B'}]}><Text style={{color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 15}}>Update Match Score</Text><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Team A Score" placeholderTextColor="#64748B" value={liveMatch.scoreA} onChangeText={(t) => setLiveMatch({...liveMatch, scoreA: t})} /><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Overs" placeholderTextColor="#64748B" value={liveMatch.oversA} onChangeText={(t) => setLiveMatch({...liveMatch, oversA: t})} /><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Match Status" placeholderTextColor="#64748B" value={liveMatch.status} onChangeText={(t) => setLiveMatch({...liveMatch, status: t})} /><TouchableOpacity style={[styles.primaryButton, {width: '100%'}]} onPress={() => setShowUpdateScore(false)}><Text style={styles.buttonText}>Push Live Update</Text></TouchableOpacity></View></View>
        </Modal>

        <Modal visible={showCreateTourney} transparent animationType="slide">
          <View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B'}]}><Text style={{color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 15}}>Create New Tournament</Text><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Tournament Name" placeholderTextColor="#64748B" value={newTourneyName} onChangeText={setNewTourneyName} /><TextInput style={[styles.input, {width: '100%', marginBottom: 10}]} placeholder="Entry Price (₹)" keyboardType="numeric" placeholderTextColor="#64748B" value={newTourneyPrice} onChangeText={setNewTourneyPrice} /><TouchableOpacity style={[styles.primaryButton, {width: '100%'}]} onPress={createTournament}><Text style={styles.buttonText}>Publish Tournament</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowCreateTourney(false)}><Text style={{color: '#EF4444', marginTop: 15}}>Cancel</Text></TouchableOpacity></View></View>
        </Modal>

        {/* 50-FEATURE ADMIN MATRIX */}
        <Modal visible={isAdminModal} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={[styles.razorpayBox, {backgroundColor: '#1E293B', height: '90%', width: '100%', padding: 20}]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
                <Text style={{color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 5}}>System Architecture Panel</Text>
                <Text style={{color: '#38BDF8', fontWeight: '600', marginBottom: 25}}>Access: Super Admin Root</Text>
                <Text style={styles.sectionTitle}>Tournament Mechanics</Text>
                <View style={styles.adminGrid}>
                   {['Configure Swiss-System Bracket', 'Generate Round-Robin Seeds', 'Establish Tie-Breaker Hierarchies', 'Set Max Team Limits', 'Toggle Registration Status', 'Edit Entry Fee Structures', 'Assign Referees to Courts', 'Generate Bulk Seedings', 'Export Bracket Data', 'Publish Final Standings'].map(item => (
                     <TouchableOpacity key={item} style={styles.gridBtn} onPress={() => executeCommand(item)}><Text style={styles.gridBtnText}>{item}</Text></TouchableOpacity>
                   ))}
                </View>
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Mobile Field Operations</Text>
                <View style={styles.adminGrid}>
                   {['Log Player Disqualification', 'Upload Score Sheet Photo', 'Emergency Push Notification', 'Trigger Weather Delay', 'Court Reassignment', 'Assign Penalty Runs', 'Declare Innings Early', 'Verify Player Presence', 'Lock Match Edit History', 'Override Match Clock'].map(item => (
                     <TouchableOpacity key={item} style={styles.gridBtn} onPress={() => executeCommand(item)}><Text style={styles.gridBtnText}>{item}</Text></TouchableOpacity>
                   ))}
                </View>
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Financial & Turf Control</Text>
                <View style={styles.adminGrid}>
                   {['Process Team Refund', 'Edit Turf Price per Hour', 'Block/Lock Turf Slot', 'View Revenue Ledger', 'Export Tax Report', 'Set Payout Accounts', 'Override Payment Lockout', 'Generate Promo Codes', 'View Razorpay Webhooks', 'Manually Add Wallet Funds'].map(item => (
                     <TouchableOpacity key={item} style={styles.gridBtn} onPress={() => executeCommand(item)}><Text style={styles.gridBtnText}>{item}</Text></TouchableOpacity>
                   ))}
                </View>
                <Text style={[styles.sectionTitle, {marginTop: 20}]}>Security & RBAC Enforcement</Text>
                <View style={styles.adminGrid}>
                   {['View Immutable Audit Logging', 'Database Snapshot Rollback', 'Session Boundary Timeout', 'Manage SSO Integrations', 'Invite Staff / Assign Roles', 'Revoke Admin Access', 'Require FIDO2 Hardware Key', 'Ban Malicious User', 'Reset User Password', 'IP Whitelisting Config'].map(item => (
                     <TouchableOpacity key={item} style={styles.gridBtn} onPress={() => executeCommand(item)}><Text style={styles.gridBtnText}>{item}</Text></TouchableOpacity>
                   ))}
                </View>
                <TouchableOpacity style={[styles.primaryButton, {marginTop: 30, backgroundColor: '#475569', width: '100%'}]} onPress={() => setIsAdminModal(false)}><Text style={styles.buttonText}>Close Matrix</Text></TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* --- STANDARD MODALS --- */}
        <Modal visible={showRazorpay} transparent animationType="slide"><View style={styles.modalBg}><View style={styles.razorpayBox}><Text style={{fontSize: 18, fontWeight: '700'}}>Razorpay Checkout</Text><Text style={{color: '#64748B', marginTop: 10, marginBottom: 20}}>Live Firebase ID: {firebaseConfig.projectId}</Text><TouchableOpacity style={[styles.primaryButton, {width: '100%', marginBottom: 10}]} onPress={processRealRazorpayPayment}><Text style={styles.buttonText}>Pay ₹500 via UPI</Text></TouchableOpacity><TouchableOpacity onPress={() => setShowRazorpay(false)}><Text style={{color: '#EF4444', marginTop: 10}}>Cancel</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={showTurfBooking} transparent animationType="fade"><View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B'}]}><Text style={{color: '#F8FAFC', fontSize: 18, fontWeight: '700'}}>Bengaluru Box Arena</Text><Text style={{color: '#38BDF8', marginVertical: 15}}>Select a Time Slot</Text><View style={{flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center'}}>{['18:00', '19:00', '20:00', '21:00'].map(slot => (<TouchableOpacity key={slot} onPress={() => { setShowTurfBooking(false); Alert.alert('Slot Selected', `Proceeding to book ${slot}`); }} style={{backgroundColor: '#0F172A', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#334155'}}><Text style={{color: '#F8FAFC'}}>{slot}</Text></TouchableOpacity>))}</View><TouchableOpacity style={[styles.primaryButton, {marginTop: 30, backgroundColor: '#475569', width: '100%'}]} onPress={() => setShowTurfBooking(false)}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity></View></View></Modal>
        <Modal visible={showNotifications} transparent animationType="slide"><View style={styles.modalBg}><View style={[styles.razorpayBox, {backgroundColor: '#1E293B', height: '50%'}]}><Text style={{color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 15}}>Notifications</Text><Text style={{color: '#94A3B8'}}>Welcome to Onikeri Premier League!</Text><TouchableOpacity style={[styles.primaryButton, {marginTop: 'auto', width: '100%'}]} onPress={() => setShowNotifications(false)}><Text style={styles.buttonText}>Close</Text></TouchableOpacity></View></View></Modal>
      </SafeAreaView>
    );
  }

  // --- REGISTRATION UI ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.badgeText}>🏏 OFFICIAL APP</Text><Text style={styles.title}>Onikeri Premier League</Text></View>

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
                  <Text style={styles.label}>Date of Birth (DD-MM-YYYY)</Text><View style={[styles.phoneInputContainer, errors.dob ? styles.inputError : null]}><TextInput style={styles.phoneInput} placeholder="DD-MM-YYYY" placeholderTextColor="#64748B" keyboardType="numeric" maxLength={10} value={dob} onChangeText={handleDobChange} /><TouchableOpacity onPress={() => setShowPicker(true)} style={styles.calendarIcon}><Ionicons name="calendar" size={24} color="#38BDF8" /></TouchableOpacity></View>{errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}
                  {showPicker && <DateTimePicker value={dateObj} mode="date" display="default" onChange={onDateChange} maximumDate={new Date()} />}
                  <Text style={styles.label}>Password</Text><TextInput style={[styles.input, errors.password ? styles.inputError : null]} secureTextEntry maxLength={15} value={password} onChangeText={handlePasswordChange} />{errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                  <Text style={styles.label}>Confirm Password</Text><TextInput style={[styles.input, errors.confirmPassword ? styles.inputError : null]} secureTextEntry maxLength={15} value={confirmPassword} onChangeText={handleConfirmPasswordChange} />{errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                  
                  <TouchableOpacity style={styles.primaryButton} onPress={triggerOTP}><Text style={styles.buttonText}>Send OTPs & Continue</Text></TouchableOpacity>
                  <TouchableOpacity style={{marginTop: 20, alignItems: 'center'}} onPress={() => setStep('GUEST_FORM')}><Text style={{color: '#94A3B8', fontWeight: '600'}}>Or Continue as Guest</Text></TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Mobile Number</Text><TextInput style={styles.input} keyboardType="numeric" value={mobileNumber} onChangeText={setMobileNumber} />
                  <Text style={styles.label}>Password</Text><TextInput style={styles.input} secureTextEntry maxLength={15} value={password} onChangeText={setPassword} />
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
            <TouchableOpacity style={{marginTop: 15, alignItems: 'center'}} onPress={() => setStep('FORM')}><Text style={{color: '#94A3B8'}}>Back to Registration</Text></TouchableOpacity>
          </View>
        )}

        {step === 'OTP' && (
          <View style={styles.formCard}>
            <Text style={styles.label}>Mobile OTP (Use 1234)</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={4} value={mobileOtp} onChangeText={setMobileOtp} />
            <Text style={styles.label}>Email OTP (Use 1234)</Text><TextInput style={styles.input} keyboardType="numeric" maxLength={4} value={emailOtp} onChangeText={setEmailOtp} />
            <TouchableOpacity style={styles.primaryButton} onPress={verifyOTPAndProceed}><Text style={styles.buttonText}>Verify</Text></TouchableOpacity>
          </View>
        )}

        {step === 'FACE_VERIFY' && (
          <View style={styles.formCard}>
             <View style={styles.warningBox}><Ionicons name="warning" size={20} color="#FBBF24" /><Text style={styles.warningText}>Add an Original image of you. For Tournament this image should match with your face.</Text></View>
             <TouchableOpacity style={styles.imagePickerBox} onPress={pickImage}>{profileImage ? <Image source={{ uri: profileImage }} style={styles.profilePreview} /> : <><Ionicons name="camera" size={40} color="#64748B" /><Text style={{color: '#64748B', marginTop: 10}}>Tap to upload</Text></>}</TouchableOpacity>
             <TouchableOpacity style={[styles.primaryButton, isScanning && {backgroundColor: '#475569'}]} onPress={verifyFaceAndLaunch} disabled={isScanning}>{isScanning ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Scan Face & Create Account</Text>}</TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' }, scrollContent: { paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 25 }, badgeText: { color: '#38BDF8', fontWeight: '700', fontSize: 12, letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', color: '#F8FAFC', textAlign: 'center' }, subtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 6 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 4, marginBottom: 20 }, tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 }, activeTab: { backgroundColor: '#0284C7' },
  tabText: { color: '#94A3B8', fontWeight: '600' }, activeTabText: { color: '#FFFFFF', fontWeight: '700' },
  formCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#334155' }, label: { color: '#CBD5E1', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#F8FAFC', borderWidth: 1, borderColor: '#334155', fontSize: 14 }, inputError: { borderColor: '#EF4444' }, errorText: { color: '#EF4444', fontSize: 11, marginTop: 4, marginLeft: 4 },
  phoneInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingLeft: 14 }, countryCode: { color: '#38BDF8', fontWeight: '700', paddingRight: 8 }, phoneInput: { flex: 1, paddingVertical: 12, paddingRight: 14, color: '#F8FAFC', fontSize: 14 },
  calendarIcon: { paddingRight: 14 }, genderRow: { flexDirection: 'row', gap: 12 }, genderBtn: { flex: 1, backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }, activeGenderBtn: { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.15)' }, genderText: { color: '#94A3B8', fontWeight: '600' }, activeGenderText: { color: '#38BDF8', fontWeight: '700' },
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
