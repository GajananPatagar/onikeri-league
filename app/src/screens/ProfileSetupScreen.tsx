import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function ProfileSetupScreen({ mobileNumber, onSetupComplete }: any) {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pickImage = async () => {
    let res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.15 });
    if (!res.canceled) setProfileImage(res.assets[0].uri);
  };

  const handleComplete = async () => {
    if (!fullName || dob.length !== 10 || !profileImage) {
      return Alert.alert('Incomplete', 'Name, DOB, and Face Photo are strictly required.');
    }

    setIsProcessing(true);
    try {
      const response = await fetch(profileImage);
      const blob = await response.blob();
      const base64data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      const uid = `user_${mobileNumber}`;
      const userData = {
        uid, fullName: fullName.trim(), mobileNumber, dob, role: 'Player', photoURL: base64data, walletBalance: 100, registeredAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', uid), userData);
      onSetupComplete(userData);
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile.');
    }
    setIsProcessing(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Identity Verification</Text>
      
      <TouchableOpacity style={styles.avatarBox} onPress={pickImage}>
        {profileImage ? <Image source={{ uri: profileImage }} style={styles.img} /> : <Ionicons name="camera" size={40} color="#64748B" />}
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Full Legal Name *</Text>
        <TextInput style={styles.input} placeholder="e.g. Gajanan" placeholderTextColor="#475569" value={fullName} onChangeText={setFullName} />
        
        <Text style={styles.label}>Date of Birth (DD-MM-YYYY) *</Text>
        <TextInput style={styles.input} placeholder="01-01-2000" placeholderTextColor="#475569" keyboardType="number-pad" maxLength={10} value={dob} onChangeText={(text) => {
          let clean = text.replace(/[^0-9]/g, '');
          if (clean.length > 2) clean = clean.substring(0, 2) + '-' + clean.substring(2);
          if (clean.length > 5) clean = clean.substring(0, 5) + '-' + clean.substring(5, 9);
          setDob(clean);
        }} />

        <TouchableOpacity style={styles.btn} onPress={handleComplete} disabled={isProcessing}>
          {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Complete Setup</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#090D16', alignItems: 'center', padding: 24, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 20 },
  avatarBox: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#38BDF8', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 30 },
  img: { width: '100%', height: '100%' },
  card: { width: '100%' },
  label: { color: '#94A3B8', marginBottom: 8, fontWeight: '700', fontSize: 12 },
  input: { backgroundColor: '#131C2E', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', marginBottom: 20 },
  btn: { backgroundColor: '#0284C7', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: '800' }
});
