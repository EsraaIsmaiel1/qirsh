import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { FONT } from '@/src/components/ui/Text';
import { queryClient } from '@/src/services/query-client';
import { SessionProvider } from '@/src/store/session-store';
import { useWalletTheme, WalletThemeProvider } from '@/src/store/wallet-theme-store';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* already prevented or unavailable */
});

// The screen kept underneath when the app opens on a deep link. Must name a
// direct child of this layout; (app) itself opens on its (tabs) group.
export const unstable_settings = {
  anchor: '(app)',
};

function NativeSplashSync({ fontsReady }: { fontsReady: boolean }) {
  const { isReady: themeReady } = useWalletTheme();

  useEffect(() => {
    if (!themeReady || !fontsReady) return;
    void SplashScreen.hideAsync();
  }, [themeReady, fontsReady]);

  return null;
}

function RootNavigation() {
  const { navigationTheme, scheme } = useWalletTheme();
  // Readex Pro, the Qirsh brand font. If loading fails the app falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    [FONT.regular]: require('../../assets/fonts/ReadexPro-Regular.ttf'),
    [FONT.medium]: require('../../assets/fonts/ReadexPro-Medium.ttf'),
    [FONT.semibold]: require('../../assets/fonts/ReadexPro-SemiBold.ttf'),
    [FONT.bold]: require('../../assets/fonts/ReadexPro-Bold.ttf'),
  });

  return (
    <NavThemeProvider value={navigationTheme}>
      <NativeSplashSync fontsReady={fontsLoaded || !!fontError} />
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
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <WalletThemeProvider>
          <RootNavigation />
        </WalletThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
