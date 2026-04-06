import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { useWalletTheme } from '@/src/store/wallet-theme-store';
import { getWalletPalette } from '@/src/utils/wallet-theme';

export function WalletSplashView() {
  const systemScheme = useColorScheme();
  const { palette: themedPalette, isReady: themeReady } = useWalletTheme();

  const palette = useMemo(
    () =>
      themeReady
        ? themedPalette
        : getWalletPalette(systemScheme === 'dark' ? 'dark' : 'light'),
    [themeReady, themedPalette, systemScheme]
  );

  return (
    <LinearGradient
      colors={[palette.gradientStart, palette.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}>
      <View style={styles.deco1} />
      <View style={styles.deco2} />
      <View style={styles.deco3} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.icon}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
        <Text style={styles.title}>Pay Wallet</Text>
        <Text style={styles.subtitle}>Your money, organized</Text>
        <ActivityIndicator
          color="rgba(255,255,255,0.95)"
          style={styles.spinner}
          accessibilityLabel="Loading"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  deco1: {
    position: 'absolute',
    top: '12%',
    right: '-15%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  deco2: {
    position: 'absolute',
    bottom: '18%',
    left: '-12%',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  deco3: {
    position: 'absolute',
    top: '42%',
    left: '8%',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 32,
  },
});
