import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import type { WalletPalette } from '@/src/utils/wallet-theme';
import { Header } from '@/src/components/wallet/Header';
import { useSession } from '@/src/store/session-store';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const { palette, scheme, toggleTheme } = useWalletTheme();
  const [currency, setCurrency] = useState<'EGP' | 'USD'>('EGP');
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.profileRow}>
            <LinearAvatar />
            <View style={styles.profileText}>
              <Text style={[styles.profileName, { color: palette.foreground }]}>Mohamed Ahmed</Text>
              <Text style={[styles.profileEmail, { color: palette.mutedForeground }]}>
                mohamed.ahmed@email.com
              </Text>
            </View>
            <Pressable style={[styles.smallIcon, { backgroundColor: palette.muted }]}>
              <DynamicIcon name="chevron-right" size={20} color={palette.mutedForeground} />
            </Pressable>
          </View>
          <View style={[styles.statsRow, { borderTopColor: palette.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: palette.primary }]}>24</Text>
              <Text style={[styles.statLabel, { color: palette.mutedForeground }]}>
                Transactions
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: palette.success }]}>5</Text>
              <Text style={[styles.statLabel, { color: palette.mutedForeground }]}>Contacts</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.foreground }]}>Preferences</Text>

          <SettingsRow
            palette={palette}
            icon={scheme === 'dark' ? 'moon' : 'sun'}
            title="Theme"
            subtitle={`${scheme} mode`}
            onPress={toggleTheme}
          />
          <SettingsRow
            palette={palette}
            icon="globe"
            title="Currency"
            subtitle={currency}
            onPress={() => setCurrency(currency === 'EGP' ? 'USD' : 'EGP')}
          />
          <SettingsToggleRow
            palette={palette}
            icon="bell"
            title="Notifications"
            subtitle={notifications ? 'Enabled' : 'Disabled'}
            value={notifications}
            onToggle={() => setNotifications(!notifications)}
          />
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.sectionTitle, { color: palette.foreground }]}>Security</Text>
          <SettingsToggleRow
            palette={palette}
            icon="shield"
            title="Biometric Login"
            subtitle={biometric ? 'Enabled' : 'Disabled'}
            value={biometric}
            onToggle={() => setBiometric(!biometric)}
          />
          <SettingsRow
            palette={palette}
            icon="shield"
            title="Change PIN"
            subtitle="Update your security PIN"
            onPress={() => {}}
            showChevron
          />
        </View>

        <Pressable
          onPress={handleLogout}
          style={[styles.logout, { backgroundColor: `${palette.error}1a` }]}
          accessibilityRole="button"
        >
          <DynamicIcon name="logout" size={20} color={palette.error} />
          <Text style={[styles.logoutText, { color: palette.error }]}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinearAvatar() {
  return (
    <LinearGradient
      colors={['#818cf8', '#6366f1']}
      style={styles.avatar}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.avatarText}>MA</Text>
    </LinearGradient>
  );
}

function SettingsRow({
  palette,
  icon,
  title,
  subtitle,
  onPress,
  showChevron,
}: {
  palette: WalletPalette;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: palette.muted }]}>
        <DynamicIcon name={icon} size={20} color={palette.foreground} />
      </View>
      <View style={styles.rowMid}>
        <Text style={[styles.rowTitle, { color: palette.foreground }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: palette.mutedForeground }]}>{subtitle}</Text>
      </View>
      {(showChevron ?? true) && (
        <DynamicIcon name="chevron-right" size={20} color={palette.mutedForeground} />
      )}
    </Pressable>
  );
}

function SettingsToggleRow({
  palette,
  icon,
  title,
  subtitle,
  value,
  onToggle,
}: {
  palette: WalletPalette;
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: palette.muted }]}>
        <DynamicIcon name={icon} size={20} color={palette.foreground} />
      </View>
      <View style={styles.rowMid}>
        <Text style={[styles.rowTitle, { color: palette.foreground }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: palette.mutedForeground }]}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: value ? palette.primary : palette.muted,
            justifyContent: value ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View style={styles.knob} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 17, paddingBottom: 100, paddingTop: 8, gap: 16 },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  profileText: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileEmail: { fontSize: 14, marginTop: 4 },
  smallIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    gap: 12,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMid: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    marginTop: 0,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
});
