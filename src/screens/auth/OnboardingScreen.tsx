import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QirshMark } from '@/src/components/brand/QirshMark';
import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { GradientButton } from '@/src/components/wallet/GradientButton';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

const STEPS = [
  {
    id: 1,
    icon: 'wallet' as const,
    title: 'Welcome to Qirsh',
    description:
      'Securely store and manage your money in one place. Send and receive payments instantly.',
    gradient: ['#0B5F57', '#0B5F57'] as const,
  },
  {
    id: 2,
    icon: 'trending-up' as const,
    title: 'Track Expenses',
    description:
      'Monitor your spending with detailed analytics and insights. Set budgets for different categories.',
    gradient: ['#13877B', '#13877B'] as const,
  },
  {
    id: 3,
    icon: 'shield' as const,
    title: 'Secure & Safe',
    description:
      'Bank-level security with biometric authentication. Your data is encrypted and protected.',
    gradient: ['#062E2A', '#062E2A'] as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentStep((s) => s + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={styles.skipRow}>
        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text style={[styles.skip, { color: palette.mutedForeground }]}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.center}>
        <View
          style={[
            styles.iconBig,
            {
              backgroundColor: step.gradient[0],
              // 59 = 35% opacity as a hex alpha
              boxShadow: `0px 12px 16px ${step.gradient[1]}59`,
            },
          ]}
        >
          {currentStep === 0 ? (
            <QirshMark size={72} body="#FAF6EC" dots="#F0B341" />
          ) : (
            <DynamicIcon name={step.icon} size={56} color="#fff" />
          )}
        </View>
        <Text style={[styles.title, { color: palette.foreground }]}>{step.title}</Text>
        <Text style={[styles.desc, { color: palette.mutedForeground }]}>{step.description}</Text>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: i === currentStep ? 32 : 8,
                  backgroundColor: i === currentStep ? palette.primary : palette.muted,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <GradientButton
          title={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 17, paddingTop: 8 },
  skip: { fontSize: 14, fontWeight: '700' },
  center: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 48,
  },
  iconBig: {
    width: 128,
    height: 128,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  desc: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 48,
  },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  footer: { padding: 24, paddingBottom: 32 },
  cta: { width: '100%' },
});
