import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet, Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

export default function RazorpayWallet({ visible, onClose, onPaymentSuccess, user }: any) {
  const [customAmount, setCustomAmount] = useState('');

  const initiatePayment = (amount: number) => {
    if (amount < 1) return Alert.alert('Invalid', 'Enter a valid amount.');
    
    const options = {
      description: 'Onikeri Wallet Deposit',
      image: 'https://cdn-icons-png.flaticon.com/512/861/861512.png',
      currency: 'INR',
      key: 'rzp_test_TReUlbfCoX7o0X',
      amount: `${amount * 100}`,
      name: 'Onikeri Premier League',
      prefill: { contact: user?.mobileNumber || '9999999999', name: user?.fullName || 'Player' },
      theme: { color: '#0284C7' },
    };

    RazorpayCheckout.open(options).then((data: any) => {
      onPaymentSuccess(amount, data.razorpay_payment_id);
    }).catch((err: any) => Alert.alert('Payment Cancelled', err.description));
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Deposit to Wallet</Text>
          <Text style={styles.sub}>Select a quick top-up or enter a custom amount.</Text>
          
          <View style={styles.presetRow}>
            {[50, 100, 200, 500].map(amt => (
              <TouchableOpacity key={amt} style={styles.presetBtn} onPress={() => initiatePayment(amt)}>
                <Text style={styles.presetText}>+₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter custom amount (e.g. 1500)"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={setCustomAmount}
          />
          <TouchableOpacity style={styles.payBtn} onPress={() => initiatePayment(parseInt(customAmount) || 0)}>
            <Text style={styles.payBtnText}>Proceed to Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#131C2E', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sub: { color: '#64748B', fontSize: 12, marginTop: 4, marginBottom: 20 },
  presetRow: { flexDirection: 'row', gap: 10, marginBottom: 15, flexWrap: 'wrap', justifyContent: 'center' },
  presetBtn: { borderWidth: 1, borderColor: '#38BDF8', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#090D16' },
  presetText: { color: '#38BDF8', fontWeight: '800' },
  input: { width: '100%', backgroundColor: '#090D16', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#1E293B', marginBottom: 15, textAlign: 'center', fontSize: 16 },
  payBtn: { width: '100%', backgroundColor: '#10B981', padding: 14, borderRadius: 10, alignItems: 'center' },
  payBtnText: { color: '#fff', fontWeight: '800' },
  closeBtn: { marginTop: 15, padding: 10 },
  closeText: { color: '#EF4444', fontWeight: '700' }
});
