import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BalanceCard } from '@/src/components/wallet/BalanceCard';
import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { QuickAction } from '@/src/components/wallet/QuickAction';
import { TransactionItem } from '@/src/components/wallet/TransactionItem';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/wallet/States';
import { useWalletTheme } from '@/src/store/wallet-theme-store';
import {
  useProfile,
  useRecentTransactions,
  useRefreshWallet,
  useWallet,
} from '@/src/hooks/use-wallet-data';
import { walletErrorMessage } from '@/src/services/wallet-api';

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const profile = useProfile();
  const wallet = useWallet();
  const recent = useRecentTransactions(5);
  const refreshWallet = useRefreshWallet();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshWallet();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddMoney = () => {
    Alert.alert(
      'Coming soon',
      'Adding money needs a payment provider (card or Fawry/InstaPay). It will be enabled once that is connected.'
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greet, { color: palette.mutedForeground }]}>{greeting()}</Text>
            <Text style={[styles.name, { color: palette.foreground }]} numberOfLines={1}>
              {profile.data?.fullName || (profile.isLoading ? ' ' : 'Welcome')}
            </Text>
          </View>
          <Pressable
            style={[styles.bell, { backgroundColor: palette.card, borderColor: palette.border }]}
            accessibilityRole="button"
          >
            <DynamicIcon name="bell" size={20} color={palette.foreground} />
            <View style={[styles.dot, { backgroundColor: palette.error }]} />
          </Pressable>
        </View>

        <BalanceCard
          balanceCents={wallet.data?.balanceCents}
          currency={wallet.data?.currency ?? 'EGP'}
          walletTag={profile.data?.walletTag}
        />

        <View style={styles.quickRow}>
          <QuickAction icon="send" label="Send" onPress={() => router.push('/(app)/send')} />
          <QuickAction
            icon="download"
            label="Receive"
            onPress={() => router.push('/(app)/receive')}
          />
          <QuickAction icon="plus" label="Add Money" onPress={handleAddMoney} variant="secondary" />
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
          {recent.isLoading ? (
            <LoadingState />
          ) : recent.isError ? (
            <ErrorState message={walletErrorMessage(recent.error)} onRetry={() => recent.refetch()} />
          ) : recent.data && recent.data.length > 0 ? (
            recent.data.map((t) => <TransactionItem key={t.id} transaction={t} />)
          ) : (
            <EmptyState
              icon="wallet"
              title="No transactions yet"
              subtitle="Money you send, receive or spend will show up here."
            />
          )}
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
