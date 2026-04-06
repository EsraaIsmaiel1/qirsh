import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { GradientButton } from '@/src/components/wallet/GradientButton';
import { useSession } from '@/src/store/session-store';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const { palette, scheme } = useWalletTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      await signIn();
      router.replace('/(app)/(tabs)/home');
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[palette.gradientStart, palette.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIcon}>
              <DynamicIcon name="wallet" size={40} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>PayWallet</Text>
            <Text style={styles.heroSub}>Your Smart Digital Wallet</Text>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={[styles.h2, { color: palette.foreground }]}>Welcome Back</Text>
            <Text style={[styles.muted, { color: palette.mutedForeground }]}>
              Sign in to continue to your account
            </Text>

            <Text style={[styles.label, { color: palette.foreground }]}>Email</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.muted }]}>
              <DynamicIcon name="mail" size={20} color={palette.mutedForeground} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={palette.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: palette.foreground }]}
              />
            </View>

            <Text style={[styles.label, { color: palette.foreground }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.muted }]}>
              <DynamicIcon name="lock" size={20} color={palette.mutedForeground} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={palette.mutedForeground}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: palette.foreground, flex: 1 }]}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <DynamicIcon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={palette.mutedForeground}
                />
              </Pressable>
            </View>

            <Pressable style={styles.forgot}>
              <Text style={{ color: palette.primary, fontWeight: '600', fontSize: 14 }}>
                Forgot Password?
              </Text>
            </Pressable>

            <GradientButton
              title={loading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              disabled={!email.trim() || !password}
            />

            <View style={styles.signupRow}>
              <Text style={{ color: palette.mutedForeground, fontSize: 14 }}>
                Don&apos;t have an account?{' '}
              </Text>
              <Pressable onPress={() => router.push('/(auth)/register')}>
                <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 14 }}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 32 },
  hero: {
    height: 220,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  form: { paddingHorizontal: 24, paddingTop: 28 },
  h2: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  muted: { fontSize: 14, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  input: { fontSize: 16, flex: 1, padding: 0 },
  forgot: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 4 },
  signupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
});
