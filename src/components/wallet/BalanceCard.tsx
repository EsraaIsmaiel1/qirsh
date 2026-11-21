import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { useWalletTheme } from '@/src/store/wallet-theme-store';
import { formatCents } from '@/src/utils/money';

type BalanceCardProps = {
  /** undefined while loading */
  balanceCents?: number;
  currency: string;
  walletTag?: string;
};

export function BalanceCard({ balanceCents, currency, walletTag }: BalanceCardProps) {
  const [visible, setVisible] = useState(true);
  const { palette } = useWalletTheme();

  const formatted = balanceCents == null ? '—' : formatCents(balanceCents);

  return (
    <LinearGradient
      colors={[palette.gradientStart, palette.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      <View style={styles.deco1} />
      <View style={styles.deco2} />
      <View style={styles.inner}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Balance</Text>
          <Pressable
            onPress={() => setVisible(!visible)}
            style={styles.eyeBtn}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide balance' : 'Show balance'}>
            <DynamicIcon name={visible ? 'eye' : 'eye-off'} size={18} color="rgba(255,255,255,0.95)" />
          </Pressable>
        </View>
        <Text style={styles.amount}>
          {visible ? `${currency} ${formatted}` : '••••••'}
        </Text>
        <View style={styles.walletRow}>
          <Text style={styles.walletLabel}>Wallet ID:</Text>
          <Text style={styles.walletId}>{walletTag ? `@${walletTag}` : '—'}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  // The brand's coin motif: two gold dots stepping up to the right, like the logo.
  deco1: {
    position: 'absolute',
    top: 30,
    right: 44,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F0B341',
  },
  deco2: {
    position: 'absolute',
    top: 16,
    right: 22,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F0B341',
  },
  inner: {
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginRight: 56,
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 8,
    borderRadius: 999,
  },
  amount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  walletId: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '600',
  },
});
