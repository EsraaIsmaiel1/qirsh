import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useWalletRealtime } from '@/src/hooks/use-wallet-data';
import { useSession } from '@/src/store/session-store';

export default function AppLayout() {
  const { isReady, isSignedIn } = useSession();
  useWalletRealtime();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="send" />
      <Stack.Screen name="receive" />
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="transaction-detail/[id]" />
      <Stack.Screen name="change-pin" />
    </Stack>
  );
}
