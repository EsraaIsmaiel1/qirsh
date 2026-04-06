import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

type QuickActionProps = {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function QuickAction({ icon, label, onPress, variant = 'primary' }: QuickActionProps) {
  const { palette } = useWalletTheme();

  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} style={styles.wrap} accessibilityRole="button">
        <LinearGradient
          colors={[palette.gradientStart, palette.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}>
          <DynamicIcon name={icon} size={22} color="#fff" />
        </LinearGradient>
        <Text style={[styles.caption, { color: palette.foreground }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.wrap} accessibilityRole="button">
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: palette.card,
            borderWidth: 2,
            borderColor: palette.border,
          },
        ]}>
        <DynamicIcon name={icon} size={22} color={palette.foreground} />
      </View>
      <Text style={[styles.caption, { color: palette.foreground, opacity: 0.85 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    flex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
