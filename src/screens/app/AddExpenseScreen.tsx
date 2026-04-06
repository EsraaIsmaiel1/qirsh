import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { GradientButton } from '@/src/components/wallet/GradientButton';
import { Header } from '@/src/components/wallet/Header';
import { useExpenseCategories } from '@/src/hooks/use-wallet-data';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

type Step = 'amount' | 'category' | 'confirm';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const expenseCategories = useExpenseCategories();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const cat = expenseCategories.find((c) => c.id === selectedCategory);

  const handleBack = () => {
    if (step === 'category') setStep('amount');
    else if (step === 'confirm') setStep('category');
    else router.back();
  };

  const handleAmountNext = () => {
    const n = parseFloat(amount);
    if (amount && n > 0) setStep('category');
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(app)/(tabs)/home');
    }, 1500);
  };

  if (step === 'amount') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Add Expense" showBack onBack={handleBack} />
        <View style={styles.center}>
          <Text style={[styles.hint, { color: palette.mutedForeground }]}>Expense Amount</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: palette.mutedForeground }]}>EGP</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={palette.mutedForeground}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: palette.error }]}
            />
          </View>
          <GradientButton
            variant="error"
            title="Continue"
            onPress={handleAmountNext}
            disabled={!amount || parseFloat(amount) <= 0}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'category') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Select Category" showBack onBack={handleBack} />
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          <View style={styles.gridInner}>
            {expenseCategories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedCategory(c.id);
                  setStep('confirm');
                }}
                style={[
                  styles.catCell,
                  { backgroundColor: palette.card, borderColor: palette.border },
                ]}
              >
                <View
                  style={[
                    styles.catIcon,
                    { backgroundColor: `${c.color}33`, borderColor: `${c.color}44` },
                  ]}
                >
                  <DynamicIcon name={c.icon} size={28} color={c.color} />
                </View>
                <Text style={[styles.catName, { color: palette.foreground }]}>{c.name}</Text>
                <Text style={[styles.catBudget, { color: palette.mutedForeground }]}>
                  EGP {c.spent}/{c.budget}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const amt = parseFloat(amount);
  const remaining = cat ? cat.budget - cat.spent : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Confirm Expense" showBack onBack={handleBack} />
      <ScrollView contentContainerStyle={styles.confirmScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.centerHint, { color: palette.mutedForeground }]}>Expense Amount</Text>
        <Text style={[styles.bigAmount, { color: palette.error }]}>
          -EGP {amt.toLocaleString()}
        </Text>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.catRow}>
            <View
              style={[
                styles.catIconLg,
                {
                  backgroundColor: cat ? `${cat.color}33` : palette.muted,
                },
              ]}
            >
              <DynamicIcon
                name={cat?.icon ?? 'help-circle'}
                size={28}
                color={cat?.color ?? palette.foreground}
              />
            </View>
            <View>
              <Text style={[styles.smallMuted, { color: palette.mutedForeground }]}>Category</Text>
              <Text style={[styles.catTitle, { color: palette.foreground }]}>{cat?.name}</Text>
            </View>
          </View>
          <View style={[styles.divider, { borderColor: palette.border }]} />
          <View style={styles.rowBetween}>
            <Text style={{ color: palette.mutedForeground }}>Budget Remaining</Text>
            <Text style={{ fontWeight: '700', color: palette.foreground }}>
              EGP {remaining.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={[styles.label, { color: palette.foreground }]}>Add Note (Optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What did you spend on?"
          placeholderTextColor={palette.mutedForeground}
          multiline
          style={[styles.textarea, { backgroundColor: palette.muted, color: palette.foreground }]}
        />

        <GradientButton
          variant="error"
          title={loading ? 'Processing...' : 'Confirm Expense'}
          onPress={handleConfirm}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
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
  grid: { padding: 24, paddingBottom: 40 },
  gridInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  catCell: {
    width: '48%',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    alignItems: 'center',
    marginBottom: 4,
  },
  catIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catName: { fontWeight: '700', fontSize: 15, marginBottom: 6, textAlign: 'center' },
  catBudget: { fontSize: 11, textAlign: 'center' },
  confirmScroll: { padding: 24, paddingBottom: 40 },
  centerHint: { textAlign: 'center', marginBottom: 8 },
  bigAmount: { textAlign: 'center', fontSize: 40, fontWeight: '800', marginBottom: 24 },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  catIconLg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallMuted: { fontSize: 13, marginBottom: 4 },
  catTitle: { fontSize: 18, fontWeight: '700' },
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
