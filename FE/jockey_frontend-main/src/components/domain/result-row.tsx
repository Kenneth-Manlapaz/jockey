import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { ResultSummary } from '@/types';

export interface ResultRowProps {
  result: ResultSummary;
  onPress?: () => void;
}

/** Latest-results summary row: winner, jockey and winning time. */
export function ResultRow({ result, onPress }: ResultRowProps) {
  const { colors } = useTheme();

  return (
    <Card className="flex-row items-center gap-3 p-3" onTouchEnd={onPress}>
      <View
        className="h-8 w-8 items-center justify-center rounded-2xl"
        style={{ backgroundColor: colors.accent }}
      >
        <Text variant="caption" tone="muted">
          {result.raceNumber}
        </Text>
      </View>
      <View className="flex-1">
        <Text variant="micro" tone="secondary" className="tracking-wide">
          RACE {result.raceNumber} · {result.status.toUpperCase()}
        </Text>
        <Text variant="labelSm" className="pt-0.5">
          {result.winner.horse}
        </Text>
        <Text variant="caption" tone="muted">
          Jockey: {result.winner.jockey}
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <Text variant="label" className="font-display">
          {result.time}
        </Text>
        <ChevronRight size={16} color={colors.textSecondary} />
      </View>
    </Card>
  );
}
