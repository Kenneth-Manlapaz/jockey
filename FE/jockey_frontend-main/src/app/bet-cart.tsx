import { ScrollView, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { BetProgress } from '@/components/domain/bet-progress';
import { CartItemCard } from '@/components/domain/cart-item-card';
import { Button, Card, Screen, Text } from '@/components/ui';
import { useBetsStore } from '@/lib/bets/store';
import { useTheme } from '@/theme';

export default function BetCartScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useBetsStore((state) => state.cart);
  const removeFromCart = useBetsStore((state) => state.removeFromCart);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
        <BetProgress step={3} />
        <View className="mx-[-14px] mb-3 px-5 py-2.5" style={{ backgroundColor: colors.accent }}>
          <Text style={{ color: colors.brand, fontSize: 7, fontWeight: '700', letterSpacing: 1 }}>BET CART · REVIEW BEFORE CONFIRMING</Text>
          <Text style={{ color: colors.brand, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 24, marginTop: 2 }}>Bet Cart</Text>
          <Text style={{ color: '#38524a', fontSize: 9 }}>Check each selection before setting your wager.</Text>
        </View>

        {cart.length === 0 ? (
          <View className="items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-8">
            <Text variant="labelSm">Your cart is empty</Text>
            <Text variant="caption" tone="secondary" className="text-center">Choose a game and runners to start a bet.</Text>
            <Button label="Choose a game" size="sm" className="mt-1" onPress={() => router.navigate('/games')} />
          </View>
        ) : (
          <>
            <View className="gap-2.5">
              {cart.map((item, index) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  index={index + 1}
                  onEdit={() => router.push({ pathname: '/selection/[id]', params: { id: item.raceId, market: item.market, editId: item.id } })}
                  onDelete={() => removeFromCart(item.id)}
                />
              ))}
            </View>
            <Card className="mt-2.5 flex-row items-center justify-between p-3" style={{ backgroundColor: '#e7f3ee', borderColor: '#e7f3ee' }}>
              <Text style={{ color: '#0f513f', fontSize: 9 }}>{cart.length} separate {cart.length === 1 ? 'ticket' : 'tickets'}</Text>
              <Text style={{ color: '#0f513f', fontSize: 9, fontWeight: '700' }}>Set wager on next step</Text>
            </Card>
          </>
        )}
      </ScrollView>

      {cart.length > 0 ? (
        <View className="gap-1.5 px-3 pb-2 pt-1" style={{ backgroundColor: colors.background }}>
          <Button label="Continue to wager" trailingIcon={<ArrowRight size={15} color={colors.textInverse} />} size="sm" onPress={() => router.push('/review')} />
          <Button label="Add another bet" variant="secondary" size="sm" onPress={() => router.navigate('/games')} />
        </View>
      ) : null}
    </Screen>
  );
}
