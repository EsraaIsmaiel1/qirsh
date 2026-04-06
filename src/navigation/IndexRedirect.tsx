import { Redirect } from 'expo-router';

import { WalletSplashView } from '@/src/components/wallet/WalletSplashView';
import { useSession } from '@/src/store/session-store';

export default function Index() {
  const { isReady, isSignedIn } = useSession();

  if (!isReady) {
    return <WalletSplashView />;
  }

  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)" />;
}
