import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { Header } from '@/src/components/wallet/Header';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

const WALLET_ADDRESS = 'paywallet_user_8392';

export default function ReceiveMoneyScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Send money to my PayWallet: ${WALLET_ADDRESS}`,
        title: 'PayWallet',
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Receive Money" showBack onBack={() => router.back()} />
      <View style={styles.body}>
        <View
          style={[styles.qrCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <View style={styles.qrInner}>
            <QRCode value={WALLET_ADDRESS} size={200} backgroundColor="#fff" color="#111" />
          </View>
          <Text style={[styles.qrHint, { color: palette.mutedForeground }]}>
            Scan this QR code to send money to your wallet
          </Text>
        </View>

        <View
          style={[styles.addrCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.addrLabel, { color: palette.mutedForeground }]}>
            Your Wallet Address
          </Text>
          <View style={styles.addrRow}>
            <Text
              style={[styles.addrText, { color: palette.foreground }]}
              selectable
              numberOfLines={3}
            >
              {WALLET_ADDRESS}
            </Text>
            <Pressable
              onPress={handleCopy}
              style={[styles.copyBtn, { backgroundColor: `${palette.primary}22` }]}
              accessibilityRole="button"
              accessibilityLabel="Copy address"
            >
              <DynamicIcon name="copy" size={18} color={palette.primary} />
            </Pressable>
          </View>
          {copied ? (
            <Text style={[styles.copied, { color: palette.success }]}>Copied to clipboard!</Text>
          ) : null}
        </View>

        <Pressable
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: palette.muted }]}
          accessibilityRole="button"
        >
          <DynamicIcon name="share" size={20} color={palette.foreground} />
          <Text style={[styles.shareText, { color: palette.foreground }]}>Share QR Code</Text>
        </Pressable>

        <View
          style={[
            styles.info,
            { backgroundColor: `${palette.primary}14`, borderColor: `${palette.primary}33` },
          ]}
        >
          <Text style={[styles.infoText, { color: palette.mutedForeground }]}>
            Your QR code and wallet address are safe to share. Anyone can use them to send you money
            instantly.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 17, paddingTop: 16, paddingBottom: 32 },
  qrCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrInner: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  qrHint: { fontSize: 13, textAlign: 'center' },
  addrCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  addrLabel: { fontSize: 13, marginBottom: 8 },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addrText: { flex: 1, fontFamily: 'monospace', fontSize: 14, fontWeight: '600' },
  copyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copied: { fontSize: 12, marginTop: 8, fontWeight: '600' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  shareText: { fontSize: 16, fontWeight: '700' },
  info: {
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infoText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
