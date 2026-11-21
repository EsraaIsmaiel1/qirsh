import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@/src/components/ui/Text';

import { useWalletTheme } from '@/src/store/wallet-theme-store';

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'error';
  style?: StyleProp<ViewStyle>;
};

export function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: GradientButtonProps) {
  const { palette } = useWalletTheme();
  const colors =
    variant === 'error'
      ? ([palette.gradientErrorStart, palette.gradientErrorEnd] as const)
      : ([palette.gradientStart, palette.gradientEnd] as const);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.press,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && { opacity: 0.92 },
        style,
      ]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.grad}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
  },
  grad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
