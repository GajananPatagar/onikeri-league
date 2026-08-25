import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { doc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { rtdb, db } from '../config/firebase';

export default function DashboardScreen({ user, onLogout }: any) {
  const [activeView, setActiveView] = useState<'HOME' | 'LEAGUE' | 'ADMIN_HUB' | 'CREATE_MATCH' | 'ADMIN_PANEL' | 'MANAGE_USERS' | 'MANAGE_BOX'>('HOME');
  
  // States
  const [wallet, setWallet] = useState(user?.walletBalance || 0);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: 'weather-cloudy' });
  const [announcement, setAnnouncement] = useState('');
  
  // Admin States
  const [teamA, setTeamA] = useState('Onikeri Kings');
  const [teamB, setTeamB] = useState('Idagundi Strikers');
  const [announcementInput, setAnnouncementInput] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Sirsi,IN&units=metric&appid=2cee5f64dc55e5ed47cb39251fe97182`);
        const data = await res.json();
        setWeather({ temp: Math.round(data.main.temp) + '°C', condition: data.weather[0].main, icon: data.weather[0].main.toLowerCase().includes('rain') ? 'weather-pouring' : 'weather-partly-cloudy' });
      } catch (e) { console.log("Weather error", e); }
    };
    fetchWeather();

    const unsubMatch = onValue(ref(rtdb, 'liveMatch'), (snapshot) => setLiveMatch(snapshot.exists() ? snapshot.val() : null));
    const unsubAlert = onValue(ref(rtdb, 'leagueSettings/announcement'), (snapshot) => setAnnouncement(snapshot.exists() ? snapshot.val() : ''));
    return () => { unsubMatch(); unsubAlert(); };
  }, []);

  // ==========================================
  // NEW USER MANAGEMENT LOGIC (FIRESTORE)
  // ==========================================
  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(fetchedUsers);
    } catch (error) { Alert.alert('Error', 'Failed to fetch users from database.'); }
  };

  const changeUserRole = async (targetUserId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', targetUserId), { appRole: newRole });
      Alert.alert('Success', `User updated to ${newRole}`);
      loadUsers(); // Refresh the list
    } catch (error) { Alert.alert('Error', 'Could not update user role.'); }
  };

  const removeUser = (targetUserId: string) => {
    Alert.alert('Delete User', 'Are you sure you want to permanently delete this player?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'users', targetUserId));
          loadUsers();
      }}
    ]);
  };

  // ==========================================
  // EXISTING RTDB & RAZORPAY LOGIC
  // ==========================================
  const handleAddFunds = () => {
    const options = { description: 'Add Wallet Funds', image: 'https://cdn-icons-png.flaticon.com/512/8615/8615194.png', currency: 'INR', key: 'rzp_test_TU3nY0LM3usauA', amount: 50000, name: 'Onikeri Premier League', prefill: { email: user?.email || '', contact: user?.mobileNumber || '', name: user?.fullName || '' }, theme: { color: '#0284C7' } };
    RazorpayCheckout.open(options).then(async (data: any) => {
      const newBalance = wallet + 500;
      await updateDoc(doc(db, 'users', user.uid), { walletBalance: newBalance });
      setWallet(newBalance);
      Alert.alert('Success', `₹500 added! ID: ${data.razorpay_payment_id}`);
    }).catch((error: any) => { Alert.alert('Payment Failed', `Code: ${error.code}`); });
  };

  const handleInitializeMatch = async () => { await set(ref(rtdb, 'liveMatch'), { teamA, teamB, runs: 0, wickets: 0, totalBalls: 0, status: 'Live' }); Alert.alert('Match Started', 'Live scoreboard is active for all players!'); setActiveView('LEAGUE'); };
  const updateScore = async (addedRuns: number, isWicket: boolean, isLegalBall: boolean) => {
    if (!liveMatch) return;
    await update(ref(rtdb, 'liveMatch'), { runs: liveMatch.runs + addedRuns, wickets: isWicket ? liveMatch.wickets + 1 : liveMatch.wickets, totalBalls: isLegalBall ? liveMatch.totalBalls + 1 : liveMatch.totalBalls });
  };
  const handleEndMatch = async () => { await remove(ref(rtdb, 'liveMatch')); setActiveView('ADMIN_HUB'); };
  const broadcastAnnouncement = async () => { await set(ref(rtdb, 'leagueSettings/announcement'), announcementInput); Alert.alert('Broadcast Sent'); setAnnouncementInput(''); };
  const getOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

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

  // --- ADMIN VIEW: USER MANAGEMENT ---
  if (activeView === 'MANAGE_USERS' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Player Database', 'ADMIN_HUB')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {usersList.map((u, index) => (
          <View key={index} style={styles.card}>
            <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>{u.fullName}</Text>
            <Text style={{color: '#38BDF8', fontSize: 14, marginBottom: 15}}>{u.appRole} | {u.playingRole}</Text>
            
            <View style={{flexDirection: 'row', gap: 10}}>
              {u.appRole === 'Player' ? (
                <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#F59E0B'}]} onPress={() => changeUserRole(u.id, 'SuperAdmin')}><Text style={styles.actionBtnText}>Make Admin</Text></TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#475569'}]} onPress={() => changeUserRole(u.id, 'Player')}><Text style={styles.actionBtnText}>Revoke Admin</Text></TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#EF4444'}]} onPress={() => removeUser(u.id)}><Text style={styles.actionBtnText}>Delete User</Text></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // --- ADMIN VIEW: BOX CRICKET MANAGEMENT ---
  if (activeView === 'MANAGE_BOX' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Box Cricket Hub', 'ADMIN_HUB')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
         <View style={[styles.card, {alignItems: 'center', paddingVertical: 40}]}>
             <MaterialCommunityIcons name="calendar-lock" size={48} color="#475569" style={{marginBottom: 10}} />
             <Text style={{color: '#94A3B8', fontSize: 16, textAlign: 'center'}}>Box Cricket Booking engine goes here. Connect to Firestore to display time slots.</Text>
          </View>
      </ScrollView>
    </View>
  );

  // --- ADMIN VIEW: CENTRAL HUB ---
  if (activeView === 'ADMIN_HUB' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Admin Control Center')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('CREATE_MATCH')}><MaterialCommunityIcons name="calendar-edit" size={32} color="#F59E0B" /><Text style={styles.gridText}>Start Match</Text></TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('ADMIN_PANEL')}><MaterialCommunityIcons name="bullhorn" size={32} color="#38BDF8" /><Text style={styles.gridText}>Global Alert</Text></TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => { loadUsers(); setActiveView('MANAGE_USERS'); }}><MaterialCommunityIcons name="account-group" size={32} color="#10B981" /><Text style={styles.gridText}>User Database</Text></TouchableOpacity>
          <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('MANAGE_BOX')}><MaterialCommunityIcons name="stadium-variant" size={32} color="#8B5CF6" /><Text style={styles.gridText}>Box Cricket</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444', marginTop: 30}]} onPress={handleEndMatch}>
          <Text style={[styles.actionBtnText, {color: '#EF4444'}]}>Force Reset Live Scoreboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // ... KEEP EXISTING LEAGUE VIEW ...
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
                  <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#EF4444'}]} onPress={() => updateScore(0, true, true)}><Text style={styles.actionBtnText}>WICKET!</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#475569'}]} onPress={() => updateScore(1, false, false)}><Text style={styles.actionBtnText}>+1 Wide/NB</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.actionBtn, {marginTop: 30, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EF4444'}]} onPress={handleEndMatch}><Text style={[styles.actionBtnText, {color: '#EF4444'}]}>End Match</Text></TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.card, {alignItems: 'center', paddingVertical: 40}]}><MaterialCommunityIcons name="cricket" size={48} color="#475569" style={{marginBottom: 10}} /><Text style={{color: '#94A3B8', fontSize: 16}}>No Live Matches Currently</Text></View>
        )}
      </ScrollView>
    </View>
  );

  // ... KEEP EXISTING CREATE_MATCH & ADMIN_PANEL VIEWS ...
  if (activeView === 'CREATE_MATCH' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Create Live Match', 'ADMIN_HUB')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>Team A Name</Text>
          <TextInput style={styles.input} value={teamA} onChangeText={setTeamA} />
          <Text style={styles.label}>Team B Name</Text>
          <TextInput style={styles.input} value={teamB} onChangeText={setTeamB} />
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]} onPress={handleInitializeMatch}><Text style={styles.actionBtnText}>Broadcast Match Live</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  if (activeView === 'ADMIN_PANEL' && user?.appRole === 'SuperAdmin') return (
    <View style={styles.subView}>
      {renderHeader('Global Alert', 'ADMIN_HUB')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Global Alert Broadcast</Text>
          <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} multiline value={announcementInput} onChangeText={setAnnouncementInput} placeholder="Enter alert message..." placeholderTextColor="#475569" />
          <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
            <TouchableOpacity style={[styles.actionBtn, {flex: 1}]} onPress={broadcastAnnouncement}><Text style={styles.actionBtnText}>Send Alert</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, {flex: 1, backgroundColor: '#EF4444'}]} onPress={() => {setAnnouncementInput(''); broadcastAnnouncement();}}><Text style={styles.actionBtnText}>Clear</Text></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  // --- HOME VIEW ---
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
          <Text style={styles.statusTitle}>{user?.appRole === 'SuperAdmin' ? 'Admin Dashboard' : 'Player Account'}</Text>
          <Text style={styles.statusDesc}>{user?.appRole === 'SuperAdmin' ? 'SuperAdmin access granted.' : `Wallet Balance: ₹${wallet}.`}</Text>
          {user?.appRole !== 'Guest' && user?.appRole !== 'SuperAdmin' && (
             <TouchableOpacity style={styles.payBtn} onPress={handleAddFunds}><Text style={styles.payBtnText}>+ Add ₹500 (Razorpay)</Text></TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {user?.appRole !== 'SuperAdmin' ? (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('MANAGE_BOX')}><MaterialCommunityIcons name="stadium-variant" size={32} color="#38BDF8" /><Text style={styles.gridText}>Box Cricket</Text></TouchableOpacity>
              <TouchableOpacity style={styles.gridItem}><MaterialCommunityIcons name="account-group" size={32} color="#10B981" /><Text style={styles.gridText}>My Squad</Text></TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.gridItem, {width: '100%', borderColor: '#EF4444'}]} onPress={() => setActiveView('ADMIN_HUB')}>
              <MaterialCommunityIcons name="shield-account" size={32} color="#EF4444" />
              <Text style={[styles.gridText, {color: '#EF4444'}]}>Admin Control Center</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.gridItem, {width: '100%'}]} onPress={() => setActiveView('LEAGUE')}><MaterialCommunityIcons name="trophy" size={32} color="#F59E0B" /><Text style={styles.gridText}>Live Scoreboard</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' }, subView: { flex: 1, backgroundColor: '#090D16' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' }, subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' }, subHeaderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, backBtn: { padding: 5 }, greeting: { color: '#94A3B8', fontSize: 14 }, userName: { color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize' }, logoutBtn: { padding: 8, backgroundColor: '#090D16', borderRadius: 8, borderWidth: 1, borderColor: '#1E293B' }, scrollContent: { padding: 24 }, card: { backgroundColor: '#131C2E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 }, weatherCard: { backgroundColor: '#131C2E', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#1E293B' }, statusCard: { backgroundColor: '#0284C7', padding: 20, borderRadius: 16, marginBottom: 30 }, adminCard: { backgroundColor: '#EF4444' }, statusTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }, statusDesc: { color: '#E0F2FE', fontSize: 14, lineHeight: 22 }, payBtn: { marginTop: 15, backgroundColor: '#fff', padding: 10, borderRadius: 8, alignItems: 'center' }, payBtnText: { color: '#0284C7', fontWeight: 'bold' }, label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12, marginTop: 10 }, input: { backgroundColor: '#090D16', color: '#fff', fontSize: 16, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' }, gridItem: { width: '47%', backgroundColor: '#131C2E', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', marginBottom: 15 }, gridText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' }, actionBtn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 }, actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }, scoreBtn: { width: '30%', backgroundColor: '#090D16', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#38BDF8', alignItems: 'center' }, scoreBtnText: { color: '#fff', fontWeight: 'bold' }, sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }
});
