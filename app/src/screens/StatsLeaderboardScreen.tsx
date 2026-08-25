import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function StatsLeaderboardScreen({ user, onBack }: any) {
  const [tab, setTab] = useState<'LEADERBOARD' | 'PROFILE'>('LEADERBOARD');
  const [topRunScorers, setTopRunScorers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('walletBalance', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        setTopRunScorers(snapshot.docs.map(doc => doc.data()));
      } catch (e) {
        console.log("Error fetching leaderboard", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const shareToWhatsApp = async () => {
    try {
      await Share.share({
        message: `🏏 Join me on Onikeri Premier League! Use my referral code OKL-${user?.fullName?.toUpperCase() || 'PLAYER'} to sign up and get rewards!`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{tab === 'LEADERBOARD' ? 'League Leaderboard' : 'Player Profile & Stats'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'LEADERBOARD' && styles.activeTab]} onPress={() => setTab('LEADERBOARD')}>
          <Text style={[styles.tabText, tab === 'LEADERBOARD' && styles.activeTabText]}>🏆 Orange Cap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'PROFILE' && styles.activeTab]} onPress={() => setTab('PROFILE')}>
          <Text style={[styles.tabText, tab === 'PROFILE' && styles.activeTabText]}>👤 My Stats</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {tab === 'LEADERBOARD' ? (
          <View>
            <Text style={styles.sectionTitle}>Top Performers in Onikeri</Text>
            {topRunScorers.map((player, index) => (
              <View key={index} style={styles.cardRow}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{color: index === 0 ? '#F59E0B' : '#94A3B8', fontWeight: 'bold', fontSize: 18, width: 30}}>#{index + 1}</Text>
                  <View>
                    <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>{player.fullName}</Text>
                    <Text style={{color: '#38BDF8', fontSize: 12}}>{player.playingRole || 'All-Rounder'}</Text>
                  </View>
                </View>
                <Text style={{color: '#10B981', fontSize: 18, fontWeight: '900'}}>₹{player.walletBalance || 0}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{user?.fullName}</Text>
              <Text style={{color: '#38BDF8', marginBottom: 15}}>Role: {user?.playingRole || 'Player'}</Text>
              
              <View style={{flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#090D16', padding: 15, borderRadius: 10, marginBottom: 15}}>
                <View style={{alignItems: 'center', flex: 1}}>
                  <Text style={{color: '#94A3B8', fontSize: 12}}>Matches</Text>
                  <Text style={{color: '#fff', fontSize: 20, fontWeight: 'bold'}}>0</Text>
                </View>
                <View style={{alignItems: 'center', flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1E293B'}}>
                  <Text style={{color: '#94A3B8', fontSize: 12}}>Wallet</Text>
                  <Text style={{color: '#10B981', fontSize: 20, fontWeight: 'bold'}}>₹{user?.walletBalance || 0}</Text>
                </View>
                <View style={{alignItems: 'center', flex: 1}}>
                  <Text style={{color: '#94A3B8', fontSize: 12}}>Status</Text>
                  <Text style={{color: '#F59E0B', fontSize: 20, fontWeight: 'bold'}}>Active</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={shareToWhatsApp}>
                <FontAwesome5 name="whatsapp" size={18} color="#fff" style={{marginRight: 8}} />
                <Text style={styles.actionBtnText}>Refer Friends & Earn</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#131C2E', borderBottomWidth: 1, borderColor: '#1E293B' },
  headerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 5 },
  tabBar: { flexDirection: 'row', backgroundColor: '#131C2E', padding: 10, borderBottomWidth: 1, borderColor: '#1E293B' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#0284C7' },
  tabText: { color: '#94A3B8', fontWeight: 'bold' },
  activeTabText: { color: '#fff' },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#131C2E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 },
  cardRow: { backgroundColor: '#131C2E', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#1E293B' },
  sectionTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  actionBtn: { backgroundColor: '#25D366', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
