import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useWalletTheme } from '@/src/store/wallet-theme-store';

type HeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
};

export function Header({ title, showBack = false, onBack, action }: HeaderProps) {
  const router = useRouter();
  const { palette } = useWalletTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[styles.bar, { backgroundColor: palette.card, borderBottomColor: palette.border }]}
    >
      {showBack ? (
        <Pressable
          onPress={handleBack}
          style={[styles.iconBtn, { backgroundColor: palette.muted }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ color: palette.foreground, fontSize: 22 }}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={[styles.title, { color: palette.foreground }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.actionSlot}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 17,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  actionSlot: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
