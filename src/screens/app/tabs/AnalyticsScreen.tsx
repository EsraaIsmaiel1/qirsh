import { format, parseISO } from 'date-fns';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategorySpendingBars, MonthlySpendingLine } from '@/src/components/wallet/AnalyticsCharts';
import type { WalletPalette } from '@/src/utils/wallet-theme';
import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { Header } from '@/src/components/wallet/Header';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/wallet/States';
import {
  useExpenseCategories,
  useMonthlyTotals,
  useRefreshWallet,
} from '@/src/hooks/use-wallet-data';
import { walletErrorMessage } from '@/src/services/wallet-api';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

export default function AnalyticsScreen() {
  const { palette } = useWalletTheme();
  const categoriesQuery = useExpenseCategories();
  const monthlyQuery = useMonthlyTotals(6);
  const refreshWallet = useRefreshWallet();

  const { categorySpending, totalExpenses } = useMemo(() => {
    const spent = (categoriesQuery.data ?? []).filter((c) => c.spentCents > 0);
    return {
      categorySpending: spent.map((c) => ({ name: c.name, value: c.spentCents, color: c.color })),
      totalExpenses: spent.reduce((sum, c) => sum + c.spentCents, 0),
    };
  }, [categoriesQuery.data]);

  const monthlySpending = useMemo(
    () =>
      (monthlyQuery.data ?? []).map((m) => ({
        month: format(parseISO(m.month), 'MMM'),
        amount: m.outCents / 100,
      })),
    [monthlyQuery.data]
  );

  // Summary cards cover the current calendar month (last row of monthly_totals).
  const thisMonth = monthlyQuery.data?.[monthlyQuery.data.length - 1];
  const incomeCents = thisMonth?.inCents ?? 0;
  const outCents = thisMonth?.outCents ?? 0;
  const savingsCents = incomeCents - outCents;
  const whole = (cents: number) => Math.round(cents / 100).toLocaleString('en-US');

  const isLoading = categoriesQuery.isLoading || monthlyQuery.isLoading;
  const error = categoriesQuery.error ?? monthlyQuery.error;
  const isRefetching = categoriesQuery.isRefetching || monthlyQuery.isRefetching;

  if (isLoading || error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Analytics" />
        {isLoading ? (
          <LoadingState />
        ) : (
          <ErrorState message={walletErrorMessage(error)} onRetry={() => refreshWallet()} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Analytics" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refreshWallet()}
            tintColor={palette.primary}
          />
        }
      >
        <Text style={{ color: palette.mutedForeground, fontSize: 13 }}>
          This month ({format(new Date(), 'MMMM yyyy')})
        </Text>
        <View style={styles.summaryRow}>
          <SummaryCard
            palette={palette}
            icon="trending-up"
            iconBg={palette.successLight}
            iconColor={palette.success}
            label="Money In"
            value={`+${whole(incomeCents)}`}
            valueColor={palette.success}
          />
          <SummaryCard
            palette={palette}
            icon="trending-down"
            iconBg={palette.errorLight}
            iconColor={palette.error}
            label="Money Out"
            value={`-${whole(outCents)}`}
            valueColor={palette.error}
          />
          <SummaryCard
            palette={palette}
            icon="wallet"
            iconBg={`${palette.primary}33`}
            iconColor={palette.primary}
            label="Net"
            value={`${savingsCents < 0 ? '-' : ''}${whole(Math.abs(savingsCents))}`}
            valueColor={palette.primary}
          />
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.foreground }]}>
            Spending by Category
          </Text>
          <View style={styles.piePlaceholder}>
            {categorySpending.length > 0 ? (
              <CategorySpendingBars data={categorySpending} total={totalExpenses} palette={palette} />
            ) : (
              <EmptyState
                icon="trending-down"
                title="No expenses this month"
                subtitle="Add an expense to see where your money goes."
              />
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.foreground }]}>Monthly Spending</Text>
          <MonthlySpendingLine data={monthlySpending} palette={palette} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  palette,
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor,
}: {
  palette: WalletPalette;
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={[styles.sumCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={[styles.sumIcon, { backgroundColor: iconBg }]}>
        <DynamicIcon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.sumLabel, { color: palette.mutedForeground }]}>{label}</Text>
      <Text style={[styles.sumValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 17, paddingBottom: 100, paddingTop: 8, gap: 16 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  sumCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sumIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sumLabel: { fontSize: 11, marginBottom: 4 },
  sumValue: { fontSize: 14, fontWeight: '800' },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  piePlaceholder: { minHeight: 120 },
});
