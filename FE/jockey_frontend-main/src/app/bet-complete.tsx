import { ScrollView, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { TicketCard } from '@/components/domain/ticket-card';
import { Button, Card, Screen, Text } from '@/components/ui';
import { useBetsStore } from '@/lib/bets/store';
import { formatPeso } from '@/lib/format';
import { useTheme } from '@/theme';

export default function BetCompleteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { count: countParam, total: totalParam } = useLocalSearchParams<{
    count?: string;
    total?: string;
  }>();
  const tickets = useBetsStore((state) => state.tickets);

  const count = Number(countParam) || 0;
  const total = Number(totalParam) || 0;
  const created = tickets.slice(0, count || tickets.length);

  return (
    <Screen edgeToEdgeTop>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center px-5 pb-10 pt-4" style={{ backgroundColor: colors.brand }}>
          <View
            className="h-16 w-16 items-center justify-center rounded-3xl"
            style={{ backgroundColor: colors.accent }}
          >
            <Check size={30} color={colors.brand} strokeWidth={3} />
          </View>
          <Text variant="eyebrow" className="pt-4" style={{ color: colors.accent }}>
            COMPLETE
          </Text>
          <Text
            variant="displayLg"
            className="pt-1.5 text-center"
            style={{ color: colors.textInverse }}
          >
            The Bets are{'\n'}Successfully Created
          </Text>
          <Text variant="caption" className="pt-1.5" style={{ color: colors.textMuted }}>
            {created.length} {created.length === 1 ? 'ticket is' : 'tickets are'} ready.
          </Text>
        </View>

        <View className="gap-3 px-5 pt-4">
          <Card
            className="flex-row items-center justify-between p-3.5"
            style={{ backgroundColor: colors.accent }}
          >
            <View>
              <Text variant="micro" className="tracking-wide" style={{ color: colors.brand }}>
                ALL BETS BREAKDOWN
              </Text>
              <Text variant="title" className="pt-1" style={{ color: colors.brand }}>
                {created.length} tickets
              </Text>
            </View>
            <View className="border-l pl-3" style={{ borderLeftColor: 'rgba(4,47,46,0.2)' }}>
              <Text variant="micro" className="tracking-wide" style={{ color: colors.brand }}>
                TOTAL WAGER
              </Text>
              <Text variant="title" className="pt-1" style={{ color: colors.brand }}>
                {formatPeso(total)}
              </Text>
            </View>
          </Card>

          {created.map((ticket, index) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              index={index + 1}
              total={created.length}
              onViewTicket={() =>
                router.push({ pathname: '/ticket/[id]', params: { id: ticket.id } })
              }
            />
          ))}

          <Button label="View betting history" onPress={() => router.replace('/betting-history')} />
          <Button label="Return home" variant="secondary" onPress={() => router.replace('/')} />

          <View className="items-center pt-1">
            <Text
              variant="caption"
              className="font-sans-bold"
              style={{ color: colors.brand }}
              onPress={() => router.push('/totalizer/dividend/pool-place-r3')}
            >
              View estimated pool demonstration
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
