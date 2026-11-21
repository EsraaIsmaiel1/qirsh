/**
 * Money helpers. All amounts travel as integer cents (piastres) so we never
 * do arithmetic on floats.
 */

const AMOUNT_RE = /^\d{1,9}(\.\d{0,2})?$/;

/** Keeps only digits and a single dot with at most 2 decimals, for amount TextInputs. */
export function sanitizeAmountInput(text: string): string {
  let s = text.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    const [whole, frac] = s.split('.');
    s = `${whole}.${frac.slice(0, 2)}`;
  }
  // drop leading zeros like "007" but keep "0." and "0"
  s = s.replace(/^0+(?=\d)/, '');
  return s.slice(0, 12);
}

/** "125.5" -> 12550. Returns null for empty, malformed, zero or negative input. */
export function parseAmountToCents(input: string): number | null {
  const s = input.trim();
  if (!AMOUNT_RE.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  return cents;
}

/** 12550 -> "125.50" (with thousands separators). */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 12550, 'EGP' -> "EGP 125.50" */
export function formatMoney(cents: number, currency = 'EGP'): string {
  return `${currency} ${formatCents(cents)}`;
}

/** "Mohamed Ahmed" -> "MA" */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/**
 * Random UUID v4 used as an idempotency key, so a double-tap or retry of the
 * same confirm screen can't charge twice. Uses crypto when available.
 */
export function newIdempotencyKey(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
