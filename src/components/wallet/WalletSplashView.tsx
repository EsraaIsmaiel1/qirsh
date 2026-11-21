import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';

import { QirshMark } from '@/src/components/brand/QirshMark';

/** Shown while the session loads. Nile background in both themes, like the app icon. */
export function WalletSplashView() {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <QirshMark size={96} body="#FAF6EC" dots="#F0B341" />
        <Text style={styles.title}>Qirsh</Text>
        <Text style={styles.subtitle}>Every qirsh counts · كل قرش بيفرق</Text>
        <ActivityIndicator color="#FAF6EC" style={styles.spinner} accessibilityLabel="Loading" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B5F57',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 20,
    color: '#FAF6EC',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(250,246,236,0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  spinner: {
    marginTop: 32,
  },
});
