import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Card, Text } from '@/components/ui';
import { formatPeso } from '@/lib/format';
import { ticketTones, useTheme } from '@/theme';
import type { BetTicket } from '@/types';

export interface HistoryTicketCardProps {
  ticket: BetTicket;
  onView?: () => void;
}

/** Ticket summary row used on the Betting History screen. */
export function HistoryTicketCard({ ticket, onView }: HistoryTicketCardProps) {
  const { colors } = useTheme();
  const tone = ticketTones[ticket.status];

  return (
    <Card className="p-3.5">
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

      <Text variant="title" className="pt-2.5">
        {ticket.raceName}
      </Text>
      <Text variant="micro" tone="secondary" className="pt-0.5">
        {ticket.market.replace(/_/g, ' ')} · Race {ticket.raceNumber}
      </Text>

      <View
        className="mt-2 flex-row items-center justify-between border-t pt-2"
        style={{ borderColor: colors.border }}
      >
        <View>
          <Text variant="micro" tone="secondary">
            WAGER
          </Text>
          <Text variant="labelSm">{formatPeso(ticket.stake)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onView}
          className="flex-row items-center active:opacity-70"
        >
          <Text variant="caption" className="font-sans-bold" style={{ color: colors.brand }}>
            View ticket
          </Text>
          <ChevronRight size={14} color={colors.brand} />
        </Pressable>
      </View>
    </Card>
  );
}
