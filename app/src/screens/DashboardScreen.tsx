import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ user, onLogout }: any) {
  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
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
        
        {/* DYNAMIC STATUS CARD */}
        <View style={[styles.statusCard, user?.role === 'SuperAdmin' ? styles.adminCard : user?.role === 'Guest' ? styles.guestCard : {}]}>
          <Text style={styles.statusTitle}>
            {user?.role === 'SuperAdmin' ? 'God Mode Active' : user?.role === 'Guest' ? 'Guest Access Mode' : 'Verified Player Account'}
          </Text>
          <Text style={styles.statusDesc}>
            {user?.role === 'SuperAdmin' 
              ? 'You have unrestricted access to modify league scores, match schedules, and user data.' 
              : user?.role === 'Guest' 
              ? 'You are browsing anonymously. Verify your phone number to book turfs and join squads.'
              : 'Your wallet is active. You can now book turfs, join teams, and track your league stats.'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Dashboard Actions</Text>
        
        {/* ACTION GRID */}
        <View style={styles.grid}>
          {/* Hidden from Guests */}
          {user?.role !== 'Guest' && (
            <TouchableOpacity style={styles.gridItem}>
              <MaterialCommunityIcons name="stadium" size={32} color="#38BDF8" />
              <Text style={styles.gridText}>Book Turf</Text>
            </TouchableOpacity>
          )}
          
          {/* Hidden from SuperAdmin */}
          {user?.role !== 'SuperAdmin' && user?.role !== 'Guest' && (
            <TouchableOpacity style={styles.gridItem}>
              <MaterialCommunityIcons name="account-group" size={32} color="#10B981" />
              <Text style={styles.gridText}>My Squad</Text>
            </TouchableOpacity>
          )}

          {/* ONLY Visible to SuperAdmin */}
          {user?.role === 'SuperAdmin' && (
            <TouchableOpacity style={styles.gridItem}>
              <MaterialCommunityIcons name="security" size={32} color="#EF4444" />
              <Text style={styles.gridText}>Admin Panel</Text>
            </TouchableOpacity>
          )}

          {/* Visible to Everyone */}
          <TouchableOpacity style={styles.gridItem}>
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
  guestCard: { backgroundColor: '#475569' },
  statusTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  statusDesc: { color: '#E0F2FE', fontSize: 14, lineHeight: 22 },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'space-between' },
  gridItem: { width: '47%', backgroundColor: '#131C2E', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B', marginBottom: 15 },
  gridText: { color: '#94A3B8', marginTop: 10, fontWeight: '600' }
});
