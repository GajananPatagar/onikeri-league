import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { rtdb, db } from '../config/firebase';

export default function DashboardScreen({ user, onLogout }: any) {
  const [activeView, setActiveView] = useState<'HOME' | 'BOOK_BOX' | 'CREATE_MATCH' | 'LEAGUE' | 'ADMIN_PANEL'>('HOME');
  
  // Real Data States
  const [wallet, setWallet] = useState(user?.walletBalance || 0);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: 'weather-cloudy' });
  const [announcement, setAnnouncement] = useState('');

  // Admin Inputs
  const [teamA, setTeamA] = useState('Onikeri Kings');
  const [teamB, setTeamB] = useState('Idagundi Strikers');
  const [announcementInput, setAnnouncementInput] = useState('');

  useEffect(() => {
    // 1. Fetch Live Sirsi Weather
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Sirsi,IN&units=metric&appid=2cee5f64dc55e5ed47cb39251fe97182`);
        const data = await res.json();
        setWeather({ 
          temp: Math.round(data.main.temp) + '°C', 
          condition: data.weather[0].main,
          icon: data.weather[0].main.toLowerCase().includes('rain') ? 'weather-pouring' : 'weather-partly-cloudy' 
        });
      } catch (e) { console.log("Weather error", e); }
    };
    fetchWeather();

    // 2. Listen to RTDB for Live Match
    const matchRef = ref(rtdb, 'liveMatch');
    const unsubMatch = onValue(matchRef, (snapshot) => {
      setLiveMatch(snapshot.exists() ? snapshot.val() : null);
    });

    // 3. Listen to RTDB for Global Announcements
    const alertRef = ref(rtdb, 'leagueSettings/announcement');
    const unsubAlert = onValue(alertRef, (snapshot) => {
      setAnnouncement(snapshot.exists() ? snapshot.val() : '');
    });

    return () => { unsubMatch(); unsubAlert(); };
  }, []);

  const handleAddFunds = () => {
    const options = {
      description: 'Add Wallet Funds',
      image: 'https://cdn-icons-png.flaticon.com/512/8615/8615194.png',
      currency: 'INR',
      key: 'rzp_test_TU3nY0LM3usauA',
      amount: 50000, 
      name: 'Onikeri Premier League',
      prefill: { email: user?.email || '', contact: user?.mobileNumber || '', name: user?.fullName || '' },
      theme: { color: '#0284C7' }
    };

    RazorpayCheckout.open(options).then(async (data: any) => {
      const newBalance = wallet + 500;
      await updateDoc(doc(db, 'users', user.uid), { walletBalance: newBalance });
      setWallet(newBalance);
      Alert.alert('Success', `₹500 added! ID: ${data.razorpay_payment_id}`);
    }).catch((error: any) => {
      Alert.alert('Payment Failed', `Code: ${error.code}`);
    });
  };

  // ==========================================
  // ADMIN WORKING FEATURES LOGIC
  // ==========================================

  // Feature 1 & 2: Start Match with zeroed data
  const handleInitializeMatch = async () => {
    await set(ref(rtdb, 'liveMatch'), {
      teamA, teamB, runs: 0, wickets: 0, totalBalls: 0, status: 'Live'
    });
    Alert.alert('Match Started', 'Live scoreboard is active for all players!');
    setActiveView('LEAGUE');
  };

  // Feature 3: Update Runs, Wickets, and Balls instantly
  const updateScore = async (addedRuns: number, isWicket: boolean, isLegalBall: boolean) => {
    if (!liveMatch) return;
    
    const newRuns = liveMatch.runs + addedRuns;
    const newWickets = isWicket ? liveMatch.wickets + 1 : liveMatch.wickets;
    const newBalls = isLegalBall ? liveMatch.totalBalls + 1 : liveMatch.totalBalls;

    await update(ref(rtdb, 'liveMatch'), {
      runs: newRuns,
      wickets: newWickets,
      totalBalls: newBalls
    });
  };

  // Feature 4: End the Match
  const handleEndMatch = async () => {
    Alert.alert('End Match', 'Are you sure? This removes the live scoreboard.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Match', style: 'destructive', onPress: async () => {
          await remove(ref(rtdb, 'liveMatch'));
          setActiveView('HOME');
      }}
    ]);
  };

  // Feature 5: Broadcast Global Announcement
  const broadcastAnnouncement = async () => {
    await set(ref(rtdb, 'leagueSettings/announcement'), announcementInput);
    Alert.alert('Broadcast Sent', 'Every player can now see this message.');
    setAnnouncementInput('');
  };

  // Helper to calculate Overs from total balls
  const getOvers = (balls: number) => {
    const over = Math.floor(balls / 6);
    const ball = balls % 6;
    return `${over}.${ball}`;
  };

  // ==========================================
  // UI RENDERERS
  // ==========================================

  const renderHeader = (title: string) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setActiveView('HOME')} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
      <Text style={styles.subHeaderText}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  // --- ADMIN VIEW: CREATE MATCH ---
  if (activeView === 'CREATE_MATCH' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Create Live Match')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>Team A Name</Text>
          <TextInput style={styles.input} value={teamA} onChangeText={setTeamA} />
          <Text style={styles.label}>Team B Name</Text>
          <TextInput style={styles.input} value={teamB} onChangeText={setTeamB} />
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]} onPress={handleInitializeMatch}>
            <Text style={styles.actionBtnText}>Broadcast Match Live</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  // --- ADMIN VIEW: GLOBAL PANEL ---
  if (activeView === 'ADMIN_PANEL' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Admin Controls')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Global Alert Broadcast</Text>
          <Text style={{color: '#94A3B8', marginBottom: 10, fontSize: 13}}>Type a message to instantly show it on every player's screen (e.g., "Match delayed by rain").</Text>
          <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline value={announcementInput} onChangeText={setAnnouncementInput} placeholder="Enter alert message..." placeholderTextColor="#475569" />
          
          <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
            <TouchableOpacity style={[styles.actionBtn, {flex: 1}]} onPress={broadcastAnnouncement}>
              <Text style={styles.actionBtnText}>Send Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#EF4444'}]} onPress={() => {setAnnouncementInput(''); broadcastAnnouncement();}}>
              <Text style={styles.actionBtnText}>Clear Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // --- EVERYONE: LIVE LEAGUE ---
  if (activeView === 'LEAGUE') return (
    <View style={styles.subView}>
      {renderHeader('Live Scoreboard')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {liveMatch ? (
          <View>
            <View style={[styles.card, {alignItems: 'center'}]}>
              <Text style={{color: '#EF4444', fontWeight: 'bold', marginBottom: 10, letterSpacing: 2}}>🔴 LIVE</Text>
              <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>{liveMatch.teamA} vs {liveMatch.teamB}</Text>
              <Text style={{color: '#38BDF8', fontSize: 56, fontWeight: '900', marginVertical: 10}}>{liveMatch.runs} / {liveMatch.wickets}</Text>
              <Text style={{color: '#94A3B8', fontSize: 20}}>Overs: <Text style={{color: '#fff', fontWeight: 'bold'}}>{getOvers(liveMatch.totalBalls)}</Text></Text>
            </View>

            {/* ADMIN ONLY SCORE CONTROLS */}
            {user?.appRole === 'SuperAdmin' && (
              <View style={[styles.card, {backgroundColor: '#1E293B', borderColor: '#334155'}]}>
                <Text style={[styles.sectionTitle, {textAlign: 'center'}]}>Admin Score Editor</Text>
                
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginVertical: 15}}>
                  <TouchableOpacity style={styles.scoreBtn} onPress={() => updateScore(0, false, true)}><Text style={styles.scoreBtnText}>Dot (0)</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.scoreBtn} onPress={() => updateScore(1, false, true)}><Text style={styles.scoreBtnText}>+1 Run</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.scoreBtn} onPress={() => updateScore(2, false, true)}><Text style={styles.scoreBtnText}>+2 Runs</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.scoreBtn, {backgroundColor: '#10B981', borderColor: '#10B981'}]} onPress={() => updateScore(4, false, true)}><Text style={[styles.scoreBtnText, {color: '#090D16'}]}>+4 FOUR</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.scoreBtn, {backgroundColor: '#F59E0B', borderColor: '#F59E0B'}]} onPress={() => updateScore(6, false, true)}><Text style={[styles.scoreBtnText, {color: '#090D16'}]}>+6 SIX</Text></TouchableOpacity>
                </View>

                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#EF4444'}]} onPress={() => updateScore(0, true, true)}>
                     <Text style={styles.actionBtnText}>WICKET!</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#475569'}]} onPress={() => updateScore(1, false, false)}>
                     <Text style={styles.actionBtnText}>+1 Wide/NB</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.actionBtn, {marginTop: 30, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444'}]} onPress={handleEndMatch}>
                  <Text style={[styles.actionBtnText, {color: '#EF4444'}]}>End Match</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.card, {alignItems: 'center', paddingVertical: 40}]}>
             <MaterialCommunityIcons name="cricket" size={48} color="#475569" style={{marginBottom: 10}} />
             <Text style={{color: '#94A3B8', fontSize: 16}}>No Live Matches Currently</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Player'}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* GLOBAL ANNOUNCEMENT BANNER */}
        {announcement ? (
          <View style={{backgroundColor: '#FEF08A', padding: 15, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="alert-circle" size={24} color="#854D0E" />
            <Text style={{color: '#854D0E', fontWeight: 'bold', marginLeft: 10, flex: 1}}>{announcement}</Text>
          </View>
        ) : null}

        {/* SIRSI WEATHER WIDGET */}
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
          <Text style={styles.statusTitle}>
            {user?.appRole === 'SuperAdmin' ? 'Admin Dashboard' : 'Player Account'}
          </Text>
          <Text style={styles.statusDesc}>
            {user?.appRole === 'SuperAdmin' 
              ? 'You have full access to control live match scoring and league announcements.' 
              : `Wallet Balance: ₹${wallet}.`}
          </Text>
          
          {user?.appRole !== 'Guest' && user?.appRole !== 'SuperAdmin' && (
             <TouchableOpacity style={styles.payBtn} onPress={handleAddFunds}>
               <Text style={styles.payBtnText}>+ Add ₹500 (Razorpay)</Text>
             </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {user?.appRole !== 'SuperAdmin' && (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('BOOK_BOX')}>
                <MaterialCommunityIcons name="stadium-variant" size={32} color="#38BDF8" />
                <Text style={styles.gridText}>Box Cricket</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem}>
                <MaterialCommunityIcons name="account-group" size={32} color="#10B981" />
                <Text style={styles.gridText}>My Squad</Text>
              </TouchableOpacity>
            </>
          )}

          {user?.appRole === 'SuperAdmin' && (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('CREATE_MATCH')}>
                <MaterialCommunityIcons name="calendar-edit" size={32} color="#F59E0B" />
                <Text style={styles.gridText}>Start Match</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('ADMIN_PANEL')}>
                <MaterialCommunityIcons name="bullhorn" size={32} color="#38BDF8" />
                <Text style={styles.gridText}>Send Alert</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.gridItem, {width: '100%'}]} onPress={() => setActiveView('LEAGUE')}>
            <MaterialCommunityIcons name="trophy" size={32} color="#F59E0B" />
            <Text style={styles.gridText}>Live Scoreboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  subView: { flex: 1, backgroundColor: '#090D16' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' },
  subHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  greeting: { color: '#94A3B8', fontSize: 14 },
  userName: { color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize' },
  logoutBtn: { padding: 8, backgroundColor: '#090D16', borderRadius: 8, borderWidth: 1, borderColor: '#1E293B' },
  scrollContent: { padding: 24 },
  card: { backgroundColor: '#131C2E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 },
  weatherCard: { backgroundColor: '#131C2E', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#1E293B' },
  statusCard: { backgroundColor: '#0284C7', padding: 20, borderRadius: 16, marginBottom: 30 },
  adminCard: { backgroundColor: '#EF4444' },
  statusTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  statusDesc: { color: '#E0F2FE', fontSize: 14, lineHeight: 22 },
  payBtn: { marginTop: 15, backgroundColor: '#fff', padding: 10, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: '#0284C7', fontWeight: 'bold' },
  label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12, marginTop: 10 },
  input: { backgroundColor: '#090D16', color: '#fff', fontSize: 16, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  gridItem: { width: '47%', backgroundColor: '#131C2E', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', marginBottom: 15 },
  gridText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' },
  actionBtn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scoreBtn: { width: '30%', backgroundColor: '#090D16', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#38BDF8', alignItems: 'center' },
  scoreBtnText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }
});
