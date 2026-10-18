import { View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { Image } from 'expo-image';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { PodiumEntry } from '@/types';

const exampleHorseImage = require('../../../assets/images/web/chestnut-thoroughbred.jpg');

export interface PodiumProps {
  entries: PodiumEntry[];
}

const PEDESTAL_HEIGHT: Record<number, number> = { 1: 56, 2: 42, 3: 30 };

/** Top-three race podium shown on the Official Results screen. */
export function Podium({ entries }: PodiumProps) {
  const { colors } = useTheme();
  const byPlace = new Map(entries.map((entry) => [entry.place, entry]));
  const order = [byPlace.get(2), byPlace.get(1), byPlace.get(3)].filter(Boolean) as PodiumEntry[];

  return (
    <View className="flex-row items-end justify-center">
      {order.map((entry) => {
        const champion = entry.place === 1;
        const badgeSize = champion ? 72 : 60;

        return (
          <View key={entry.place} className="w-24 items-center">
            {champion ? (
              <View className="pb-1">
                <Crown size={16} color={colors.accentIcon} />
              </View>
            ) : null}
            <View
              className="items-center justify-center overflow-hidden rounded-full"
              style={{
                width: badgeSize,
                height: badgeSize,
                borderWidth: champion ? 3 : 2,
                borderColor: champion ? colors.accent : colors.border,
                backgroundColor: colors.brand,
              }}
            >
              <Image
                source={entry.image && !entry.image.includes('placehold.co') ? { uri: entry.image } : exampleHorseImage}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
                accessibilityLabel="Example racehorse photo"
              />
              <View className="absolute bottom-0 h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: entry.silkColor ?? colors.brand, borderWidth: 1, borderColor: colors.surface }}>
                <Text variant="caption" className="font-sans-bold" style={{ color: colors.textInverse, fontSize: 10 }}>{entry.number}</Text>
              </View>
            </View>
            <Text variant="bodySm" className="pt-2 text-center font-sans-bold" style={{ fontSize: 12, lineHeight: 15 }} numberOfLines={2}>
              {entry.horse}
            </Text>
            <Text variant="caption" tone="secondary" style={{ fontSize: 10 }}>
              {entry.jockey}
            </Text>
            <View className="w-full items-center pt-1.5">
              <View
                className="w-24 items-center justify-start rounded-t-md"
                style={{
                  height: PEDESTAL_HEIGHT[entry.place] ?? 24,
                  backgroundColor: entry.silkColor ?? colors.border,
                }}
              >
                <View
                  className="mt-0 h-5 w-5 items-center justify-center rounded-xl"
                  style={{ backgroundColor: champion ? colors.accent : colors.brand }}
                >
                  <Text
                    variant="caption"
                    className="font-sans-bold"
                    style={{ color: champion ? colors.brand : colors.textInverse }}
                  >
                    {entry.place}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
