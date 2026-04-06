import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceCard } from '@/src/components/wallet/BalanceCard';
import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { QuickAction } from '@/src/components/wallet/QuickAction';
import { TransactionItem } from '@/src/components/wallet/TransactionItem';
import { useWalletTheme } from '@/src/store/wallet-theme-store';
import { useRecentTransactions } from '@/src/hooks/use-wallet-data';

export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const recent = useRecentTransactions(5);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greet, { color: palette.mutedForeground }]}>Good Morning</Text>
            <Text style={[styles.name, { color: palette.foreground }]}>Mohamed Ahmed</Text>
          </View>
          <Pressable
            style={[styles.bell, { backgroundColor: palette.card, borderColor: palette.border }]}
            accessibilityRole="button"
          >
            <DynamicIcon name="bell" size={20} color={palette.foreground} />
            <View style={[styles.dot, { backgroundColor: palette.error }]} />
          </Pressable>
        </View>

        <BalanceCard balance={24750.84} currency="EGP" />

        <View style={styles.quickRow}>
          <QuickAction icon="send" label="Send" onPress={() => router.push('/(app)/send')} />
          <QuickAction
            icon="download"
            label="Receive"
            onPress={() => router.push('/(app)/receive')}
          />
          <QuickAction icon="plus" label="Add Money" onPress={() => {}} variant="secondary" />
          <QuickAction
            icon="wallet"
            label="Expense"
            onPress={() => router.push('/(app)/add-expense')}
            variant="secondary"
          />
        </View>

        <View
          style={[styles.sheet, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: palette.foreground }]}>
              Recent Transactions
            </Text>
            <Pressable onPress={() => router.push('/(app)/(tabs)/transactions')}>
              <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 14 }}>
                See All
              </Text>
            </Pressable>
          </View>
          {recent.map((t) => (
            <TransactionItem key={t.id} transaction={t} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 100, paddingHorizontal: 17, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greet: { fontSize: 14 },
  name: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  bell: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 8,
  },
  sheet: {
    marginTop: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 8,
    paddingTop: 24,
    paddingBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 200,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
});
