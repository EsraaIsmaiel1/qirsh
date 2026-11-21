import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '@/src/components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DynamicIcon } from '@/src/components/wallet/DynamicIcon';
import { GradientButton } from '@/src/components/wallet/GradientButton';
import { Header } from '@/src/components/wallet/Header';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/wallet/States';
import {
  useContacts,
  useFindRecipient,
  useSendMoney,
  useWallet,
} from '@/src/hooks/use-wallet-data';
import { usePinGate } from '@/src/hooks/use-pin-gate';
import { walletErrorMessage } from '@/src/services/wallet-api';
import type { Contact } from '@/src/types/wallet';
import {
  formatCents,
  newIdempotencyKey,
  parseAmountToCents,
  sanitizeAmountInput,
} from '@/src/utils/money';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

type Step = 'amount' | 'contact' | 'confirm';

export default function SendMoneyScreen() {
  const router = useRouter();
  const { palette } = useWalletTheme();
  const contactsQuery = useContacts();
  const wallet = useWallet();
  const findRecipient = useFindRecipient();
  const sendMoney = useSendMoney();
  const { authorize, pinModal } = usePinGate();
  const [authorizing, setAuthorizing] = useState(false);

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState<Contact | null | undefined>(undefined);
  const [note, setNote] = useState('');
  // One key per confirm screen, so double taps / retries can't send twice.
  const idempotencyKey = useRef<string>(newIdempotencyKey());

  const contacts = contactsQuery.data ?? [];
  const amountCents = parseAmountToCents(amount);
  const balanceCents = wallet.data?.balanceCents;
  const currency = wallet.data?.currency ?? 'EGP';
  const overBalance = amountCents != null && balanceCents != null && amountCents > balanceCents;
  const loading = sendMoney.isPending || authorizing;

  const handleBack = () => {
    if (loading) return;
    if (step === 'contact') setStep('amount');
    else if (step === 'confirm') setStep('contact');
    else router.back();
  };

  const handleAmountNext = () => {
    if (amountCents != null && !overBalance) setStep('contact');
  };

  const chooseRecipient = (c: Contact) => {
    setSelected(c);
    idempotencyKey.current = newIdempotencyKey();
    setStep('confirm');
  };

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    try {
      setSearchResult(await findRecipient.mutateAsync(q));
    } catch (e) {
      Alert.alert('Search failed', walletErrorMessage(e));
    }
  };

  const handleConfirm = async () => {
    if (!selected || amountCents == null || loading) return;
    setAuthorizing(true);
    const auth = await authorize({
      title: 'Confirm with PIN',
      subtitle: `Send ${currency} ${formatCents(amountCents)} to ${selected.name}`,
    });
    setAuthorizing(false);
    if (!auth) return;
    try {
      await sendMoney.mutateAsync({
        recipientId: selected.id,
        amountCents,
        note,
        idempotencyKey: idempotencyKey.current,
        authToken: auth.token,
      });
      Alert.alert('Money sent', `${currency} ${formatCents(amountCents)} sent to ${selected.name}.`);
      router.replace('/(app)/(tabs)/home');
    } catch (e) {
      Alert.alert('Transfer failed', walletErrorMessage(e));
    }
  };

  if (step === 'amount') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Send Money" showBack onBack={handleBack} />
        <View style={styles.center}>
          <Text style={[styles.hint, { color: palette.mutedForeground }]}>Amount to Send</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: palette.mutedForeground }]}>EGP</Text>
            <TextInput
              value={amount}
              onChangeText={(t) => setAmount(sanitizeAmountInput(t))}
              placeholder="0.00"
              placeholderTextColor={palette.mutedForeground}
              keyboardType="decimal-pad"
              style={[styles.amountInput, { color: palette.foreground }]}
            />
          </View>
          <Text
            style={[
              styles.hint,
              { color: overBalance ? palette.error : palette.mutedForeground, marginBottom: 16 },
            ]}
          >
            {balanceCents == null
              ? ' '
              : overBalance
                ? `Not enough balance (available ${currency} ${formatCents(balanceCents)})`
                : `Available: ${currency} ${formatCents(balanceCents)}`}
          </Text>
          <View style={styles.quickGrid}>
            {[100, 500, 1000].map((q) => (
              <Pressable
                key={q}
                onPress={() => setAmount(String(q))}
                style={[styles.quickBtn, { backgroundColor: palette.muted }]}
              >
                <Text style={{ fontWeight: '700', color: palette.foreground }}>{q}</Text>
              </Pressable>
            ))}
          </View>
          <GradientButton
            title="Continue"
            onPress={handleAmountNext}
            disabled={amountCents == null || overBalance}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'contact') {
    const renderContact = (c: Contact) => (
      <Pressable
        key={c.id}
        onPress={() => chooseRecipient(c)}
        style={[styles.contactCard, { backgroundColor: palette.card, borderColor: palette.border }]}
      >
        <LinearContactAvatar text={c.avatar} />
        <View style={styles.contactMid}>
          <Text style={[styles.contactName, { color: palette.foreground }]}>{c.name}</Text>
          <Text style={[styles.contactEmail, { color: palette.mutedForeground }]}>
            @{c.walletTag}
          </Text>
        </View>
        <DynamicIcon name="arrow-right" size={20} color={palette.mutedForeground} />
      </Pressable>
    );

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
        <Header title="Send To" showBack onBack={handleBack} />
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.label, { color: palette.foreground }]}>
            Find by wallet ID or email
          </Text>
          <View style={styles.searchRow}>
            <View style={[styles.searchInputWrap, { backgroundColor: palette.muted }]}>
              <DynamicIcon name="search" size={20} color={palette.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={(t) => {
                  setSearch(t);
                  setSearchResult(undefined);
                }}
                onSubmitEditing={handleSearch}
                placeholder="@wallet_id or email"
                placeholderTextColor={palette.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="search"
                style={[styles.searchInput, { color: palette.foreground }]}
              />
            </View>
            <Pressable
              onPress={handleSearch}
              disabled={!search.trim() || findRecipient.isPending}
              style={[styles.findBtn, { backgroundColor: palette.primary }]}
              accessibilityRole="button"
            >
              {findRecipient.isPending ? (
                <ActivityIndicator color={palette.primaryForeground} />
              ) : (
                <Text style={{ color: palette.primaryForeground, fontWeight: '700' }}>Find</Text>
              )}
            </Pressable>
          </View>

          {searchResult === null ? (
            <Text style={[styles.searchMsg, { color: palette.mutedForeground }]}>
              No Qirsh user found. Check the wallet ID or email and try again.
            </Text>
          ) : searchResult ? (
            renderContact(searchResult)
          ) : null}

          <Text style={[styles.sectionLabel, { color: palette.foreground }]}>Recent</Text>
          {contactsQuery.isLoading ? (
            <LoadingState />
          ) : contactsQuery.isError ? (
            <ErrorState
              message={walletErrorMessage(contactsQuery.error)}
              onRetry={() => contactsQuery.refetch()}
            />
          ) : contacts.length > 0 ? (
            contacts.map(renderContact)
          ) : (
            <EmptyState
              icon="users"
              title="No contacts yet"
              subtitle="People you send money to will appear here."
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const amt = amountCents ?? 0;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <Header title="Confirm Transfer" showBack onBack={handleBack} />
      <ScrollView contentContainerStyle={styles.confirmScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.centerHint, { color: palette.mutedForeground }]}>
          You&apos;re sending
        </Text>
        <Text style={[styles.bigAmount, { color: palette.primary }]}>
          {currency} {formatCents(amt)}
        </Text>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.contactRow}>
            <LinearContactAvatar text={selected?.avatar ?? ''} large />
            <View>
              <Text style={[styles.smallMuted, { color: palette.mutedForeground }]}>To</Text>
              <Text style={[styles.contactName, { color: palette.foreground }]}>
                {selected?.name}
              </Text>
              <Text style={[styles.contactEmail, { color: palette.mutedForeground }]}>
                @{selected?.walletTag}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { borderColor: palette.border }]} />
          <View style={styles.rowBetween}>
            <Text style={{ color: palette.mutedForeground }}>Transfer Fee</Text>
            <Text style={{ fontWeight: '700', color: palette.foreground }}>Free</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={{ color: palette.mutedForeground }}>Total Amount</Text>
            <Text style={{ fontWeight: '800', fontSize: 18, color: palette.foreground }}>
              {currency} {formatCents(amt)}
            </Text>
          </View>
          {balanceCents != null ? (
            <View style={styles.rowBetween}>
              <Text style={{ color: palette.mutedForeground }}>Balance After</Text>
              <Text style={{ fontWeight: '700', color: palette.foreground }}>
                {currency} {formatCents(Math.max(balanceCents - amt, 0))}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.label, { color: palette.foreground }]}>Add Note (Optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What's this for?"
          placeholderTextColor={palette.mutedForeground}
          maxLength={280}
          editable={!loading}
          multiline
          style={[styles.textarea, { backgroundColor: palette.muted, color: palette.foreground }]}
        />

        <GradientButton
          title={loading ? 'Processing...' : 'Confirm & Send'}
          onPress={handleConfirm}
          loading={loading}
        />
        {pinModal}
      </ScrollView>
    </SafeAreaView>
  );
}

