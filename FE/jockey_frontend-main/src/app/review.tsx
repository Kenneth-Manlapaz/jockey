import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';

import { BetProgress } from '@/components/domain/bet-progress';
import { ReviewTicketCard } from '@/components/domain/review-ticket-card';
import { Button, Card, Screen, Text } from '@/components/ui';
import { PartialBetPlacementError, useBetsStore } from '@/lib/bets/store';
import { getApiErrorMessage } from '@/lib/api/errors';
import { formatPeso } from '@/lib/format';
import { useTheme } from '@/theme';

const QUICK_AMOUNTS = [20, 50, 100, 200];

export default function ReviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useBetsStore((state) => state.cart);
  const placeCart = useBetsStore((state) => state.placeCart);
  const stakePerTicket = useBetsStore((state) => state.stakePerTicket);
  const setCartStake = useBetsStore((state) => state.setCartStake);
  const placing = useBetsStore((state) => state.placing);
  const [error, setError] = useState<string | null>(null);

  const totalWagers = cart.reduce((sum, item) => sum + (item.stake ?? stakePerTicket), 0);
  const canConfirm = cart.length > 0 && cart.every((item) => {
    const amount = item.stake ?? stakePerTicket;
    return Number.isFinite(amount) && amount >= 20 && amount <= 10000;
  });

  const onConfirm = async () => {
    setError(null);
    try {
      const tickets = await placeCart();
      router.replace({
        pathname: '/bet-complete',
        params: { count: String(tickets.length), total: String(totalWagers) },
      });
    } catch (cause) {
      setError(cause instanceof PartialBetPlacementError ? cause.message : getApiErrorMessage(cause, 'Could not place your bets. Please try again.'));
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        <BetProgress step={4} />
        <View className="mx-[-14px] mb-3 px-5 py-2.5" style={{ backgroundColor: colors.accent }}>
          <Text style={{ color: colors.brand, fontSize: 7, fontWeight: '700', letterSpacing: 1 }}>REVIEW BEFORE CONFIRMING</Text>
          <Text style={{ color: colors.brand, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 24, marginTop: 2 }}>Review</Text>
          <Text style={{ color: '#38524a', fontSize: 9 }}>{cart.length} {cart.length === 1 ? 'ticket' : 'tickets'} · {formatPeso(totalWagers)} total wager</Text>
        </View>

      {cart.length === 0 ? (
        <View className="items-center justify-center px-8 py-10">
          <Text variant="labelSm" className="text-center">Nothing to review</Text>
          <Text variant="caption" tone="secondary" className="pt-1 text-center">Your bet cart is empty.</Text>
          <Button label="Choose a game" className="mt-4" onPress={() => router.push('/games')} />
        </View>
      ) : (
        <View className="gap-3">
            {cart.map((item, index) => {
              const amount = item.stake ?? stakePerTicket;
              return (
                <View key={item.id}>
                  <ReviewTicketCard item={item} index={index + 1} total={cart.length} />
                  <Text variant="title" className="pt-3">Wager per ticket</Text>
                  <Card className="mt-2 h-14 flex-row items-center gap-2 px-3.5">
                    <Text variant="display" className="text-2xl" style={{ color: colors.brand }}>₱</Text>
                    <TextInput
                      value={String(amount)}
                      onChangeText={(value) => setCartStake(item.id, Number(value.replace(/[^0-9]/g, '')) || 0)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textInactive}
                      accessibilityLabel={`Wager amount for bet ${index + 1}`}
                      className="flex-1 font-display text-2xl"
                      style={{ color: colors.textPrimary }}
                    />
                    <Text variant="micro" tone="secondary">PHP</Text>
                  </Card>
                  <View className="flex-row gap-2 pt-2">
                    {QUICK_AMOUNTS.map((preset) => {
                      const active = amount === preset;
                      return (
                        <Pressable
                          key={preset}
                          accessibilityRole="button"
                          onPress={() => setCartStake(item.id, preset)}
                          className="flex-1 items-center rounded-lg border py-2 active:opacity-80"
                          style={{ backgroundColor: active ? colors.brand : colors.surface, borderColor: active ? colors.brand : colors.borderStrong }}
                        >
                          <Text variant="caption" style={{ color: active ? colors.textInverse : colors.textPrimary }}>{formatPeso(preset).replace('.00', '')}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            <Card className="flex-row items-center justify-between px-3 py-2.5" style={{ backgroundColor: '#e7f3ee', borderColor: '#e7f3ee' }}>
              <Text style={{ color: '#0f513f', fontSize: 9 }}>Total wager · {cart.length} {cart.length === 1 ? 'ticket' : 'tickets'}</Text>
              <Text style={{ color: '#0f513f', fontSize: 13, fontWeight: '700' }}>{formatPeso(totalWagers)}</Text>
            </Card>
        </View>
      )}
      </ScrollView>
      {cart.length > 0 ? (
        <View className="gap-1.5 px-3 pb-2 pt-1" style={{ backgroundColor: colors.background }}>
          {error ? <Text variant="caption" style={{ color: colors.danger }}>{error}</Text> : null}
          <Button label="Confirm" trailingIcon={<Check size={15} color={colors.textInverse} />} disabled={!canConfirm || placing} loading={placing} size="sm" onPress={() => void onConfirm()} />
          <Button label="Back to cart" leadingIcon={<ArrowLeft size={15} color={colors.brand} />} variant="secondary" size="sm" onPress={() => router.back()} />
        </View>
      ) : null}
    </Screen>
  );
}
