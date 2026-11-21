import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { Header } from '@/src/components/wallet/Header';
import { TransactionItem } from '@/src/components/wallet/TransactionItem';
import { ErrorState, LoadingState } from '@/src/components/wallet/States';
import { useTransactions } from '@/src/hooks/use-wallet-data';
import { walletErrorMessage } from '@/src/services/wallet-api';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

type Filter = 'all' | 'income' | 'expense' | 'transfer';

const TABS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

export default function TransactionsScreen() {
  const { palette } = useWalletTheme();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useTransactions(filter);
  const list = query.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header
        title="Transactions"
        action={
          <Pressable
            style={[styles.iconBtn, { backgroundColor: palette.muted }]}
            accessibilityRole="button"
          >
            <DynamicIcon name="filter" size={20} color={palette.foreground} />
          </Pressable>
        }
      />
      <View style={styles.tabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map((tab) => {
            const active = filter === tab.value;
            return (
              <Pressable
                key={tab.value}
                onPress={() => setFilter(tab.value)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? palette.primary : palette.muted,
                  },
                ]}
              >
                <Text
                  style={{
                    fontWeight: '700',
                    fontSize: 13,
                    color: active ? palette.primaryForeground : palette.mutedForeground,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={palette.primary}
          />
        }
      >
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState message={walletErrorMessage(query.error)} onRetry={() => query.refetch()} />
        ) : list.length > 0 ? (
          list.map((t) => <TransactionItem key={t.id} transaction={t} />)
        ) : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: palette.muted }]}>
              <DynamicIcon name="filter" size={40} color={palette.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.foreground }]}>
              No Transactions Found
            </Text>
            <Text style={[styles.emptySub, { color: palette.mutedForeground }]}>
              There are no {filter !== 'all' ? filter : ''} transactions to display.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { paddingHorizontal: 17, paddingVertical: 12 },
  tabRow: { gap: 8, paddingBottom: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 8 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 17, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center' },
});
