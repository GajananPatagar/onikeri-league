import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function DashboardScreen({ user, onLogout }: any) {

  const handleGuestBlock = () => {
    Alert.alert('Verification Required', 'You must log in with a verified mobile number to use this feature.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify Now', onPress: onLogout }
    ]);
  };

  const handleRazorpay = () => {
    Alert.alert('Razorpay Gateway', 'Initializing Secure Payment Gateway to add funds to wallet...');
    // Real Razorpay init logic will go here
  };

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
             <TouchableOpacity style={styles.payBtn} onPress={handleRazorpay}>
               <Text style={styles.payBtnText}>+ Add Funds (Razorpay)</Text>
             </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Dashboard Actions</Text>
        
        <View style={styles.grid}>
          {/* PLAYER & GUEST ACTIONS */}
          {user?.role !== 'SuperAdmin' && (
            <>
              <TouchableOpacity style={styles.gridItem} onPress={user?.role === 'Guest' ? handleGuestBlock : () => {}}>
                <MaterialCommunityIcons name="stadium" size={32} color={user?.role === 'Guest' ? '#475569' : '#38BDF8'} />
                <Text style={styles.gridText}>Book Turf</Text>
                {user?.role === 'Guest' && <FontAwesome5 name="lock" size={12} color="#EF4444" style={styles.lockIcon} />}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.gridItem} onPress={user?.role === 'Guest' ? handleGuestBlock : () => {}}>
                <MaterialCommunityIcons name="account-group" size={32} color={user?.role === 'Guest' ? '#475569' : '#10B981'} />
                <Text style={styles.gridText}>My Squad</Text>
                {user?.role === 'Guest' && <FontAwesome5 name="lock" size={12} color="#EF4444" style={styles.lockIcon} />}
              </TouchableOpacity>
            </>
          )}

          {/* SUPER ADMIN (GOD MODE) ACTIONS */}
          {user?.role === 'SuperAdmin' && (
            <>
              <TouchableOpacity style={styles.gridItem}>
                <MaterialCommunityIcons name="account-edit" size={32} color="#F59E0B" />
                <Text style={styles.gridText}>Manage Users</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem}>
                <MaterialCommunityIcons name="calendar-edit" size={32} color="#38BDF8" />
                <Text style={styles.gridText}>Edit Matches</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem}>
                <MaterialCommunityIcons name="bank-transfer" size={32} color="#10B981" />
                <Text style={styles.gridText}>Financials</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridItem}>
                <MaterialCommunityIcons name="shield-alert" size={32} color="#EF4444" />
                <Text style={styles.gridText}>System Override</Text>
              </TouchableOpacity>
            </>
          )}

          {/* GLOBAL ACTION */}
          <TouchableOpacity style={[styles.gridItem, user?.role === 'SuperAdmin' ? {width: '100%'} : {}]}>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' },
  greeting: { color: '#94A3B8', fontSize: 14 },
  userName: { color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', textTransform: 'capitalize' },
  logoutBtn: { padding: 8, backgroundColor: '#090D16', borderRadius: 8, borderWidth: 1, borderColor: '#1E293B' },
  scrollContent: { padding: 24 },
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
  lockIcon: { position: 'absolute', top: 10, right: 10 }
});
