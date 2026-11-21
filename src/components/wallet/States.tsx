import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

export function LoadingState({ label }: { label?: string }) {
  const { palette } = useWalletTheme();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={palette.primary} />
      {label ? <Text style={[styles.sub, { color: palette.mutedForeground }]}>{label}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { palette } = useWalletTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: palette.errorLight }]}>
        <DynamicIcon name="alert-circle" size={32} color={palette.error} />
      </View>
      <Text style={[styles.title, { color: palette.foreground }]}>Couldn&apos;t load this</Text>
      <Text style={[styles.sub, { color: palette.mutedForeground }]}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={[styles.retry, { backgroundColor: palette.muted }]}
          accessibilityRole="button"
        >
          <Text style={{ color: palette.foreground, fontWeight: '700' }}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  const { palette } = useWalletTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.icon, { backgroundColor: palette.muted }]}>
        <DynamicIcon name={icon} size={32} color={palette.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: palette.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sub, { color: palette.mutedForeground }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  sub: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  retry: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
});
