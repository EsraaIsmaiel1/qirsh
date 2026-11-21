import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import type { Transaction } from '@/src/types/wallet';
import { useWalletTheme } from '@/src/store/wallet-theme-store';
import { formatCents } from '@/src/utils/money';

type TransactionItemProps = {
  transaction: Transaction;
  onPress?: () => void;
};

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const isIncoming = transaction.direction === 'in';
  const isIncome = transaction.type === 'income' || (transaction.type === 'transfer' && isIncoming);
  const isExpense = transaction.type === 'expense';

  const iconBg = isIncome
    ? palette.successLight
    : isExpense
      ? palette.errorLight
      : `${palette.primary}33`;
  const iconColor = isIncome ? palette.success : isExpense ? palette.error : palette.primary;
  const amountColor = isIncome ? palette.success : isExpense ? palette.error : palette.foreground;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(app)/transaction-detail/[id]',
        params: { id: transaction.id },
      });
    }
  };

  const title = transaction.recipient ?? transaction.sender ?? transaction.category;
  const relative = formatDistanceToNow(new Date(transaction.date), { addSuffix: true });

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
      accessibilityRole="button">
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <DynamicIcon name={transaction.icon} size={20} color={iconColor} />
      </View>
      <View style={styles.mid}>
        <Text style={[styles.title, { color: palette.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.sub, { color: palette.mutedForeground }]}>{relative}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isIncoming ? '+' : '-'}
          {transaction.currency} {formatCents(transaction.amountCents)}
        </Text>
        <Text style={[styles.status, { color: palette.mutedForeground }]}>
          {transaction.status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mid: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  status: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
