import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function DashboardScreen({ user, onLogout }: any) {
  const [activeView, setActiveView] = useState<'HOME' | 'BOOK_TURF' | 'SQUAD' | 'ADMIN_USERS' | 'ADMIN_MATCHES' | 'ADMIN_FINANCE' | 'OVERRIDE' | 'LEAGUE'>('HOME');

  const [wallet, setWallet] = useState(user?.walletBalance || 0);
  const [revenue, setRevenue] = useState(45200);
  const [matchScore, setMatchScore] = useState({ runs: '145', wickets: '3', overs: '15.2', teamA: 'Onikeri Kings', teamB: 'Hubli Strikers' });
  const [runsInput, setRunsInput] = useState('');
  const [wicketsInput, setWicketsInput] = useState('');
  const [oversInput, setOversInput] = useState('');
  
  const [players, setPlayers] = useState([
    { id: 1, name: 'Gajanan (Captain)', status: 'Active', role: 'Batsman' },
    { id: 2, name: 'Rahul (Pace)', status: 'Active', role: 'Bowler' },
    { id: 3, name: 'Vikram (Spin)', status: 'Banned', role: 'All-Rounder' }
  ]);

  const handleGuestBlock = () => {
    Alert.alert('Verification Required', 'You must log in to use this feature.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify Now', onPress: onLogout }
    ]);
  };

  const handleRazorpay = (amount: number, reason: string) => {
    Alert.alert('Razorpay Gateway', `Processing ₹${amount} for ${reason}.\n\n(Simulating Payment Success)`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pay Now', onPress: () => {
          setWallet((prev: number) => prev + amount);
          setRevenue((prev: number) => prev + amount);
          Alert.alert('Payment Successful', `₹${amount} has been added to your account!`);
      }}
    ]);
  };

  const togglePlayerBan = (id: number) => {
    setPlayers(players.map(p => p.id === id ? { ...p, status: p.status === 'Active' ? 'Banned' : 'Active' } : p));
  };

  const handleUpdateScore = () => {
    setMatchScore(prev => ({
      ...prev,
      runs: runsInput || prev.runs,
      wickets: wicketsInput || prev.wickets,
      overs: oversInput || prev.overs
    }));
    setRunsInput(''); setWicketsInput(''); setOversInput('');
    Alert.alert('Score Updated', 'The Live League has been updated globally!');
  };

  const renderHeader = (title: string) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setActiveView('HOME')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.subHeaderText}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (activeView === 'BOOK_TURF') return (
    <View style={styles.subView}>
      {renderHeader('Book a Turf')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Turf</Text>
          <TouchableOpacity style={[styles.gridItem, {width: '100%', borderColor: '#38BDF8'}]}>
            <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>Main Stadium - Pitch A</Text>
            <Text style={{color: '#94A3B8'}}>₹1,200 / match</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleRazorpay(1200, 'Turf Booking')}>
          <Text style={styles.actionBtnText}>Pay ₹1,200 via Razorpay</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (activeView === 'ADMIN_USERS') return (
    <View style={styles.subView}>
      {renderHeader('Manage Users')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Registered Players</Text>
          {players.map((p) => (
            <View key={p.id} style={styles.listItem}>
              <View>
                <Text style={{color: p.status === 'Banned' ? '#64748B' : '#fff', fontSize: 16, textDecorationLine: p.status === 'Banned' ? 'line-through' : 'none'}}>{p.name}</Text>
                <Text style={{color: p.status === 'Banned' ? '#EF4444' : '#10B981', fontSize: 12}}>{p.status}</Text>
              </View>
              <TouchableOpacity style={[styles.editBtn, p.status === 'Banned' && {backgroundColor: '#10B981'}]} onPress={() => togglePlayerBan(p.id)}>
                <Text style={{color: '#fff', fontSize: 12}}>{p.status === 'Banned' ? 'Unban' : 'Ban'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (activeView === 'ADMIN_MATCHES') return (
    <View style={styles.subView}>
      {renderHeader('Live Match Editor')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{matchScore.teamA} vs {matchScore.teamB}</Text>
          <Text style={styles.label}>Runs</Text>
          <TextInput style={styles.scoreInput} placeholder={matchScore.runs} placeholderTextColor="#475569" keyboardType="number-pad" value={runsInput} onChangeText={setRunsInput} />
          <Text style={styles.label}>Wickets</Text>
          <TextInput style={styles.scoreInput} placeholder={matchScore.wickets} placeholderTextColor="#475569" keyboardType="number-pad" value={wicketsInput} onChangeText={setWicketsInput} />
          <Text style={styles.label}>Overs</Text>
          <TextInput style={styles.scoreInput} placeholder={matchScore.overs} placeholderTextColor="#475569" keyboardType="numeric" value={oversInput} onChangeText={setOversInput} />
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981', marginTop: 20}]} onPress={handleUpdateScore}>
            <Text style={styles.actionBtnText}>Update Live Scoreboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  if (activeView === 'ADMIN_FINANCE') return (
    <View style={styles.subView}>
      {renderHeader('Financial Dashboard')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusCard, {backgroundColor: '#10B981'}]}>
          <Text style={styles.statusTitle}>Total League Revenue</Text>
          <Text style={{color: '#fff', fontSize: 32, fontWeight: 'bold'}}>₹ {revenue.toLocaleString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>Recent Razorpay Transactions</Text>
        <View style={styles.card}>
          <Text style={{color: '#38BDF8', marginBottom: 15, fontSize: 16}}>+ ₹1,200 (Turf Booking - Gajanan)</Text>
          <Text style={{color: '#38BDF8', marginBottom: 15, fontSize: 16}}>+ ₹500 (Wallet Add - Rahul)</Text>
          <Text style={{color: '#38BDF8', marginBottom: 15, fontSize: 16}}>+ ₹5,000 (Team Entry - Kings)</Text>
        </View>
      </ScrollView>
    </View>
  );

  if (activeView === 'LEAGUE') return (
    <View style={styles.subView}>
      {renderHeader('Live Scoreboard')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={{color: '#EF4444', fontWeight: 'bold', marginBottom: 10, letterSpacing: 2}}>🔴 LIVE NOW</Text>
          <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold'}}>{matchScore.teamA}</Text>
          <Text style={{color: '#38BDF8', fontSize: 48, fontWeight: '900', marginVertical: 10}}>{matchScore.runs} / {matchScore.wickets}</Text>
          <Text style={{color: '#94A3B8', fontSize: 18}}>Overs: {matchScore.overs}</Text>
          <View style={{height: 1, backgroundColor: '#1E293B', marginVertical: 15}} />
          <Text style={{color: '#fff', fontSize: 16}}>{matchScore.teamB} yet to bat</Text>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Player'}</Text>
          {user?.playingRole && (
            <Text style={{color: '#38BDF8', fontSize: 12, fontWeight: 'bold', marginTop: 4, textTransform: 'uppercase'}}>
               🏏 {user.playingRole}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusCard, user?.appRole === 'SuperAdmin' ? styles.adminCard : user?.appRole === 'Guest' ? styles.guestCard : {}]}>
          <Text style={styles.statusTitle}>
            {user?.appRole === 'SuperAdmin' ? 'God Mode Active' : user?.appRole === 'Guest' ? 'Guest Access Mode' : 'Verified Player Account'}
          </Text>
          <Text style={styles.statusDesc}>
            {user?.appRole === 'SuperAdmin' 
              ? 'You have unrestricted access. You can edit any user data, alter match scores, override turf bookings, and manage league financials.' 
              : user?.appRole === 'Guest' 
              ? 'You are browsing anonymously. Most features are locked until you verify your profile.'
              : `Wallet Balance: ₹${wallet}. You can now book turfs and join squads.`}
          </Text>
          
          {user?.appRole !== 'Guest' && user?.appRole !== 'SuperAdmin' && (
             <TouchableOpacity style={styles.payBtn} onPress={() => handleRazorpay(500, 'Wallet Top-up')}>
               <Text style={styles.payBtnText}>+ Add Funds (Razorpay)</Text>
             </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Dashboard Actions</Text>
        
        <View style={styles.grid}>
          {user?.appRole !== 'SuperAdmin' && (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={user?.appRole === 'Guest' ? handleGuestBlock : () => setActiveView('BOOK_TURF')}>
                <MaterialCommunityIcons name="stadium" size={32} color={user?.appRole === 'Guest' ? '#475569' : '#38BDF8'} />
                <Text style={styles.gridText}>Book Turf</Text>
                {user?.appRole === 'Guest' && <FontAwesome5 name="lock" size={12} color="#EF4444" style={styles.lockIcon} />}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItem} onPress={user?.appRole === 'Guest' ? handleGuestBlock : () => setActiveView('SQUAD')}>
                <MaterialCommunityIcons name="account-group" size={32} color={user?.appRole === 'Guest' ? '#475569' : '#10B981'} />
                <Text style={styles.gridText}>My Squad</Text>
                {user?.appRole === 'Guest' && <FontAwesome5 name="lock" size={12} color="#EF4444" style={styles.lockIcon} />}
              </TouchableOpacity>
            </>
          )}

          {user?.appRole === 'SuperAdmin' && (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('ADMIN_USERS')}>
                <MaterialCommunityIcons name="account-edit" size={32} color="#F59E0B" />
                <Text style={styles.gridText}>Manage Users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('ADMIN_MATCHES')}>
                <MaterialCommunityIcons name="calendar-edit" size={32} color="#38BDF8" />
                <Text style={styles.gridText}>Edit Matches</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('ADMIN_FINANCE')}>
                <MaterialCommunityIcons name="bank-transfer" size={32} color="#10B981" />
                <Text style={styles.gridText}>Financials</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem} onPress={() => Alert.alert('Override Active', 'System settings overridden.')}>
                <MaterialCommunityIcons name="shield-alert" size={32} color="#EF4444" />
                <Text style={styles.gridText}>System Override</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.gridItem, user?.appRole === 'SuperAdmin' ? {width: '100%'} : {}]} onPress={() => setActiveView('LEAGUE')}>
            <MaterialCommunityIcons name="trophy" size={32} color="#F59E0B" />
            <Text style={styles.gridText}>Live League</Text>
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
  statusCard: { backgroundColor: '#0284C7', padding: 20, borderRadius: 16, marginBottom: 30 },
  adminCard: { backgroundColor: '#EF4444' },
  guestCard: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  statusTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  statusDesc: { color: '#E0F2FE', fontSize: 14, lineHeight: 22 },
  payBtn: { marginTop: 15, backgroundColor: '#fff', padding: 10, borderRadius: 8, alignItems: 'center' },
  payBtnText: { color: '#0284C7', fontWeight: 'bold' },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  gridItem: { width: '47%', backgroundColor: '#131C2E', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', marginBottom: 15, position: 'relative' },
  gridText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' },
  lockIcon: { position: 'absolute', top: 10, right: 10 },
  actionBtn: { backgroundColor: '#0284C7', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#1E293B' },
  editBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12, marginTop: 10 },
  scoreInput: { backgroundColor: '#090D16', color: '#fff', fontSize: 18, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B' }
});
