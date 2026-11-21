/** Payment PIN calls. The PIN is hashed and checked on the server (see supabase/migrations). */
import { supabase } from './supabase';
import { WalletApiError, walletErrorMessage } from './wallet-api';

export type SecurityStatus = { hasPin: boolean; lockedUntil: Date | null };

export type PinResult =
  | { ok: true; token?: string }
  | { ok: false; error: 'pin_incorrect'; attemptsLeft: number }
  | { ok: false; error: 'pin_locked'; lockedUntil: Date }
  | { ok: false; error: 'pin_not_set' };

export const PIN_LENGTH = 6;

/** Same rules as public.pin_is_weak() on the server. */
export function pinWeaknessReason(pin: string): string | null {
  if (!/^\d{6}$/.test(pin)) return 'PIN must be 6 digits.';
  if (/^(\d)\1{5}$/.test(pin)) return "Don't use the same digit six times.";
  if ('01234567890'.includes(pin) || '09876543210'.includes(pin)) {
    return "Don't use a simple sequence like 123456.";
  }
  return null;
}

type RawPinResult = {
  ok: boolean;
  token?: string;
  error?: string;
  attempts_left?: number;
  locked_until?: string;
};

function parse(raw: RawPinResult): PinResult {
  if (raw.ok) return { ok: true, token: raw.token };
  if (raw.error === 'pin_incorrect') {
    return { ok: false, error: 'pin_incorrect', attemptsLeft: raw.attempts_left ?? 0 };
  }
  if (raw.error === 'pin_locked') {
    return { ok: false, error: 'pin_locked', lockedUntil: new Date(raw.locked_until ?? Date.now()) };
  }
  return { ok: false, error: 'pin_not_set' };
}

function fail(error: { message: string }): never {
  if (error.message.includes('pin_too_weak')) {
    throw new WalletApiError('That PIN is too easy to guess. Choose another one.', 'pin_too_weak');
  }
  throw new WalletApiError(walletErrorMessage(new Error(error.message)));
}

export async function getSecurityStatus(): Promise<SecurityStatus> {
  const { data, error } = await supabase.rpc('security_status');
  if (error) fail(error);
  const raw = data as { has_pin: boolean; locked_until: string | null };
  return {
    hasPin: !!raw.has_pin,
    lockedUntil: raw.locked_until ? new Date(raw.locked_until) : null,
  };
}

export async function setPin(newPin: string, currentPin?: string): Promise<PinResult> {
  const { data, error } = await supabase.rpc('set_pin', {
    p_new_pin: newPin,
    p_current_pin: currentPin ?? null,
  });
  if (error) fail(error);
  return parse(data as RawPinResult);
}

/** On success, `token` authorizes exactly one payment within 2 minutes. */
export async function verifyPin(pin: string): Promise<PinResult> {
  const { data, error } = await supabase.rpc('verify_pin', { p_pin: pin });
  if (error) fail(error);
  return parse(data as RawPinResult);
}
