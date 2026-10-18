import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { HistoryTicketCard } from '@/components/domain/history-ticket-card';
import { AppBar, Button, Card, Chip, Screen, Text } from '@/components/ui';
import { useBetsStore } from '@/lib/bets/store';
import { palette, useTheme } from '@/theme';
import type { BetStatus } from '@/types';

const FILTERS = ['All', 'Pending', 'Won', 'Lost', 'Void'] as const;
type Filter = (typeof FILTERS)[number];

export default function BettingHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const tickets = useBetsStore((state) => state.tickets);
  const loadBets = useBetsStore((state) => state.loadBets);
  const loadingBets = useBetsStore((state) => state.loadingBets);
  const betsError = useBetsStore((state) => state.betsError);
  const [filter, setFilter] = useState<Filter>('All');

  useEffect(() => {
    loadBets().catch(() => undefined);
  }, [loadBets]);

  const filtered =
    filter === 'All'
      ? tickets
      : tickets.filter((ticket) => ticket.status === (filter as BetStatus));

  return (
    <Screen>
      <AppBar title="My Bets" fallbackHref="/" />

      <View
        className="flex-row items-center gap-2.5 px-4 py-2.5"
        style={{ backgroundColor: palette.amber100 }}
      >
        <View>
          <Text
            variant="micro"
            className="font-sans-bold tracking-wide"
            style={{ color: colors.brand }}
          >
            MY BETS
          </Text>
          <Text variant="micro" style={{ color: colors.brand }}>
            See your betting history here.
          </Text>
        </View>
      </View>

      <View
        className="flex-row gap-1.5 border-b px-4 py-3"
        style={{ borderBottomColor: colors.border }}
      >
        {FILTERS.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={filter === option}
            onPress={() => setFilter(option)}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {loadingBets ? (
          <Text variant="bodySm" tone="secondary" className="pt-6 text-center">Loading your tickets…</Text>
        ) : betsError ? (
          <Card className="items-center gap-2 p-5">
            <Text variant="labelSm" className="text-center">Sign in to view tickets</Text>
            <Text variant="caption" tone="secondary" className="text-center">{betsError}</Text>
            <Button label="Sign in" size="sm" fullWidth={false} onPress={() => router.push('/login')} />
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="items-center gap-2 p-5">
            <Text variant="labelSm" className="text-center">No tickets yet</Text>
            <Text variant="caption" tone="secondary" className="text-center">Your placed play-money bets will show here.</Text>
            <Button label="Explore races" size="sm" fullWidth={false} onPress={() => router.push('/races')} />
          </Card>
        ) : (
          filtered.map((ticket) => (
            <HistoryTicketCard
              key={ticket.id}
              ticket={ticket}
              onView={() => router.push({ pathname: '/ticket/[id]', params: { id: ticket.id } })}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
