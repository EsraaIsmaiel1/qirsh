import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '@/src/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { GradientButton } from '@/src/components/wallet/GradientButton';
import { authErrorMessage, useSession } from '@/src/store/session-store';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useSession();
  const { palette } = useWalletTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (name.trim().length < 2) return 'Please enter your full name.';
    if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
    if (password.length < MIN_PASSWORD)
      return `Password must be at least ${MIN_PASSWORD} characters.`;
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
      return 'Password must contain at least one letter and one number.';
    if (password !== confirm) return 'Passwords do not match.';
    if (!terms) return 'Please accept the Terms of Service and Privacy Policy.';
    return null;
  };

  const handleRegister = async () => {
    if (loading) return;
    const problem = validate();
    setError(problem);
    if (problem) return;

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp(name, email, password);
      if (needsEmailConfirmation) {
        Alert.alert(
          'Check your email',
          `We sent a confirmation link to ${email.trim()}. Confirm it, then sign in.`
        );
        router.replace('/(auth)/login');
      } else {
        router.replace('/(app)/(tabs)/home');
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
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
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={{ color: '#fff', fontSize: 22 }}>←</Text>
            </Pressable>
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSub}>Join us and start managing your finances</Text>
          </LinearGradient>

          <View style={styles.form}>
            <Text style={[styles.label, { color: palette.foreground }]}>Full Name</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.muted }]}>
              <DynamicIcon name="user" size={20} color={palette.mutedForeground} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor={palette.mutedForeground}
                style={[styles.input, { color: palette.foreground }]}
              />
            </View>

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
                placeholder="Create a password"
                placeholderTextColor={palette.mutedForeground}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: palette.foreground, flex: 1 }]}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <DynamicIcon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={palette.mutedForeground}
                />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: palette.foreground }]}>Confirm Password</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.muted }]}>
              <DynamicIcon name="lock" size={20} color={palette.mutedForeground} />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Confirm your password"
                placeholderTextColor={palette.mutedForeground}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: palette.foreground }]}
              />
            </View>

            <Pressable
              style={styles.termsRow}
              onPress={() => setTerms(!terms)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: terms }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: palette.primary,
                    backgroundColor: terms ? palette.primary : 'transparent',
                  },
                ]}
              >
                {terms ? (
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                ) : null}
              </View>
              <Text style={[styles.termsText, { color: palette.mutedForeground }]}>
                I agree to the Terms of Service and Privacy Policy
              </Text>
            </Pressable>

            {error ? (
              <Text style={[styles.error, { color: palette.error }]} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <GradientButton
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              loading={loading}
              disabled={!name.trim() || !email.trim() || !password || !confirm}
            />

            <View style={styles.signupRow}>
              <Text style={{ color: palette.mutedForeground, fontSize: 14 }}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 14 }}>
                  Sign In
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
  error: { fontSize: 14, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 32 },
  hero: {
    paddingHorizontal: 17,
    paddingTop: 8,
    paddingBottom: 28,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6 },
  form: { paddingHorizontal: 24, paddingTop: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
  },
  input: { fontSize: 16, flex: 1, padding: 0 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginVertical: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: { flex: 1, fontSize: 12, lineHeight: 18 },
  signupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
});
