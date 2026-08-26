import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { doc, updateDoc, collection, getDocs, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { rtdb, db } from '../config/firebase';
import StatsLeaderboardScreen from './StatsLeaderboardScreen';

export default function DashboardScreen({ user, onLogout }: any) {
  const [activeView, setActiveView] = useState<'HOME' | 'LEAGUE' | 'ADMIN_HUB' | 'CREATE_MATCH' | 'ADMIN_PANEL' | 'MANAGE_USERS' | 'MANAGE_BOX' | 'BOOK_BOX' | 'MY_SQUAD' | 'STATS'>('HOME');
  
  // Real Data States
  const [wallet, setWallet] = useState(user?.walletBalance || 0);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: 'weather-cloudy' });
  const [announcement, setAnnouncement] = useState('');
  
  // Admin States
  const [teamA, setTeamA] = useState('Onikeri Kings');
  const [teamB, setTeamB] = useState('Idagundi Strikers');
  const [oversLimit, setOversLimit] = useState('10');
  const [tossWinner, setTossWinner] = useState('Team A');
  const [tossDecision, setTossDecision] = useState('Bat');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [announcementInput, setAnnouncementInput] = useState('');

  // Player Booking & Team States
  const [squadView, setSquadView] = useState<'MENU' | 'CREATE' | 'JOIN' | 'VIEW_TEAM'>('MENU');
  const [newTeamName, setNewTeamName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CAPTAIN' | 'SPLIT'>('SPLIT');
  const [joinCode, setJoinCode] = useState('');
  const [myTeam, setMyTeam] = useState<any>(null);
  const timeSlots = ['06:00 AM', '08:00 AM', '10:00 AM', '04:00 PM', '06:00 PM', '08:00 PM'];

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Sirsi,IN&units=metric&appid=2cee5f64dc55e5ed47cb39251fe97182`);
        const data = await res.json();
        setWeather({ temp: Math.round(data.main.temp) + '°C', condition: data.weather[0].main, icon: data.weather[0].main.toLowerCase().includes('rain') ? 'weather-pouring' : 'weather-partly-cloudy' });
      } catch (e) {}
    };
    fetchWeather();
    const unsubMatch = onValue(ref(rtdb, 'liveMatch'), (snapshot) => setLiveMatch(snapshot.exists() ? snapshot.val() : null));
    const unsubAlert = onValue(ref(rtdb, 'leagueSettings/announcement'), (snapshot) => setAnnouncement(snapshot.exists() ? snapshot.val() : ''));
    return () => { unsubMatch(); unsubAlert(); };
  }, []);

  // ==========================================
  // ADMIN FUNCTIONS
  // ==========================================
  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const adminUpdateWallet = async (targetId: string, currentBalance: number, amount: number) => {
    try {
      await updateDoc(doc(db, 'users', targetId), { walletBalance: currentBalance + amount });
      Alert.alert('Success', `Wallet updated by ₹${amount}`);
      loadUsers();
    } catch (e) { Alert.alert('Error', 'Update failed.'); }
  };

  const changeUserRole = async (targetId: string, newRole: string) => {
    await updateDoc(doc(db, 'users', targetId), { appRole: newRole });
    loadUsers();
  };

  const handleInitializeMatch = async () => {
    await set(ref(rtdb, 'liveMatch'), { 
      teamA, teamB, runs: 0, wickets: 0, totalBalls: 0, 
      oversLimit, tossWinner, tossDecision, innings: 1, status: 'Live' 
    });
    Alert.alert('Match Started', 'Live scoreboard is broadcasting globally.');
    setActiveView('LEAGUE');
  };

  const updateScore = async (addedRuns: number, isWicket: boolean, isLegalBall: boolean, extraType: string = '') => {
    if (!liveMatch) return;
    let newRuns = liveMatch.runs + addedRuns;
    if (extraType === 'Wide' || extraType === 'NoBall') newRuns += 1;
    await update(ref(rtdb, 'liveMatch'), { 
      runs: newRuns, wickets: isWicket ? liveMatch.wickets + 1 : liveMatch.wickets, 
      totalBalls: isLegalBall ? liveMatch.totalBalls + 1 : liveMatch.totalBalls 
    });
  };

  const nextInnings = async () => {
    Alert.alert('Innings Break', 'Start 2nd Innings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: async () => await update(ref(rtdb, 'liveMatch'), { innings: 2, runs: 0, wickets: 0, totalBalls: 0, target: liveMatch.runs + 1 }) }
    ]);
  };

  const handleEndMatch = async () => {
    Alert.alert('End Match', 'Declare match over and clear board?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Match', style: 'destructive', onPress: async () => {
          await remove(ref(rtdb, 'liveMatch'));
          setActiveView('ADMIN_HUB');
      }}
    ]);
  };

  const broadcastAnnouncement = async () => {
    await set(ref(rtdb, 'leagueSettings/announcement'), announcementInput);
    setAnnouncementInput('');
  };

  const getOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

  // ==========================================
  // PLAYER FUNCTIONS
  // ==========================================
  const handleAddFunds = (customAmount: string) => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount < 50) return Alert.alert('Minimum Deposit', 'You must add a minimum of ₹50.');
    const options = { description: 'Add Wallet Funds', currency: 'INR', key: 'rzp_test_TU3nY0LM3usauA', amount: amount * 100, name: 'Onikeri Premier League', prefill: { email: user?.email || '', contact: user?.mobileNumber || '', name: user?.fullName || '' }, theme: { color: '#0284C7' } };
    RazorpayCheckout.open(options).then(async (data: any) => {
      const newBalance = wallet + amount;
      await updateDoc(doc(db, 'users', user.uid), { walletBalance: newBalance });
      setWallet(newBalance);
      Alert.alert('Success', `₹${amount} added successfully!`);
    }).catch((error: any) => { Alert.alert('Payment Failed', `Code: ${error.code}`); });
  };

  const handleCreateTeam = async () => {
    if (newTeamName.length < 3) return Alert.alert('Error', 'Team name too short.');
    if (paymentMode === 'CAPTAIN' && wallet < 1000) return Alert.alert('Insufficient Funds', 'You need ₹1000 to pay for the whole team upfront.');
    if (paymentMode === 'SPLIT' && wallet < 100) return Alert.alert('Insufficient Funds', 'You need ₹100 to pay your individual split share.');

    const uniqueCode = 'OKL-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const cost = paymentMode === 'CAPTAIN' ? 1000 : 100;
    const newBalance = wallet - cost;
    await updateDoc(doc(db, 'users', user.uid), { walletBalance: newBalance });
    setWallet(newBalance);

    const teamData = { teamName: newTeamName, captain: user.fullName, code: uniqueCode, paymentMode, members: [user.fullName], status: 'Looking for players' };
    await setDoc(doc(db, 'teams', uniqueCode), teamData);
    setMyTeam(teamData);
    setSquadView('VIEW_TEAM');
    Alert.alert('Squad Created!', `Your invite code is ${uniqueCode}. Share this with your friends!`);
  };

  const handleJoinTeam = async () => {
    if (joinCode.length < 5) return Alert.alert('Invalid Code', 'Please enter a valid OKL code.');
    try {
      const teamDoc = await getDoc(doc(db, 'teams', joinCode.toUpperCase()));
      if (!teamDoc.exists()) return Alert.alert('Not Found', 'No team found with this code.');
      const teamData = teamDoc.data();
      if (teamData.paymentMode === 'SPLIT') {
        if (wallet < 100) return Alert.alert('Payment Required', 'This is a Split Payment team. You need ₹100 in your wallet to join.');
        Alert.alert('Split Payment', '₹100 will be deducted from your wallet to join.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Pay & Join', onPress: async () => {
              const newBalance = wallet - 100;
              await updateDoc(doc(db, 'users', user.uid), { walletBalance: newBalance });
              setWallet(newBalance);
              finishJoiningTeam(teamData, joinCode.toUpperCase());
          }}
        ]);
      } else {
        Alert.alert('Captain Paid', 'Your captain has already covered the booking fee!', [
          { text: 'Join Now', onPress: () => finishJoiningTeam(teamData, joinCode.toUpperCase()) }
        ]);
      }
    } catch (e) { Alert.alert('Error', 'Could not join team.'); }
  };

  const finishJoiningTeam = async (teamData: any, code: string) => {
    const updatedMembers = [...teamData.members, user.fullName];
    await updateDoc(doc(db, 'teams', code), { members: updatedMembers });
    setMyTeam({ ...teamData, members: updatedMembers });
    setSquadView('VIEW_TEAM');
  };

  // ==========================================
  // UI RENDERERS
  // ==========================================
  const renderHeader = (title: string, backTo: any = 'HOME') => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setActiveView(backTo)} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
      <Text style={styles.subHeaderText}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  // --- INTEGRATION: PHASE 1 STATS & LEADERBOARD ---
  if (activeView === 'STATS') {
    return <StatsLeaderboardScreen user={user} onBack={() => setActiveView('HOME')} />;
  }

  // --- PLAYER VIEW: SQUAD & TEAM MANAGEMENT ---
  if (activeView === 'MY_SQUAD' && user?.appRole !== 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('My Squad', 'HOME')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {squadView === 'MENU' && (
          <View>
            <TouchableOpacity style={[styles.card, {alignItems: 'center', borderColor: '#38BDF8', paddingVertical: 40}]} onPress={() => setSquadView('CREATE')}>
              <MaterialCommunityIcons name="shield-star" size={48} color="#38BDF8" />
              <Text style={{color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10}}>Create a Team</Text>
              <Text style={{color: '#94A3B8', marginTop: 5}}>Generate an invite code and book a slot.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.card, {alignItems: 'center', borderColor: '#10B981', paddingVertical: 40}]} onPress={() => setSquadView('JOIN')}>
              <MaterialCommunityIcons name="account-group" size={48} color="#10B981" />
              <Text style={{color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10}}>Join a Team</Text>
              <Text style={{color: '#94A3B8', marginTop: 5}}>Have an invite code? Join your friends here.</Text>
            </TouchableOpacity>
          </View>
        )}
        {squadView === 'CREATE' && (
          <View style={styles.card}>
             <TouchableOpacity style={{marginBottom: 20}} onPress={() => setSquadView('MENU')}><Text style={{color: '#38BDF8'}}>← Back</Text></TouchableOpacity>
             <Text style={styles.sectionTitle}>Squad Setup</Text>
             <Text style={styles.label}>Team Name</Text>
             <TextInput style={styles.input} placeholder="e.g. Onikeri Kings" placeholderTextColor="#475569" value={newTeamName} onChangeText={setNewTeamName} />
             <Text style={styles.label}>Booking Payment Mode</Text>
             <TouchableOpacity style={[styles.scoreBtn, {marginBottom: 10}, paymentMode === 'CAPTAIN' && styles.activeBtn]} onPress={() => setPaymentMode('CAPTAIN')}>
               <Text style={styles.scoreBtnText}>Captain Pays All (₹1000 upfront)</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.scoreBtn, {marginBottom: 20}, paymentMode === 'SPLIT' && styles.activeBtn]} onPress={() => setPaymentMode('SPLIT')}>
               <Text style={styles.scoreBtnText}>Split Individually (₹100 per player)</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]} onPress={handleCreateTeam}>
               <Text style={styles.actionBtnText}>Pay & Generate Invite Code</Text>
             </TouchableOpacity>
          </View>
        )}
        {squadView === 'JOIN' && (
          <View style={styles.card}>
             <TouchableOpacity style={{marginBottom: 20}} onPress={() => setSquadView('MENU')}><Text style={{color: '#38BDF8'}}>← Back</Text></TouchableOpacity>
             <Text style={styles.sectionTitle}>Join a Squad</Text>
             <Text style={styles.label}>Enter Unique Invite Code</Text>
             <TextInput style={styles.input} placeholder="e.g. OKL-ABCD" placeholderTextColor="#475569" autoCapitalize="characters" value={joinCode} onChangeText={setJoinCode} />
             <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981', marginTop: 20}]} onPress={handleJoinTeam}>
               <Text style={styles.actionBtnText}>Verify Code & Join</Text>
             </TouchableOpacity>
          </View>
        )}
        {squadView === 'VIEW_TEAM' && myTeam && (
          <View style={styles.card}>
             <Text style={{color: '#38BDF8', fontWeight: 'bold', letterSpacing: 1}}>INVITE CODE: {myTeam.code}</Text>
             <Text style={{color: '#fff', fontSize: 28, fontWeight: 'bold', marginVertical: 10}}>{myTeam.teamName}</Text>
             <Text style={{color: '#94A3B8', marginBottom: 20}}>Payment Rule: {myTeam.paymentMode === 'SPLIT' ? 'Split Payment' : 'Captain Paid'}</Text>
             <Text style={styles.sectionTitle}>Roster ({myTeam.members.length}/10)</Text>
             {myTeam.members.map((m: string, i: number) => (
                <Text key={i} style={{color: '#F8FAFC', fontSize: 16, marginBottom: 5, backgroundColor: '#090D16', padding: 10, borderRadius: 8}}>👤 {m} {i === 0 ? '(C)' : ''}</Text>
             ))}
             <TouchableOpacity style={[styles.actionBtn, {marginTop: 30}]} onPress={() => setActiveView('BOOK_BOX')}>
               <Text style={styles.actionBtnText}>Book Box Cricket Slot Now</Text>
             </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // --- PLAYER VIEW: BOX CRICKET BOOKING ---
  if (activeView === 'BOOK_BOX' && user?.appRole !== 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Book Box Cricket', 'HOME')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
         <View style={styles.card}>
            <Text style={styles.sectionTitle}>Select a Slot</Text>
            <Text style={{color: '#94A3B8', marginBottom: 15}}>Available for Today.</Text>
            {timeSlots.map((time, i) => (
               <View key={i} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090D16', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#1E293B'}}>
                 <Text style={{color: '#F8FAFC', fontWeight: 'bold'}}>{time}</Text>
                 <TouchableOpacity style={{backgroundColor: '#0284C7', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8}} onPress={() => Alert.alert('Book Slot', `Do you want to book ${time} for your team?`, [{text: 'Cancel'}, {text: 'Confirm Booking'}])}>
                   <Text style={{color: '#fff', fontWeight: 'bold'}}>Select</Text>
                 </TouchableOpacity>
               </View>
            ))}
         </View>
      </ScrollView>
    </View>
  );

  // --- ADMIN VIEW: CREATE MATCH ---
  if (activeView === 'CREATE_MATCH' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Create Pro Match', 'ADMIN_HUB')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Match Config</Text>
          <Text style={styles.label}>Team A Name</Text>
          <TextInput style={styles.input} value={teamA} onChangeText={setTeamA} />
          <Text style={styles.label}>Team B Name</Text>
          <TextInput style={styles.input} value={teamB} onChangeText={setTeamB} />
          <Text style={styles.label}>Total Overs</Text>
          <TextInput style={styles.input} value={oversLimit} onChangeText={setOversLimit} keyboardType="number-pad" />
          <Text style={styles.label}>Toss Won By</Text>
          <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
            <TouchableOpacity style={[styles.scoreBtn, tossWinner === 'Team A' && styles.activeBtn]} onPress={() => setTossWinner('Team A')}><Text style={styles.scoreBtnText}>Team A</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.scoreBtn, tossWinner === 'Team B' && styles.activeBtn]} onPress={() => setTossWinner('Team B')}><Text style={styles.scoreBtnText}>Team B</Text></TouchableOpacity>
          </View>
          <Text style={styles.label}>Elected To</Text>
          <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
            <TouchableOpacity style={[styles.scoreBtn, tossDecision === 'Bat' && styles.activeBtn]} onPress={() => setTossDecision('Bat')}><Text style={styles.scoreBtnText}>Bat First</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.scoreBtn, tossDecision === 'Bowl' && styles.activeBtn]} onPress={() => setTossDecision('Bowl')}><Text style={styles.scoreBtnText}>Bowl First</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]} onPress={handleInitializeMatch}>
            <Text style={styles.actionBtnText}>Broadcast Match Live</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // --- ADMIN VIEW: BOX CRICKET MANAGER ---
  if (activeView === 'MANAGE_BOX' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Box Cricket Admin', 'ADMIN_HUB')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
         <View style={styles.card}>
            <Text style={styles.sectionTitle}>Slot Manager</Text>
            <Text style={{color: '#94A3B8', marginBottom: 15}}>Tap a slot to force-book, block, or clear it.</Text>
            {timeSlots.map((time, i) => (
               <View key={i} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#090D16', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#1E293B'}}>
                 <Text style={{color: '#F8FAFC', fontWeight: 'bold'}}>{time}</Text>
                 <View style={{flexDirection: 'row', gap: 10}}>
                   <TouchableOpacity style={{backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6}} onPress={() => Alert.alert('Booked', `${time} marked as booked.`)}>
                     <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>Book</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={{backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6}} onPress={() => Alert.alert('Blocked', `${time} marked for maintenance.`)}>
                     <Text style={{color: '#fff', fontSize: 12, fontWeight: 'bold'}}>Block</Text>
                   </TouchableOpacity>
                 </View>
               </View>
            ))}
         </View>
      </ScrollView>
    </View>
  );

  // --- ADMIN VIEW: USER & FINANCE MANAGER ---
  if (activeView === 'MANAGE_USERS' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('User & Finance Hub', 'ADMIN_HUB')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {usersList.map((u, index) => (
          <View key={index} style={styles.card}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View>
                <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>{u.fullName}</Text>
                <Text style={{color: '#38BDF8', fontSize: 14, marginBottom: 10}}>{u.appRole} | {u.playingRole}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={{color: '#94A3B8', fontSize: 12}}>Wallet</Text>
                <Text style={{color: '#10B981', fontSize: 18, fontWeight: 'bold'}}>₹{u.walletBalance || 0}</Text>
              </View>
            </View>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 10}}>
              <TouchableOpacity style={[styles.actionBtn, {flex: 1, padding: 10}]} onPress={() => adminUpdateWallet(u.id, u.walletBalance, 500)}><Text style={{color: '#fff', fontWeight: 'bold', textAlign: 'center'}}>+ ₹500</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, {flex: 1, padding: 10, backgroundColor: '#EF4444'}]} onPress={() => adminUpdateWallet(u.id, u.walletBalance, -500)}><Text style={{color: '#fff', fontWeight: 'bold', textAlign: 'center'}}>- ₹500</Text></TouchableOpacity>
            </View>
            <View style={{flexDirection: 'row', gap: 10}}>
              {u.appRole === 'Player' ? (
                <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#F59E0B', padding: 10}]} onPress={() => changeUserRole(u.id, 'SuperAdmin')}><Text style={{color: '#fff', fontWeight: 'bold', textAlign: 'center'}}>Make Admin</Text></TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#475569', padding: 10}]} onPress={() => changeUserRole(u.id, 'Player')}><Text style={{color: '#fff', fontWeight: 'bold', textAlign: 'center'}}>Revoke</Text></TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // --- ADMIN VIEW: MASTER CONTROL HUB ---
  if (activeView === 'ADMIN_HUB' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Admin Control Center')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Match Management</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('CREATE_MATCH')}><MaterialCommunityIcons name="calendar-edit" size={32} color="#10B981" /><Text style={styles.gridText}>Start Match</Text></TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('LEAGUE')}><MaterialCommunityIcons name="scoreboard" size={32} color="#F59E0B" /><Text style={styles.gridText}>Live Editor</Text></TouchableOpacity>
        </View>
        <Text style={styles.sectionTitle}>League Management</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('MANAGE_BOX')}><MaterialCommunityIcons name="stadium-variant" size={32} color="#8B5CF6" /><Text style={styles.gridText}>Box Cricket</Text></TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => { loadUsers(); setActiveView('MANAGE_USERS'); }}><MaterialCommunityIcons name="account-group" size={32} color="#38BDF8" /><Text style={styles.gridText}>Users & Finance</Text></TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Global Alert Broadcast</Text>
          <TextInput style={[styles.input, {height: 60}]} value={announcementInput} onChangeText={setAnnouncementInput} placeholder="Type alert..." placeholderTextColor="#475569" />
          <TouchableOpacity style={[styles.actionBtn, {marginTop: 10}]} onPress={broadcastAnnouncement}><Text style={styles.actionBtnText}>Broadcast Message</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#EF4444', marginTop: 10}]} onPress={() => {setAnnouncementInput(''); broadcastAnnouncement();}}><Text style={styles.actionBtnText}>Clear Banner</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // --- LIVE LEAGUE & SCOREBOARD ---
  if (activeView === 'LEAGUE') return (
    <View style={styles.subView}>
      {renderHeader('Live Scoreboard')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {liveMatch ? (
          <View>
            <View style={[styles.card, {alignItems: 'center'}]}>
              <Text style={{color: '#EF4444', fontWeight: 'bold', marginBottom: 10, letterSpacing: 2}}>🔴 INNINGS {liveMatch.innings}</Text>
              <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>{liveMatch.teamA} vs {liveMatch.teamB}</Text>
              {liveMatch.innings === 2 && <Text style={{color: '#F59E0B', fontSize: 14, marginTop: 5}}>Target: {liveMatch.target}</Text>}
              <Text style={{color: '#38BDF8', fontSize: 56, fontWeight: '900', marginVertical: 10}}>{liveMatch.runs} / {liveMatch.wickets}</Text>
              <Text style={{color: '#94A3B8', fontSize: 20}}>Overs: <Text style={{color: '#fff', fontWeight: 'bold'}}>{getOvers(liveMatch.totalBalls)}</Text> / {liveMatch.oversLimit}</Text>
            </View>
            {user?.appRole === 'SuperAdmin' && (
              <View style={[styles.card, {backgroundColor: '#1E293B'}]}>
                <Text style={[styles.sectionTitle, {textAlign: 'center'}]}>Pro Score Editor</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginVertical: 15}}>
                  <TouchableOpacity style={styles.scoreBtn} onPress={() => updateScore(0, false, true)}><Text style={styles.scoreBtnText}>Dot</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.scoreBtn} onPress={() => updateScore(1, false, true)}><Text style={styles.scoreBtnText}>+1</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.scoreBtn} onPress={() => updateScore(2, false, true)}><Text style={styles.scoreBtnText}>+2</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.scoreBtn} onPress={() => updateScore(3, false, true)}><Text style={styles.scoreBtnText}>+3</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.scoreBtn, {backgroundColor: '#10B981'}]} onPress={() => updateScore(4, false, true)}><Text style={[styles.scoreBtnText, {color: '#090D16'}]}>+4</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.scoreBtn, {backgroundColor: '#F59E0B'}]} onPress={() => updateScore(6, false, true)}><Text style={[styles.scoreBtnText, {color: '#090D16'}]}>+6</Text></TouchableOpacity>
                </View>
                <Text style={[styles.label, {textAlign: 'center', marginBottom: 10}]}>Extras & Events</Text>
                <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                  <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#475569'}]} onPress={() => updateScore(0, false, false, 'Wide')}><Text style={styles.actionBtnText}>Wide (+1)</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#475569'}]} onPress={() => updateScore(0, false, false, 'NoBall')}><Text style={styles.actionBtnText}>No Ball (+1)</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#EF4444'}]} onPress={() => updateScore(0, true, true)}><Text style={styles.actionBtnText}>WICKET</Text></TouchableOpacity>
                </View>
                {liveMatch.innings === 1 && (
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#F59E0B', marginBottom: 10}]} onPress={nextInnings}>
                    <Text style={styles.actionBtnText}>Start 2nd Innings</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444'}]} onPress={handleEndMatch}>
                  <Text style={[styles.actionBtnText, {color: '#EF4444'}]}>Declare Match Winner</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.card, {alignItems: 'center', paddingVertical: 40}]}><MaterialCommunityIcons name="cricket" size={48} color="#475569" style={{marginBottom: 10}} /><Text style={{color: '#94A3B8', fontSize: 16}}>No Live Matches Currently</Text></View>
        )}
      </ScrollView>
    </View>
  );

  // --- MAIN DASHBOARD (HOME) ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.greeting}>Welcome back,</Text><Text style={styles.userName}>{user?.fullName || 'Player'}</Text></View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}><Ionicons name="log-out-outline" size={24} color="#EF4444" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {announcement ? (
          <View style={{backgroundColor: '#FEF08A', padding: 15, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="alert-circle" size={24} color="#854D0E" /><Text style={{color: '#854D0E', fontWeight: 'bold', marginLeft: 10, flex: 1}}>{announcement}</Text>
          </View>
        ) : null}
        
        <View style={styles.weatherCard}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialCommunityIcons name={weather.icon as any} size={36} color="#38BDF8" />
            <View style={{marginLeft: 15}}>
              <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>Sirsi, Karnataka</Text>
              <Text style={{color: '#E0F2FE', fontSize: 14}}>{weather.temp} - {weather.condition}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.statusCard, user?.appRole === 'SuperAdmin' ? styles.adminCard : {}]}>
          <Text style={styles.statusTitle}>{user?.appRole === 'SuperAdmin' ? 'Admin Dashboard' : 'My Wallet'}</Text>
          <Text style={[styles.statusDesc, {fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 15}]}>
            {user?.appRole === 'SuperAdmin' ? 'Total League Control Active' : `₹${wallet}`}
          </Text>
          
          {user?.appRole !== 'SuperAdmin' && (
            <View>
              <Text style={{color: '#E0F2FE', fontSize: 12, marginBottom: 8}}>Fast Recharge (Min ₹50)</Text>
              <View style={{flexDirection: 'row', gap: 10, flexWrap: 'wrap'}}>
                {['50', '100', '200', '500'].map(amt => (
                  <TouchableOpacity key={amt} style={{backgroundColor: '#090D16', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#38BDF8'}} onPress={() => handleAddFunds(amt)}>
                    <Text style={{color: '#38BDF8', fontWeight: 'bold'}}>+₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>League Hub</Text>
        <View style={styles.grid}>
          {user?.appRole === 'SuperAdmin' ? (
            <TouchableOpacity style={[styles.gridItem, {width: '100%', borderColor: '#EF4444'}]} onPress={() => setActiveView('ADMIN_HUB')}>
              <MaterialCommunityIcons name="shield-account" size={32} color="#EF4444" /><Text style={[styles.gridText, {color: '#EF4444'}]}>Open Admin Control Center</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('BOOK_BOX')}><MaterialCommunityIcons name="stadium-variant" size={32} color="#38BDF8" /><Text style={styles.gridText}>Book Box Cricket</Text></TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => {setSquadView(myTeam ? 'VIEW_TEAM' : 'MENU'); setActiveView('MY_SQUAD');}}><MaterialCommunityIcons name="account-group" size={32} color="#10B981" /><Text style={styles.gridText}>My Squad</Text></TouchableOpacity>
            </>
          )}
          
          {/* Phase 1 Integration: Player Stats & Leaderboards */}
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('STATS')}>
            <MaterialCommunityIcons name="podium" size={32} color="#F59E0B" />
            <Text style={styles.gridText}>Stats & Ranks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('LEAGUE')}>
            <MaterialCommunityIcons name="trophy" size={32} color="#38BDF8" />
            <Text style={styles.gridText}>Live Score</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' }, subView: { flex: 1, backgroundColor: '#090D16' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' }, subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' }, subHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, backBtn: { padding: 5 }, greeting: { color: '#94A3B8', fontSize: 14 }, userName: { color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize' }, logoutBtn: { padding: 8, backgroundColor: '#090D16', borderRadius: 8, borderWidth: 1, borderColor: '#1E293B' }, scrollContent: { padding: 24 }, card: { backgroundColor: '#131C2E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 }, weatherCard: { backgroundColor: '#131C2E', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#1E293B' }, statusCard: { backgroundColor: '#0284C7', padding: 20, borderRadius: 16, marginBottom: 30 }, adminCard: { backgroundColor: '#EF4444' }, statusTitle: { color: '#E0F2FE', fontSize: 14, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' }, statusDesc: { color: '#E0F2FE', fontSize: 14, lineHeight: 22 }, label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12, marginTop: 10 }, input: { backgroundColor: '#090D16', color: '#fff', fontSize: 16, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' }, gridItem: { width: '47%', backgroundColor: '#131C2E', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', marginBottom: 15 }, gridText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' }, actionBtn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 }, actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }, scoreBtn: { flexGrow: 1, minWidth: '30%', backgroundColor: '#090D16', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#38BDF8', alignItems: 'center' }, scoreBtnText: { color: '#fff', fontWeight: 'bold' }, activeBtn: { backgroundColor: '#38BDF8' }, sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }
});
