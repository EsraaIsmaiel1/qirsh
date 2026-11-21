import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '@/src/components/wallet/Header';
import { PinPad } from '@/src/components/wallet/PinPad';
import { ErrorState, LoadingState } from '@/src/components/wallet/States';
import { useSecurityStatus, walletKeys } from '@/src/hooks/use-wallet-data';
import { updateStoredPin } from '@/src/services/biometric';
import { pinWeaknessReason, setPin } from '@/src/services/security-api';
import { walletErrorMessage } from '@/src/services/wallet-api';
import { useSessionStore } from '@/src/store/session-store';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

type Step = 'current' | 'new' | 'confirm';

export default function ChangePinScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const queryClient = useQueryClient();
  const userId = useSessionStore((s) => s.session?.user.id ?? '');
  const status = useSecurityStatus();
  const hasPin = status.data?.hasPin ?? false;

  const [stepState, setStep] = useState<Step | null>(null);
  const step: Step = stepState ?? (hasPin ? 'current' : 'new');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleBack = () => {
    if (busy) return;
    setError(null);
    if (step === 'confirm') setStep('new');
    else if (step === 'new' && hasPin) setStep('current');
    else router.back();
  };

  const save = async (pin: string) => {
    setBusy(true);
    try {
      const result = await setPin(pin, hasPin ? currentPin : undefined);
      if (result.ok) {
        await updateStoredPin(userId, pin);
        await queryClient.invalidateQueries({ queryKey: walletKeys.security(userId) });
        Alert.alert(
          hasPin ? 'PIN changed' : 'PIN created',
          hasPin
            ? 'Use your new PIN for your next payment.'
            : 'You will be asked for this PIN before every payment.'
        );
        router.back();
        return;
      }
      if (result.error === 'pin_incorrect') {
        setCurrentPin('');
        setNewPin('');
        setStep('current');
        setError(
          `Current PIN is wrong. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`
        );
      } else if (result.error === 'pin_locked') {
        Alert.alert(
          'PIN locked',
          `Too many wrong attempts. Try again after ${format(result.lockedUntil, 'HH:mm')}.`
        );
        router.back();
      }
    } catch (e) {
      setNewPin('');
      setStep('new');
      setError(walletErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onComplete = (pin: string) => {
    setError(null);
    if (step === 'current') {
      setCurrentPin(pin);
      setStep('new');
      return;
    }
    if (step === 'new') {
      const reason = pinWeaknessReason(pin);
      if (reason) {
        setError(reason);
        return;
      }
      if (hasPin && pin === currentPin) {
        setError('Your new PIN must be different from the current one.');
        return;
      }
      setNewPin(pin);
      setStep('confirm');
      return;
    }
    if (pin !== newPin) {
      setNewPin('');
      setStep('new');
      setError("PINs didn't match. Please choose your new PIN again.");
      return;
    }
    void save(pin);
  };

  const title =
    step === 'current'
      ? 'Enter current PIN'
      : step === 'new'
        ? hasPin
          ? 'Choose a new PIN'
          : 'Create your payment PIN'
        : 'Confirm your PIN';
  const subtitle =
    step === 'current'
      ? 'To change your PIN, first confirm the one you use now.'
      : step === 'new'
        ? "6 digits. Avoid easy ones like 123456 or your birth year."
        : 'Enter the same 6 digits again.';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title={hasPin ? 'Change PIN' : 'Set PIN'} showBack onBack={handleBack} />
      {status.isLoading ? (
        <LoadingState />
      ) : status.isError ? (
        <ErrorState message={walletErrorMessage(status.error)} onRetry={() => status.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <PinPad
            key={step}
            title={title}
            subtitle={subtitle}
            error={error}
            busy={busy}
            onComplete={onComplete}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingBottom: 32 },
});
