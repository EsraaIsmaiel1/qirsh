import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/src/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { PIN_LENGTH } from '@/src/services/security-api';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

type PinPadProps = {
  title: string;
  subtitle?: string;
  error?: string | null;
  busy?: boolean;
  /** Called with the full PIN; the pad clears itself right after. */
  onComplete: (pin: string) => void;
  /** Shows a fingerprint key in the bottom-left slot. */
  onBiometric?: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'] as const;

function tap() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

/** Inline 6-digit PIN entry with a numeric keypad. */
export function PinPad({ title, subtitle, error, busy, onComplete, onBiometric }: PinPadProps) {
  const { palette } = useWalletTheme();
  const [digits, setDigits] = useState('');

  const press = (key: (typeof KEYS)[number]) => {
    if (busy) return;
    if (key === 'bio') {
      onBiometric?.();
      return;
    }
    tap();
    if (key === 'del') {
      setDigits((d) => d.slice(0, -1));
      return;
    }
    const next = (digits + key).slice(0, PIN_LENGTH);
    if (next.length === PIN_LENGTH) {
      setDigits('');
      onComplete(next);
    } else {
      setDigits(next);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.lock, { backgroundColor: `${palette.primary}22` }]}>
        <DynamicIcon name="lock" size={28} color={palette.primary} />
      </View>
      <Text style={[styles.title, { color: palette.foreground }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: palette.mutedForeground }]}>{subtitle}</Text>
      ) : null}

      <View style={styles.dots} accessibilityLabel={`${digits.length} of ${PIN_LENGTH} digits entered`}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: error ? palette.error : palette.primary },
              i < digits.length && { backgroundColor: error ? palette.error : palette.primary },
            ]}
          />
        ))}
      </View>

      <View style={styles.status}>
        {busy ? (
          <ActivityIndicator color={palette.primary} />
        ) : error ? (
          <Text style={[styles.error, { color: palette.error }]} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>

      <View style={styles.grid}>
        {KEYS.map((key) => {
          if (key === 'bio' && !onBiometric) return <View key={key} style={styles.key} />;
          return (
            <Pressable
              key={key}
              onPress={() => press(key)}
              disabled={busy}
              style={({ pressed }) => [
                styles.key,
                key !== 'bio' && key !== 'del' && { backgroundColor: palette.muted },
                pressed && { opacity: 0.6 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                key === 'del' ? 'Delete' : key === 'bio' ? 'Use fingerprint or Face ID' : key
              }
            >
              {key === 'del' ? (
                <Text style={[styles.keyText, { color: palette.foreground }]}>⌫</Text>
              ) : key === 'bio' ? (
                <DynamicIcon name="fingerprint" size={30} color={palette.primary} />
              ) : (
                <Text style={[styles.keyText, { color: palette.foreground }]}>{key}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type PinPadModalProps = PinPadProps & {
  visible: boolean;
  onCancel: () => void;
};

/** Full-screen PIN prompt used before payments. */
export function PinPadModal({ visible, onCancel, ...pad }: PinPadModalProps) {
  const { palette } = useWalletTheme();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <SafeAreaView style={[styles.modal, { backgroundColor: palette.background }]}>
        <View style={styles.modalTop}>
          <Pressable
            onPress={onCancel}
            hitSlop={12}
            disabled={pad.busy}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 16 }}>Cancel</Text>
          </Pressable>
        </View>
        <PinPad {...pad} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  lock: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  dots: { flexDirection: 'row', gap: 14, marginTop: 28 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  status: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  error: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 300,
    gap: 16,
    marginTop: 4,
  },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 28, fontWeight: '600' },
  modal: { flex: 1 },
  modalTop: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
});
