import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { ref, onValue, set } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { rtdb, db } from '../config/firebase';

export default function DashboardScreen({ user, onLogout }: any) {
  const [activeView, setActiveView] = useState<'HOME' | 'BOOK_BOX' | 'CREATE_MATCH' | 'LEAGUE'>('HOME');
  
  // Real Data States
  const [wallet, setWallet] = useState(user?.walletBalance || 0);
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: 'weather-cloudy' });

  // Admin Match Inputs
  const [teamA, setTeamA] = useState('Onikeri Kings');
  const [teamB, setTeamB] = useState('Idagundi Strikers');

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

    // 2. Listen to Firebase RTDB for Live Scores
    const matchRef = ref(rtdb, 'liveMatch');
    const unsubscribe = onValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveMatch(snapshot.val());
      } else {
        setLiveMatch(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddFunds = () => {
    const options = {
      description: 'Add Wallet Funds',
      image: 'https://cdn-icons-png.flaticon.com/512/8615/8615194.png',
      currency: 'INR',
      key: 'rzp_test_TU3nY0LM3usauA',
      amount: 50000, // Amount in paise (₹500.00)
      name: 'Onikeri Premier League',
      prefill: { email: user?.email || '', contact: user?.mobileNumber || '', name: user?.fullName || '' },
      theme: { color: '#0284C7' }
    };

    RazorpayCheckout.open(options).then(async (data: any) => {
      // Success: Update Firestore Wallet
      const newBalance = wallet + 500;
      await updateDoc(doc(db, 'users', user.uid), { walletBalance: newBalance });
      setWallet(newBalance);
      Alert.alert('Success', `₹500 added! Payment ID: ${data.razorpay_payment_id}`);
    }).catch((error: any) => {
      Alert.alert('Payment Failed', `Code: ${error.code} | ${error.description}`);
    });
  };

  const handleInitializeMatch = async () => {
    await set(ref(rtdb, 'liveMatch'), {
      teamA, teamB, runs: 0, wickets: 0, overs: '0.0', status: 'Live'
    });
    Alert.alert('Match Started', 'The league has been notified globally!');
    setActiveView('LEAGUE');
  };

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

  // --- EVERYONE: LIVE LEAGUE ---
  if (activeView === 'LEAGUE') return (
    <View style={styles.subView}>
      {renderHeader('Live Scoreboard')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {liveMatch ? (
          <View style={styles.card}>
            <Text style={{color: '#EF4444', fontWeight: 'bold', marginBottom: 10, letterSpacing: 2}}>🔴 LIVE: {weather.temp} in Sirsi</Text>
            <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>{liveMatch.teamA} vs {liveMatch.teamB}</Text>
            <Text style={{color: '#38BDF8', fontSize: 48, fontWeight: '900', marginVertical: 10}}>{liveMatch.runs} / {liveMatch.wickets}</Text>
            <Text style={{color: '#94A3B8', fontSize: 18}}>Overs: {liveMatch.overs}</Text>
            {user?.appRole === 'SuperAdmin' && (
               <TouchableOpacity style={[styles.actionBtn, {marginTop: 20}]} onPress={() => Alert.alert('Score Editor', 'Next step: build the score increment buttons!')}>
                 <Text style={styles.actionBtnText}>Edit Score (Admin Only)</Text>
               </TouchableOpacity>
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
              ? 'You have full access to create matches, manage Box Cricket bookings, and oversee the league.' 
              : `Wallet Balance: ₹${wallet}.`}
          </Text>
          
          {user?.appRole !== 'Guest' && (
             <TouchableOpacity style={styles.payBtn} onPress={handleAddFunds}>
               <Text style={styles.payBtnText}>+ Add ₹500 (Razorpay Test)</Text>
             </TouchableOpacity>
          )}
        </View>
        
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
                <Text style={styles.gridText}>Create Match</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('BOOK_BOX')}>
                <MaterialCommunityIcons name="stadium-variant" size={32} color="#38BDF8" />
                <Text style={styles.gridText}>Manage Box Cricket</Text>
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
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
