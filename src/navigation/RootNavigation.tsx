import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { SessionProvider } from '@/src/store/session-store';
import { useWalletTheme, WalletThemeProvider } from '@/src/store/wallet-theme-store';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already prevented or unavailable */
});

export const unstable_settings = {
  anchor: '(app)/(tabs)/home',
};

function NativeSplashSync() {
  const { isReady: themeReady } = useWalletTheme();

  useEffect(() => {
    if (!themeReady) return;
    void SplashScreen.hideAsync();
  }, [themeReady]);

  return null;
}

function RootNavigation() {
  const { navigationTheme, scheme } = useWalletTheme();

  return (
    <NavThemeProvider value={navigationTheme}>
      <NativeSplashSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <WalletThemeProvider>
        <RootNavigation />
      </WalletThemeProvider>
    </SessionProvider>
  );
}
