import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Check, CircleDollarSign, CreditCard, Smartphone } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { AppBar, Button, Card, Screen, Text, TextField } from '@/components/ui';
import { DEMO_USER, useAuthUser } from '@/lib/auth/session';
import { useTheme } from '@/theme';
import { makeQrMatrix } from '@/lib/qr-code';

const methods = [
  { id: 'gcash', title: 'GCash', detail: 'Send your payout to a GCash number', Icon: Smartphone },
  { id: 'bpi', title: 'BPI bank transfer', detail: 'Withdraw to a BPI account', Icon: CreditCard },
  { id: 'other', title: 'Other bank or e-wallet', detail: 'Choose another supported provider', Icon: CircleDollarSign },
  { id: 'cash', title: 'Cash pickup with QR code', detail: 'Show your demo pickup QR code', Icon: CircleDollarSign },
] as const;

export default function WithdrawScreen() {
  const { colors } = useTheme();
  const user = useAuthUser() ?? DEMO_USER;
  const [method, setMethod] = useState<(typeof methods)[number]['id']>('gcash');
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [cashReference, setCashReference] = useState('');
  const validAmount = Number(amount) > 0 && Number(amount) <= user.balance;

  return (
    <Screen>
      <AppBar title="Withdraw money" fallbackHref="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text variant="displayLg">Choose a payout method</Text>
          <Text variant="body" tone="secondary">Select where you would like a withdrawal to go.</Text>
        </View>

        <Card className="flex-row items-center justify-between p-4" bordered>
          <View>
            <Text variant="caption" tone="secondary">AVAILABLE DEMO BALANCE</Text>
            <Text variant="heading" className="pt-1 text-xl">₱{user.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
          </View>
          <CircleDollarSign size={25} color={colors.brand} />
        </Card>

        <View className="gap-2">
          <Text variant="label">Payout method</Text>
          {methods.map(({ id, title, detail, Icon }) => {
            const selected = method === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => { setMethod(id); setSubmitted(false); }}
                className="flex-row items-center gap-3 rounded-2xl border p-4"
                style={{ backgroundColor: colors.surface, borderColor: selected ? colors.brand : colors.border }}
              >
                <View className="h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accentFaint }}>
                  <Icon size={21} color={colors.brand} />
                </View>
                <View className="flex-1 gap-1">
                  <Text variant="label">{title}</Text>
                  <Text variant="caption" tone="secondary">{detail}</Text>
                </View>
                <View className="h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: selected ? colors.brand : colors.borderStrong, backgroundColor: selected ? colors.brand : 'transparent' }}>
                  {selected ? <Check size={14} color={colors.textInverse} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Card className="gap-4 p-4" bordered>
          <TextField label="Amount (PHP)" value={amount} onChangeText={(value) => { setAmount(value.replace(/[^0-9.]/g, '')); setSubmitted(false); }} keyboardType="decimal-pad" placeholder="Enter amount" />
          {method !== 'cash' ? <>
            <TextField label="Account holder name" value={accountName} onChangeText={(value) => { setAccountName(value); setSubmitted(false); }} placeholder="Name on payout account" autoCapitalize="words" />
            <TextField label={method === 'gcash' ? 'GCash mobile number' : 'Account number or wallet ID'} value={accountDetails} onChangeText={(value) => { setAccountDetails(value); setSubmitted(false); }} placeholder={method === 'gcash' ? '09XX XXX XXXX' : 'Enter account details'} keyboardType={method === 'gcash' ? 'phone-pad' : 'default'} />
          </> : <Text variant="caption" tone="muted">A demo QR code will be created for your cash pickup request.</Text>}
          <Text variant="caption" tone="muted">This demo does not move money or connect to payout providers.</Text>
        </Card>

        {submitted && method === 'cash' && cashReference ? <View className="items-center gap-3 rounded-xl p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}>
          <Text variant="label">Cash pickup QR code</Text>
          <Svg width={216} height={216} viewBox="-2 -2 25 25" accessibilityLabel="Demo cash pickup QR code">
            <Rect x="-2" y="-2" width="25" height="25" fill="white" />
            {makeQrMatrix(cashReference).map((row, y) => row.map((dark, x) => dark ? <Path key={`${x}-${y}`} d={`M${x} ${y}h1v1h-1z`} fill="#092f2d" /> : null))}
          </Svg>
          <Text variant="caption" tone="secondary">Demo pickup reference: {cashReference}</Text>
          <Text variant="caption" tone="muted">This QR is for a demo request only. It cannot be redeemed for cash.</Text>
        </View> : null}

        {submitted ? (
          <View className="rounded-xl p-4" style={{ backgroundColor: colors.accentFaint }}>
            <Text variant="label" style={{ color: colors.brand }}>Demo request saved</Text>
            <Text variant="caption" tone="secondary" className="pt-1">No money was moved. Connect a verified payout service to enable real withdrawals.</Text>
          </View>
        ) : null}

        <Button
          label="Request withdrawal"
          disabled={!validAmount || (method !== 'cash' && (!accountName.trim() || !accountDetails.trim()))}
          onPress={() => { if (method === 'cash') setCashReference(`JPH-CASH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`); setSubmitted(true); }}
        />
      </ScrollView>
    </Screen>
  );
}
