import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategorySpendingBars, MonthlySpendingLine } from '@/src/components/wallet/AnalyticsCharts';
import type { WalletPalette } from '@/src/utils/wallet-theme';
import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { Header } from '@/src/components/wallet/Header';
import { useAnalyticsData } from '@/src/hooks/use-wallet-data';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

export default function AnalyticsScreen() {
  const { palette } = useWalletTheme();
  const { categorySpending, monthlySpending, totalExpenses } = useAnalyticsData();
  const totalIncome = 15700;
  const savings = totalIncome - totalExpenses;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Analytics" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <SummaryCard
            palette={palette}
            icon="trending-up"
            iconBg={palette.successLight}
            iconColor={palette.success}
            label="Income"
            value={`+${totalIncome.toLocaleString()}`}
            valueColor={palette.success}
          />
          <SummaryCard
            palette={palette}
            icon="trending-down"
            iconBg={palette.errorLight}
            iconColor={palette.error}
            label="Expenses"
            value={`-${totalExpenses.toLocaleString()}`}
            valueColor={palette.error}
          />
          <SummaryCard
            palette={palette}
            icon="wallet"
            iconBg={`${palette.primary}33`}
            iconColor={palette.primary}
            label="Savings"
            value={savings.toLocaleString()}
            valueColor={palette.primary}
          />
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.foreground }]}>
            Spending by Category
          </Text>
          <View style={styles.piePlaceholder}>
            <CategorySpendingBars data={categorySpending} total={totalExpenses} palette={palette} />
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
