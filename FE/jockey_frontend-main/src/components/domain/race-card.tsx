import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card, StatusChip, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Race, RaceStatus, ResultStatus } from '@/types';

const raceTone: Record<RaceStatus, 'ongoing' | 'upcoming' | 'completed' | 'cancelled'> = {
  ongoing: 'ongoing',
  upcoming: 'upcoming',
  completed: 'completed',
  cancelled: 'cancelled',
  postponed: 'completed',
};

const raceLabel: Record<RaceStatus, string> = {
  ongoing: 'Ongoing',
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  postponed: 'Postponed',
};

export interface RaceCardProps {
  race: Race;
  /** compact = home rail; full = schedule list row */
  size?: 'compact' | 'full';
  onPress?: () => void;
  className?: string;
}

export function RaceCard({ race, size = 'full', onPress, className }: RaceCardProps) {
  const { colors } = useTheme();

  if (size === 'compact') {
    return (
      <Card className={className} style={{ width: 168 }} onTouchEnd={onPress}>
        <View className="flex-row items-center justify-between p-3">
          <View
            className="h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: colors.brand }}
          >
            <Text variant="micro" style={{ color: colors.textInverse }} className="font-sans-bold">
              R{race.number}
            </Text>
          </View>
          <StatusChip tone={raceTone[race.status]} label={raceLabel[race.status]} />
        </View>
        <View className="px-3 pb-3">
          <Text variant="labelSm">{race.name}</Text>
          <Text variant="caption" tone="secondary" className="pt-1">
            {race.postTime} · {race.distanceM.toLocaleString()} m
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card className={className} onTouchEnd={onPress}>
      <View className="flex-row gap-3 p-2.5">
        <View
          className="h-11 w-11 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: colors.brand }}
        >
          <Text variant="micro" style={{ color: colors.textInverse }}>
            RACE
          </Text>
          <Text variant="display" className="text-xl" style={{ color: colors.textInverse }}>
            {race.number}
          </Text>
        </View>
        <View className="flex-1">
          <Text variant="labelSm">{race.name}</Text>
          <Text variant="micro" tone="secondary" className="pt-1">
            {race.venue}
          </Text>
          <Text variant="micro" tone="secondary" className="pt-1">
            {race.distanceM.toLocaleString()} m · {race.entries} entries
          </Text>
        </View>
        <View className="items-end justify-between">
          <StatusChip tone={raceTone[race.status]} label={raceLabel[race.status]} />
          <Text variant="caption" className="pt-2 font-sans-bold">
            {race.postTime}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function ResultStatusChip({ status }: { status: ResultStatus }): ReactNode {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <StatusChip tone={status} label={label} />;
}
