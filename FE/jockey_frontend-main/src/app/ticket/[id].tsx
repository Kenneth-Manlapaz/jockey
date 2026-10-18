import { type ReactNode } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { SilkBadge } from '@/components/domain/silk-badge';
import { AppBar, Card, Screen, Text } from '@/components/ui';
import { useBetsStore } from '@/lib/bets/store';
import { formatDateTime, formatPeso } from '@/lib/format';
import { ticketTones, useTheme } from '@/theme';

function Row({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-center justify-between border-b py-3"
      style={{ borderColor: colors.border }}
    >
      <Text variant="micro" tone="secondary" className="tracking-wide">
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function TicketDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticket = useBetsStore((state) => state.tickets.find((t) => t.id === id));

  if (!ticket) {
    return (
      <Screen>
        <AppBar title="Ticket" fallbackHref="/betting-history" />
        <View className="flex-1 items-center justify-center px-8">
          <Text variant="labelSm" className="text-center">
            Ticket not found
          </Text>
        </View>
      </Screen>
    );
  }

  const tone = ticketTones[ticket.status];
  const potential = ticket.stake * ticket.odds;

  return (
    <Screen>
      <AppBar title="Ticket" fallbackHref="/betting-history" />
      <View className="gap-4 p-5">
        <View className="flex-row items-center justify-between">
          <Text variant="micro" tone="secondary">
            {ticket.ticketNumber}
          </Text>
          <View
            className="flex-row items-center gap-1.5 rounded-[20px] px-2 py-1"
            style={{ backgroundColor: tone.background }}
          >
            <View className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: tone.dot }} />
            <Text
              variant="micro"
              className="font-sans-bold uppercase tracking-wide"
              style={{ color: tone.text }}
            >
              {ticket.status}
            </Text>
          </View>
        </View>

        <Card className="p-4">
          <Row label="DATE & TIME">
            <Text variant="labelSm">{formatDateTime(ticket.placedAt)}</Text>
          </Row>
          <Row label="WAGER">
            <Text variant="labelSm">{formatPeso(ticket.stake)}</Text>
          </Row>
          <Row label="RACE">
            <Text variant="labelSm">
              R{ticket.raceNumber} · {ticket.raceName}
            </Text>
          </Row>
          <Row label="GAME">
            <Text variant="labelSm">{ticket.market.replace(/_/g, ' ')}</Text>
          </Row>
          <View className="flex-row items-center justify-between py-3">
            <Text variant="micro" tone="secondary" className="tracking-wide">
              SELECTION
            </Text>
            <View className="flex-row items-center gap-2">
              {ticket.runnerNumber ? <SilkBadge number={ticket.runnerNumber} size="sm" /> : null}
              <Text variant="labelSm">{ticket.selection}</Text>
            </View>
          </View>
        </Card>

        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <Text variant="micro" tone="secondary">
              Odds
            </Text>
            <Text variant="labelSm">{ticket.odds.toFixed(2)}</Text>
          </View>
          <View className="flex-row items-center justify-between pt-2">
            <Text variant="micro" tone="secondary">
              Potential return
            </Text>
            <Text variant="title" style={{ color: colors.brand }}>
              {formatPeso(potential)}
            </Text>
          </View>
          <Text variant="micro" tone="muted" className="pt-2">
            Illustrative estimate only — not guaranteed. All tickets are simulated.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
