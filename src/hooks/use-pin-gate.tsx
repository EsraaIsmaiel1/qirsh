import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { PinPadModal } from '@/src/components/wallet/PinPad';
import {
  disableBiometric,
  isBiometricEnabled,
  unlockPinWithBiometric,
} from '@/src/services/biometric';
import { getSecurityStatus, verifyPin, type PinResult } from '@/src/services/security-api';
import { walletErrorMessage } from '@/src/services/wallet-api';
import { useSessionStore } from '@/src/store/session-store';

export type PinAuthorization = {
  /** One-time token for the next payment (send_money / add_expense). */
  token: string;
  /** The PIN that was entered (only when typed, not when unlocked by biometrics). */
  pin?: string;
};

type AuthorizeOptions = {
  title?: string;
  subtitle?: string;
  /** Try fingerprint / Face ID first if enabled. Default true. */
  allowBiometric?: boolean;
};

function lockedMessage(until: Date) {
  return `Too many wrong attempts. Your PIN is locked until ${format(until, 'HH:mm')}.`;
}

/**
 * Asks the user to confirm with their payment PIN (or biometrics) and returns a
 * one-time server token. Render `pinModal` somewhere in the screen.
 *
 *   const { authorize, pinModal } = usePinGate();
 *   const auth = await authorize();
 *   if (!auth) return; // cancelled
 */
export function usePinGate() {
  const router = useRouter();
  const userId = useSessionStore((s) => s.session?.user.id ?? '');

  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [labels, setLabels] = useState({ title: 'Enter your PIN', subtitle: '' });
  const [canUseBiometric, setCanUseBiometric] = useState(false);
  const resolver = useRef<((auth: PinAuthorization | null) => void) | null>(null);

  const finish = useCallback((auth: PinAuthorization | null) => {
    setVisible(false);
    setBusy(false);
    resolver.current?.(auth);
    resolver.current = null;
  }, []);

  /** Handles a non-success result. Returns true if the prompt should stay open. */
  const handleFailure = useCallback(
    (result: Exclude<PinResult, { ok: true }>): boolean => {
      if (result.error === 'pin_incorrect') {
        setError(
          `Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`
        );
        return true;
      }
      if (result.error === 'pin_locked') {
        Alert.alert('PIN locked', lockedMessage(result.lockedUntil));
        return false;
      }
      Alert.alert('Set up your PIN', 'Please create a payment PIN first.');
      return false;
    },
    []
  );

  const tryBiometric = useCallback(async (): Promise<PinAuthorization | 'fallback' | null> => {
    const storedPin = await unlockPinWithBiometric(userId);
    if (!storedPin) return 'fallback'; // cancelled or unavailable -> type PIN instead
    const result = await verifyPin(storedPin);
    if (result.ok && result.token) return { token: result.token };
    if (!result.ok && result.error === 'pin_incorrect') {
      // Saved PIN is out of date (changed on another device). Turn biometrics off.
      await disableBiometric(userId);
      setCanUseBiometric(false);
      setError('Your PIN changed. Enter it to continue; biometric unlock was turned off.');
      return 'fallback';
    }
    if (!result.ok) handleFailure(result);
    return null;
  }, [userId, handleFailure]);

  const authorize = useCallback(
    async (options: AuthorizeOptions = {}): Promise<PinAuthorization | null> => {
      const { allowBiometric = true } = options;
      setError(null);
      setLabels({
        title: options.title ?? 'Enter your PIN',
        subtitle: options.subtitle ?? 'Confirm this payment with your 6-digit PIN',
      });

      try {
        const status = await getSecurityStatus();
        if (!status.hasPin) {
          Alert.alert(
            'Set up your payment PIN',
            'For your security, payments need a 6-digit PIN. It only takes a moment.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Set PIN', onPress: () => router.push('/(app)/change-pin') },
            ]
          );
          return null;
        }
        if (status.lockedUntil) {
          Alert.alert('PIN locked', lockedMessage(status.lockedUntil));
          return null;
        }

        const bioEnabled = allowBiometric && (await isBiometricEnabled(userId));
        setCanUseBiometric(bioEnabled);
        if (bioEnabled) {
          const bio = await tryBiometric();
          if (bio === null) return null;
          if (bio !== 'fallback') return bio;
        }
      } catch (e) {
        Alert.alert('Something went wrong', walletErrorMessage(e));
        return null;
      }

      return new Promise<PinAuthorization | null>((resolve) => {
        resolver.current = resolve;
        setVisible(true);
      });
    },
    [router, userId, tryBiometric]
  );

  const onComplete = useCallback(
    async (pin: string) => {
      setBusy(true);
      setError(null);
      try {
        const result = await verifyPin(pin);
        if (result.ok && result.token) {
          finish({ token: result.token, pin });
          return;
        }
        if (!result.ok && !handleFailure(result)) finish(null);
      } catch (e) {
        setError(walletErrorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    [finish, handleFailure]
  );

  const onBiometric = useCallback(async () => {
    setBusy(true);
    try {
      const bio = await tryBiometric();
      if (bio && bio !== 'fallback') finish(bio);
      else if (bio === null) finish(null);
    } catch (e) {
      setError(walletErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [tryBiometric, finish]);

  const pinModal = (
    <PinPadModal
      visible={visible}
      title={labels.title}
      subtitle={labels.subtitle}
      error={error}
      busy={busy}
      onComplete={onComplete}
      onBiometric={canUseBiometric ? onBiometric : undefined}
      onCancel={() => finish(null)}
    />
  );

  return { authorize, pinModal };
}
