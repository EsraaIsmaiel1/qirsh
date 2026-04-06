import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { GradientButton } from '@/src/components/wallet/GradientButton';
import { Header } from '@/src/components/wallet/Header';
import { useContacts } from '@/src/hooks/use-wallet-data';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

type Step = 'amount' | 'contact' | 'confirm';

export default function SendMoneyScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const contacts = useContacts();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const selected = contacts.find((c) => c.id === selectedContact);

  const handleBack = () => {
    if (step === 'contact') setStep('amount');
    else if (step === 'confirm') setStep('contact');
    else router.back();
  };

  const handleAmountNext = () => {
    const n = parseFloat(amount);
    if (amount && n > 0) setStep('contact');
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(app)/(tabs)/home');
    }, 1800);
  };

  if (step === 'amount') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Send Money" showBack onBack={handleBack} />
        <View style={styles.center}>
          <Text style={[styles.hint, { color: palette.mutedForeground }]}>Amount to Send</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: palette.mutedForeground }]}>EGP</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={palette.mutedForeground}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: palette.foreground }]}
            />
          </View>
          <View style={styles.quickGrid}>
            {[100, 500, 1000].map((q) => (
              <Pressable
                key={q}
                onPress={() => setAmount(String(q))}
                style={[styles.quickBtn, { backgroundColor: palette.muted }]}
              >
                <Text style={{ fontWeight: '700', color: palette.foreground }}>{q}</Text>
              </Pressable>
            ))}
          </View>
          <GradientButton
            title="Continue"
            onPress={handleAmountNext}
            disabled={!amount || parseFloat(amount) <= 0}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'contact') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Select Contact" showBack onBack={handleBack} />
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {contacts.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setSelectedContact(c.id);
                setStep('confirm');
              }}
              style={[
                styles.contactCard,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <LinearContactAvatar text={c.avatar} />
              <View style={styles.contactMid}>
                <Text style={[styles.contactName, { color: palette.foreground }]}>{c.name}</Text>
                <Text style={[styles.contactEmail, { color: palette.mutedForeground }]}>
                  {c.email}
                </Text>
              </View>
              <DynamicIcon name="arrow-right" size={20} color={palette.mutedForeground} />
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const amt = parseFloat(amount);
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Confirm Transfer" showBack onBack={handleBack} />
      <ScrollView contentContainerStyle={styles.confirmScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.centerHint, { color: palette.mutedForeground }]}>
          You&apos;re sending
        </Text>
        <Text style={[styles.bigAmount, { color: palette.primary }]}>
          EGP {amt.toLocaleString()}
        </Text>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.contactRow}>
            <LinearContactAvatar text={selected?.avatar ?? ''} large />
            <View>
              <Text style={[styles.smallMuted, { color: palette.mutedForeground }]}>To</Text>
              <Text style={[styles.contactName, { color: palette.foreground }]}>
                {selected?.name}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { borderColor: palette.border }]} />
          <View style={styles.rowBetween}>
            <Text style={{ color: palette.mutedForeground }}>Transfer Fee</Text>
            <Text style={{ fontWeight: '700', color: palette.foreground }}>Free</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={{ color: palette.mutedForeground }}>Total Amount</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: palette.foreground }}>
              EGP {amt.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={[styles.label, { color: palette.foreground }]}>Add Note (Optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What's this for?"
          placeholderTextColor={palette.mutedForeground}
          multiline
          style={[styles.textarea, { backgroundColor: palette.muted, color: palette.foreground }]}
        />

        <GradientButton
          title={loading ? 'Processing...' : 'Confirm & Send'}
          onPress={handleConfirm}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function LinearContactAvatar({ text, large }: { text: string; large?: boolean }) {
  const size = large ? 64 : 56;
  return (
    <LinearGradient
      colors={['#818cf8', '#6366f1']}
      style={[styles.avatar, { width: size, height: size, borderRadius: large ? 16 : 16 }]}
    >
      <Text style={[styles.avatarTxt, { fontSize: large ? 22 : 18 }]}>{text}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, paddingHorizontal: 17, justifyContent: 'center', paddingBottom: 40 },
  hint: { textAlign: 'center', marginBottom: 8, fontSize: 14 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  currency: { fontSize: 28, fontWeight: '800' },
  amountInput: { fontSize: 48, fontWeight: '800', minWidth: 120, textAlign: 'center', padding: 0 },
  quickGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  list: { padding: 24, paddingBottom: 40, gap: 12 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '800' },
  contactMid: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '700' },
  contactEmail: { fontSize: 13, marginTop: 2 },
  confirmScroll: { padding: 24, paddingBottom: 40 },
  centerHint: { textAlign: 'center', marginBottom: 8 },
  bigAmount: { textAlign: 'center', fontSize: 40, fontWeight: '800', marginBottom: 24 },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  smallMuted: { fontSize: 13, marginBottom: 4 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, marginVertical: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontWeight: '600', marginBottom: 8 },
  textarea: {
    borderRadius: 16,
    padding: 16,
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
});
