import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function AdminMatrix({ visible, onClose }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [liveMatch, setLiveMatch] = useState({ teamA: '', teamAScore: '', teamAOvers: '', teamB: '', teamBScore: '', teamBOvers: '', status: '' });
  const [tourney, setTourney] = useState({ name: '', prize: '', fee: '' });

  useEffect(() => {
    if (visible) {
      getDocs(collection(db, 'users')).then(snap => setUsers(snap.docs.map(d => d.data())));
      getDocs(collection(db, 'teams')).then(snap => setTeams(snap.docs.map(d => d.data())));
    }
  }, [visible]);

  const updateScore = async () => {
    await setDoc(doc(db, 'config', 'liveMatch'), liveMatch);
    Alert.alert('Updated', 'Live score broadcasted.');
  };

  const createTourney = async () => {
    await setDoc(doc(collection(db, 'tournaments')), { ...tourney, status: 'Open', teams: '16 Teams' });
    Alert.alert('Created', 'Tournament published globally.');
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>God Mode Interface</Text>
          <ScrollView style={{ width: '100%', marginVertical: 15 }} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.header}>📡 Update Live Match</Text>
            <View style={styles.box}>
              <TextInput style={styles.input} placeholder="Team A (e.g. Titans)" placeholderTextColor="#64748B" onChangeText={t => setLiveMatch({...liveMatch, teamA: t})} />
              <TextInput style={styles.input} placeholder="Score A (e.g. 142/3)" placeholderTextColor="#64748B" onChangeText={t => setLiveMatch({...liveMatch, teamAScore: t})} />
              <TextInput style={styles.input} placeholder="Match Status" placeholderTextColor="#64748B" onChangeText={t => setLiveMatch({...liveMatch, status: t})} />
              <TouchableOpacity style={styles.btn} onPress={updateScore}><Text style={styles.btnText}>Push Global Score</Text></TouchableOpacity>
            </View>

            <Text style={styles.header}>🏆 Create Tournament</Text>
            <View style={styles.box}>
              <TextInput style={styles.input} placeholder="Tournament Name" placeholderTextColor="#64748B" onChangeText={t => setTourney({...tourney, name: t})} />
              <TextInput style={styles.input} placeholder="Prize Pool" placeholderTextColor="#64748B" onChangeText={t => setTourney({...tourney, prize: t})} />
              <TextInput style={styles.input} placeholder="Entry Fee" placeholderTextColor="#64748B" onChangeText={t => setTourney({...tourney, fee: t})} />
              <TouchableOpacity style={styles.btn} onPress={createTourney}><Text style={styles.btnText}>Publish</Text></TouchableOpacity>
            </View>

            <Text style={styles.header}>👥 All Registered Users ({users.length})</Text>
            {users.map((u, i) => (
              <View key={i} style={styles.row}>
                {u.photoURL ? <Image source={{ uri: u.photoURL }} style={styles.avatar} /> : <View style={styles.avatar} />}
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.name}>{u.fullName}</Text>
                  <Text style={styles.subText}>+91 {u.mobileNumber}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>Close Panel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#131C2E', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%', alignItems: 'center' },
  title: { color: '#EF4444', fontSize: 18, fontWeight: '800' },
  header: { color: '#38BDF8', fontWeight: '800', marginTop: 15, marginBottom: 8 },
  box: { backgroundColor: '#090D16', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#1E293B' },
  input: { backgroundColor: '#131C2E', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#1E293B' },
  btn: { backgroundColor: '#0284C7', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#090D16', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', marginBottom: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E293B' },
  name: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  subText: { color: '#94A3B8', fontSize: 11 },
  closeBtn: { padding: 15 },
  closeText: { color: '#EF4444', fontWeight: '700' }
});
