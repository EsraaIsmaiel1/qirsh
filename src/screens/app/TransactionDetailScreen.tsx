import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import type { WalletPalette } from '@/src/utils/wallet-theme';
import { Header } from '@/src/components/wallet/Header';
import { useTransactionById } from '@/src/hooks/use-wallet-data';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette } = useWalletTheme();
  const transaction = useTransactionById(id);

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Transaction Details" showBack onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={{ color: palette.mutedForeground }}>Transaction not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const amountColor = isIncome ? palette.success : isExpense ? palette.error : palette.foreground;

  const statusBg =
    transaction.status === 'completed'
      ? `${palette.success}33`
      : transaction.status === 'pending'
        ? `${palette.warning}33`
        : `${palette.error}33`;
  const statusColor =
    transaction.status === 'completed'
      ? palette.success
      : transaction.status === 'pending'
        ? palette.warning
        : palette.error;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Transaction Details" showBack onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCenter}>
          <View style={[styles.statusCircle, { backgroundColor: statusBg }]}>
            {transaction.status === 'completed' ? (
              <DynamicIcon name="check" size={48} color={palette.success} />
            ) : transaction.status === 'pending' ? (
              <ActivityIndicator size="large" color={palette.warning} />
            ) : (
              <DynamicIcon name="x" size={48} color={palette.error} />
            )}
          </View>
        </View>

        <Text style={[styles.amount, { color: amountColor }]}>
          {isIncome ? '+' : '-'}
          {transaction.currency} {transaction.amount.toLocaleString()}
        </Text>

        <View style={styles.badgeWrap}>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Row label="Category" palette={palette}>
            <View style={styles.rowVal}>
              <DynamicIcon name={transaction.icon} size={18} color={palette.foreground} />
              <Text style={[styles.val, { color: palette.foreground }]}>{transaction.category}</Text>
            </View>
          </Row>
          {transaction.recipient ? (
            <Row label="To" palette={palette}>
              <Text style={[styles.val, { color: palette.foreground }]}>{transaction.recipient}</Text>
            </Row>
          ) : null}
          {transaction.sender ? (
            <Row label="From" palette={palette}>
              <Text style={[styles.val, { color: palette.foreground }]}>{transaction.sender}</Text>
            </Row>
          ) : null}
          <Row label="Date" palette={palette}>
            <Text style={[styles.val, { color: palette.foreground }]}>
              {format(new Date(transaction.date), 'MMM dd, yyyy')}
            </Text>
          </Row>
          <Row label="Time" palette={palette}>
            <Text style={[styles.val, { color: palette.foreground }]}>
              {format(new Date(transaction.date), 'hh:mm a')}
            </Text>
          </Row>
          <Row label="Transaction ID" palette={palette} last={!transaction.note}>
            <Text style={[styles.mono, { color: palette.foreground }]}>
              {transaction.id.toUpperCase()}
            </Text>
          </Row>
          {transaction.note ? (
            <View style={[styles.noteBlock, { borderTopColor: palette.border }]}>
              <Text style={[styles.noteLabel, { color: palette.mutedForeground }]}>Note</Text>
              <Text style={[styles.noteText, { color: palette.foreground }]}>{transaction.note}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: palette.muted }]}
            accessibilityRole="button">
            <DynamicIcon name="download" size={20} color={palette.foreground} />
            <Text style={[styles.actionTxt, { color: palette.foreground }]}>Download</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: palette.muted }]}
            accessibilityRole="button">
            <DynamicIcon name="share" size={20} color={palette.foreground} />
            <Text style={[styles.actionTxt, { color: palette.foreground }]}>Share</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  children,
  palette,
  last,
}: {
  label: string;
  children: React.ReactNode;
  palette: WalletPalette;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <Text style={[styles.label, { color: palette.mutedForeground }]}>{label}</Text>
      <View style={styles.rowValueSlot}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 17, paddingBottom: 40, paddingTop: 8 },
  iconCenter: { alignItems: 'center', marginBottom: 16 },
  statusCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: { textAlign: 'center', fontSize: 40, fontWeight: '800', marginBottom: 8 },
  badgeWrap: { alignItems: 'center', marginBottom: 24 },
  badge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  card: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  rowValueSlot: { flex: 1, alignItems: 'flex-end' },
  label: { fontSize: 14 },
  val: { fontSize: 14, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  rowVal: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mono: { fontFamily: 'monospace', fontSize: 12, fontWeight: '600' },
  noteBlock: { paddingTop: 16, marginTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  noteLabel: { fontSize: 13, marginBottom: 6 },
  noteText: { fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionTxt: { fontSize: 15, fontWeight: '700' },
});
