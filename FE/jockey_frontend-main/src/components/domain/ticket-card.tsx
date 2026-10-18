import { type ReactNode } from 'react';
import { View } from 'react-native';
import { Ticket } from 'lucide-react-native';

import { SilkBadge } from './silk-badge';
import { Card, Text } from '@/components/ui';
import { formatDateTime, formatPeso } from '@/lib/format';
import { useTheme } from '@/theme';
import type { BetTicket } from '@/types';

export interface TicketCardProps {
  ticket: BetTicket;
  index: number;
  total: number;
  onViewTicket?: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-center justify-between border-b py-2.5"
      style={{ borderColor: colors.border }}
    >
      <Text variant="micro" tone="secondary" className="tracking-wide">
        {label}
      </Text>
      {children}
    </View>
  );
}

/** Full receipt-style ticket used on the Complete screen. */
export function TicketCard({ ticket, index, total, onViewTicket }: TicketCardProps) {
  const { colors } = useTheme();

  return (
    <Card bordered={false} className="overflow-hidden p-4" style={{ shadowColor: '#14241f' }}>
      <View className="flex-row items-center gap-2">
        <Ticket size={18} color={colors.brand} />
        <View>
          <Text
            variant="micro"
            className="font-sans-bold tracking-wide"
            style={{ color: colors.brand }}
          >
            PHILIPPINE JOCKEY
          </Text>
          <Text variant="micro" tone="secondary">
            TICKET {index} OF {total}
          </Text>
        </View>
      </View>

      <View
        className="mt-3 items-center rounded-lg py-2.5"
        style={{ backgroundColor: colors.surfaceMuted }}
      >
        <Text variant="micro" tone="secondary" className="tracking-wide">
          TICKET NUMBER
        </Text>
        <Text variant="labelSm" className="pt-1 tracking-wide">
          {ticket.ticketNumber}
        </Text>
      </View>

      <View className="pt-2">
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
        <View className="flex-row items-center justify-between py-2.5">
          <Text variant="micro" tone="secondary" className="tracking-wide">
            SELECTION
          </Text>
          <View className="flex-row items-center gap-2">
            {ticket.runnerNumber ? <SilkBadge number={ticket.runnerNumber} size="sm" /> : null}
            <Text variant="labelSm">{ticket.selection}</Text>
          </View>
        </View>
      </View>

      <View
        onTouchEnd={onViewTicket}
        className="-mx-4 -mb-4 mt-1 items-center py-2.5"
        style={{ backgroundColor: colors.accent }}
      >
        <Text
          variant="micro"
          className="font-sans-bold tracking-wide"
          style={{ color: colors.brand }}
        >
          TICKET {index}
        </Text>
      </View>
    </Card>
  );
}
