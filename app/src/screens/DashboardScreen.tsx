import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function DashboardScreen({ user, onLogout }: any) {
  // Navigation State to switch between different internal windows
  const [activeView, setActiveView] = useState<'HOME' | 'BOOK_TURF' | 'SQUAD' | 'ADMIN_USERS' | 'ADMIN_MATCHES' | 'ADMIN_FINANCE' | 'OVERRIDE' | 'LEAGUE'>('HOME');

  const handleGuestBlock = () => {
    Alert.alert('Verification Required', 'You must log in with a verified mobile number to use this feature.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify Now', onPress: onLogout }
    ]);
  };

  const handleRazorpay = (amount: number) => {
    Alert.alert('Razorpay Gateway', `Initializing Secure Payment for ₹${amount}. Razorpay SDK will launch here.`);
  };

  // --------------------------------------------------------
  // INTERNAL WINDOW COMPONENTS
  // --------------------------------------------------------

  const renderHeader = (title: string) => (
    <View style={styles.subHeader}>
      <TouchableOpacity onPress={() => setActiveView('HOME')} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.subHeaderText}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderBookTurf = () => (
    <View style={styles.subView}>
      {renderHeader('Book a Turf')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Turf</Text>
          <TouchableOpacity style={[styles.gridItem, {width: '100%', borderColor: '#38BDF8'}]}>
            <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>Main Stadium - Pitch A</Text>
            <Text style={{color: '#94A3B8'}}>₹1,200 / hour</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available Slots (Today)</Text>
          <View style={{flexDirection: 'row', gap: 10, flexWrap: 'wrap'}}>
            <TouchableOpacity style={styles.timeSlot}><Text style={styles.timeText}>06:00 AM</Text></TouchableOpacity>
            <TouchableOpacity style={styles.timeSlot}><Text style={styles.timeText}>08:00 AM</Text></TouchableOpacity>
            <TouchableOpacity style={styles.timeSlot}><Text style={styles.timeText}>05:00 PM</Text></TouchableOpacity>
            <TouchableOpacity style={styles.timeSlot}><Text style={styles.timeText}>08:00 PM</Text></TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleRazorpay(1200)}>
          <Text style={styles.actionBtnText}>Pay ₹1,200 via Razorpay</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderAdminUsers = () => (
    <View style={styles.subView}>
      {renderHeader('Manage Users')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Registered Players</Text>
          {['Gajanan (Captain)', 'Rahul (Bowler)', 'Vikram (Batsman)'].map((name, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={{color: '#fff', fontSize: 16}}>{name}</Text>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={{color: '#fff', fontSize: 12}}>Edit / Ban</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderAdminMatches = () => (
    <View style={styles.subView}>
      {renderHeader('Live Match Editor')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Onikeri Kings vs Hubli Strikers</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15}}>
            <TextInput style={styles.scoreInput} placeholder="Runs" placeholderTextColor="#475569" keyboardType="number-pad" />
            <Text style={{color: '#fff', fontSize: 24, alignSelf: 'center'}}>/</Text>
            <TextInput style={styles.scoreInput} placeholder="Wickets" placeholderTextColor="#475569" keyboardType="number-pad" />
          </View>
          <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10B981'}]}>
            <Text style={styles.actionBtnText}>Update Live Scoreboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const renderAdminFinance = () => (
    <View style={styles.subView}>
      {renderHeader('Financial Dashboard')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.statusCard, {backgroundColor: '#10B981'}]}>
          <Text style={styles.statusTitle}>Total League Revenue</Text>
          <Text style={{color: '#fff', fontSize: 32, fontWeight: 'bold'}}>₹ 45,200.00</Text>
        </View>
        <Text style={styles.sectionTitle}>Recent Razorpay Transactions</Text>
        <View style={styles.card}>
          <Text style={{color: '#38BDF8', marginBottom: 5}}>+ ₹1,200 (Turf Booking - Gajanan)</Text>
          <Text style={{color: '#38BDF8', marginBottom: 5}}>+ ₹5,000 (Team Registration - Kings)</Text>
        </View>
      </ScrollView>
    </View>
  );

  const renderLiveLeague = () => (
    <View style={styles.subView}>
      {renderHeader('Live Scoreboard')}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={{color: '#EF4444', fontWeight: 'bold', marginBottom: 10}}>🔴 LIVE NOW</Text>
          <Text style={{color: '#fff', fontSize: 20, fontWeight: 'bold'}}>Onikeri Kings</Text>
          <Text style={{color: '#38BDF8', fontSize: 40, fontWeight: '900', marginVertical: 10}}>145 / 3</Text>
          <Text style={{color: '#94A3B8', fontSize: 16}}>Overs: 15.2</Text>
          <View style={{height: 1, backgroundColor: '#1E293B', marginVertical: 15}} />
          <Text style={{color: '#fff', fontSize: 16}}>Hubli Strikers yet to bat</Text>
        </View>
      </ScrollView>
    </View>
  );

  // --------------------------------------------------------
  // MAIN DASHBOARD VIEW
  // --------------------------------------------------------

  if (activeView !== 'HOME') {
    if (activeView === 'BOOK_TURF') return renderBookTurf();
    if (activeView === 'ADMIN_USERS') return renderAdminUsers();
    if (activeView === 'ADMIN_MATCHES') return renderAdminMatches();
    if (activeView === 'ADMIN_FINANCE') return renderAdminFinance();
    if (activeView === 'LEAGUE') return renderLiveLeague();
    
    // Fallback for empty screens
    return (
      <View style={styles.subView}>
        {renderHeader('Module Under Construction')}
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: '#94A3B8'}}>This section is currently being built.</Text>
        </View>
      </View>
    );
  }

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
        <View style={[styles.statusCard, user?.role === 'SuperAdmin' ? styles.adminCard : user?.role === 'Guest' ? styles.guestCard : {}]}>
          <Text style={styles.statusTitle}>
            {user?.role === 'SuperAdmin' ? 'God Mode Active' : user?.role === 'Guest' ? 'Guest Access Mode' : 'Verified Player Account'}
          </Text>
          <Text style={styles.statusDesc}>
            {user?.role === 'SuperAdmin' 
              ? 'You have unrestricted access. You can edit any user data, alter match scores, override turf bookings, and manage league financials.' 
              : user?.role === 'Guest' 
              ? 'You are browsing anonymously. Most features are locked until you verify your mobile number.'
              : `Wallet Balance: ₹${user?.walletBalance || 0}. You can now book turfs and join squads.`}
          </Text>
          
          {user?.role !== 'Guest' && user?.role !== 'SuperAdmin' && (
             <TouchableOpacity style={styles.payBtn} onPress={() => handleRazorpay(500)}>
               <Text style={styles.payBtnText}>+ Add Funds (Razorpay)</Text>
             </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Dashboard Actions</Text>
        
        <View style={styles.grid}>
          {user?.role !== 'SuperAdmin' && (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={user?.role === 'Guest' ? handleGuestBlock : () => setActiveView('BOOK_TURF')}>
                <MaterialCommunityIcons name="stadium" size={32} color={user?.role === 'Guest' ? '#475569' : '#38BDF8'} />
                <Text style={styles.gridText}>Book Turf</Text>
                {user?.role === 'Guest' && <FontAwesome5 name="lock" size={12} color="#EF4444" style={styles.lockIcon} />}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItem} onPress={user?.role === 'Guest' ? handleGuestBlock : () => setActiveView('SQUAD')}>
                <MaterialCommunityIcons name="account-group" size={32} color={user?.role === 'Guest' ? '#475569' : '#10B981'} />
                <Text style={styles.gridText}>My Squad</Text>
                {user?.role === 'Guest' && <FontAwesome5 name="lock" size={12} color="#EF4444" style={styles.lockIcon} />}
              </TouchableOpacity>
            </>
          )}

          {user?.role === 'SuperAdmin' && (
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
              <TouchableOpacity style={styles.gridItem} onPress={() => setActiveView('OVERRIDE')}>
                <MaterialCommunityIcons name="shield-alert" size={32} color="#EF4444" />
                <Text style={styles.gridText}>System Override</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={[styles.gridItem, user?.role === 'SuperAdmin' ? {width: '100%'} : {}]} onPress={() => setActiveView('LEAGUE')}>
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
  timeSlot: { backgroundColor: '#090D16', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B' },
  timeText: { color: '#38BDF8', fontWeight: 'bold' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderColor: '#1E293B' },
  editBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  scoreInput: { backgroundColor: '#090D16', color: '#fff', fontSize: 24, textAlign: 'center', padding: 15, borderRadius: 10, width: '40%', borderWidth: 1, borderColor: '#1E293B' }
});