function LinearContactAvatar({ text, large }: { text: string; large?: boolean }) {
  const size = large ? 64 : 56;
  return (
    <LinearGradient
      colors={['#13877B', '#0B5F57']}
      style={[styles.avatar, { width: size, height: size, borderRadius: large ? 16 : 16 }]}
    >
      <Text style={[styles.avatarTxt, { fontSize: large ? 22 : 18 }]}>{text}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  findBtn: {
    borderRadius: 16,
    paddingHorizontal: 18,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchMsg: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  safe: { flex: 1 },
  center: { flex: 1, paddingHorizontal: 17, justifyContent: 'center', paddingBottom: 40 },
  hint: { textAlign: 'center', marginBottom: 8, fontSize: 14 },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  currency: { fontSize: 28, fontWeight: '800' },
  amountInput: { fontSize: 48, fontWeight: '800', minWidth: 120, textAlign: 'center', padding: 0 },
  quickGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  list: { padding: 24, paddingBottom: 40, gap: 12 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '800' },
  contactMid: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '700' },
  contactEmail: { fontSize: 13, marginTop: 2 },
  confirmScroll: { padding: 24, paddingBottom: 40 },
  centerHint: { textAlign: 'center', marginBottom: 8 },
  bigAmount: { textAlign: 'center', fontSize: 40, fontWeight: '800', marginBottom: 24 },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  smallMuted: { fontSize: 13, marginBottom: 4 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, marginVertical: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontWeight: '600', marginBottom: 8 },
  textarea: {
    borderRadius: 16,
    padding: 16,
    minHeight: 88,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
});
