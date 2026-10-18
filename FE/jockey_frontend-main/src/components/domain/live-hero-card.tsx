import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';

import { GradientOverlay, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Race } from '@/types';

const HERO_IMAGE = require('../../../assets/images/web/home-race-feature.jpg');

export interface LiveHeroCardProps {
  race: Race;
  series: string;
  onWatch?: () => void;
}

/** Image hero for the currently running race, shown atop Home. */
export function LiveHeroCard({ race, series, onWatch }: LiveHeroCardProps) {
  const { colors, gradients } = useTheme();
  const featured = race.isLive === false;

  return (
    <View className="overflow-hidden rounded-[19px]" style={{ height: 288 }}>
      <Image
        source={HERO_IMAGE}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        accessibilityLabel="Thoroughbred race in progress"
      />
      <GradientOverlay colors={gradients.mediaEmerald} locations={[0, 1]} />

      <View className="flex-1 justify-between p-3.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <View
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: colors.live,
                shadowColor: colors.live,
                shadowOpacity: 0.4,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 0 },
                elevation: 2,
              }}
            />
            <Text
              variant="micro"
              className="font-sans-bold tracking-wider"
              style={{ color: colors.textInverse }}
            >
              {featured ? 'FEATURED RACE' : 'LIVE NOW'}
            </Text>
          </View>
          <Text variant="micro" className="font-sans-bold" style={{ color: colors.accentSoft }} numberOfLines={1}>
            {series}
          </Text>
        </View>

        <View>
          <Text variant="micro" className="font-sans-bold tracking-wide" style={{ color: colors.accentSoft }}>
            RACE {race.number}
          </Text>
          <Text variant="display" className="pt-1 text-3xl" style={{ color: colors.textInverse }}>
            {race.name}
          </Text>
          <Text variant="bodySm" className="pt-1.5" style={{ color: '#d6e2de' }}>
            {race.venue} · {race.distanceM.toLocaleString()} m · {race.entries} entries
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onWatch}
            className="mt-3.5 min-h-[42px] flex-row items-center justify-center gap-2 self-start rounded-xl px-5"
            style={{ backgroundColor: '#C6A15B' }}
          >
            <Text className="font-sans-bold" style={{ color: colors.brand, fontSize: 12 }}>
              Watch live
            </Text>
            <ArrowRight size={15} color={colors.brand} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

