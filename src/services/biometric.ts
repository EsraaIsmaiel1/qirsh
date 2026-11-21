/**
 * Fingerprint / Face ID unlock for the payment PIN.
 *
 * When enabled, the PIN is kept in the device keychain/keystore (expo-secure-store)
 * and is only read after a successful biometric check. The server still verifies
 * the PIN itself, so biometrics never bypass the server-side check.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const pinKey = (userId: string) => `qirsh_pin_${userId}`;

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function isBiometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function isBiometricEnabled(userId: string): Promise<boolean> {
  if (Platform.OS === 'web' || !userId) return false;
  try {
    return (await SecureStore.getItemAsync(pinKey(userId), STORE_OPTIONS)) != null;
  } catch {
    return false;
  }
}

async function authenticate(prompt: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Use PIN',
    disableDeviceFallback: true,
  });
  return result.success;
}

/** Asks for a biometric check, then saves the (already verified) PIN on this device. */
export async function enableBiometric(userId: string, pin: string): Promise<boolean> {
  if (!(await isBiometricAvailable())) return false;
  if (!(await authenticate('Confirm to enable biometric payments'))) return false;
  await SecureStore.setItemAsync(pinKey(userId), pin, STORE_OPTIONS);
  return true;
}

/** Keeps the saved PIN in sync after the user changes it. No-op if biometrics are off. */
export async function updateStoredPin(userId: string, pin: string): Promise<void> {
  if (await isBiometricEnabled(userId)) {
    await SecureStore.setItemAsync(pinKey(userId), pin, STORE_OPTIONS);
  }
}

export async function disableBiometric(userId: string): Promise<void> {
  if (Platform.OS === 'web' || !userId) return;
  try {
    await SecureStore.deleteItemAsync(pinKey(userId), STORE_OPTIONS);
  } catch {
    /* already gone */
  }
}

/** Returns the saved PIN after a successful biometric check, or null if cancelled/unavailable. */
export async function unlockPinWithBiometric(userId: string): Promise<string | null> {
  if (!(await isBiometricEnabled(userId))) return null;
  if (!(await authenticate('Confirm payment'))) return null;
  try {
    return await SecureStore.getItemAsync(pinKey(userId), STORE_OPTIONS);
  } catch {
    return null;
  }
}
