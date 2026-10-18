import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { CartItem } from '@/types';

export interface ReviewTicketCardProps {
  item: CartItem;
  index: number;
  total: number;
}

/** Read-only ticket preview on the Review (wager) screen. */
export function ReviewTicketCard({ item, index, total }: ReviewTicketCardProps) {
  const { colors } = useTheme();

  return (
    <Card className="p-3.5" style={{ borderTopWidth: 2, borderTopColor: colors.brand }}>
      <Text variant="micro" tone="accent" className="font-sans-bold tracking-wider">
        BET {index} OF {total}
      </Text>

      <View className="flex-row items-start justify-between pt-2">
        <View className="flex-1">
          <Text variant="micro" tone="secondary">
            RACE {item.raceNumber}
            {item.raceDateLabel ? ` · ${item.raceDateLabel}` : ''}
          </Text>
          <Text variant="title" className="pt-1">
            {item.raceName}
          </Text>
        </View>
        {item.postTime ? (
          <View
            className="flex-row items-center gap-1.5 rounded-[20px] px-2 py-1"
            style={{ backgroundColor: colors.surfaceMuted }}
          >
            <View
              className="h-[5px] w-[5px] rounded-full"
              style={{ backgroundColor: colors.brand }}
            />
            <Text
              variant="micro"
              className="font-sans-bold uppercase tracking-wide"
              style={{ color: colors.brand }}
            >
              {item.postTime}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        className="flex-row items-center justify-between border-y py-2"
        style={{ borderColor: colors.border }}
      >
        <Text variant="micro" tone="secondary">
          GAME
        </Text>
        <Text variant="labelSm">{item.market.replace(/_/g, ' ')}</Text>
      </View>

      <View className="gap-2 pt-2.5">
        {item.runners.map((runner) => (
          <View key={`${item.id}-${runner.runnerNumber}`} className="flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.brand }}><Text style={{ color: colors.textInverse, fontSize: 11, fontWeight: '700' }}>{runner.runnerNumber}</Text></View>
            <View className="flex-1">
              <Text variant="labelSm">{runner.horse}</Text>
              <Text variant="micro" tone="secondary">
                {runner.jockey}
              </Text>
            </View>
            <Text variant="micro" tone="secondary">{runner.odds.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
