import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Radio, Rows3, TrendingUp } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppBar, Card, Screen, Text } from '@/components/ui';
import { markets, useHome } from '@/lib/api';
import { useTheme } from '@/theme';

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, palette } = useTheme();
  const { data } = useHome();

  const race = data?.liveRace;

  return (
    <Screen edgeToEdgeTop>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-teal-950 pb-14" style={{ paddingTop: insets.top }}>
          <AppBar title="Live Race Center" left="brand" variant="dark" bordered={false} />
          <View className="px-5 pt-3">
            <View className="flex-row items-center gap-1.5">
              <View
                className="h-[6px] w-[6px] rounded-full"
                style={{ backgroundColor: colors.live }}
              />
              <Text
                variant="micro"
                className="font-sans-bold tracking-wider"
                style={{ color: colors.textInverse }}
              >
                DEMO LIVE
              </Text>
            </View>
            <Text
              variant="micro"
              className="pt-4 tracking-wide"
              style={{ color: colors.accentSoft }}
            >
              RACE {race?.number ?? 2} · PHILIPPINE RACING CLUB
            </Text>
            <Text variant="displayLg" className="pt-1.5" style={{ color: colors.textInverse }}>
              {race?.name ?? 'Turf Challenge'}
            </Text>
            <View className="flex-row items-center gap-1 pt-1.5">
              <Text variant="micro" style={{ color: colors.textMuted }}>
                {race?.venue ?? 'Racing Venue'} · Scheduled {race?.postTime ?? '2:30 PM'}
              </Text>
            </View>
          </View>
        </View>

        <View className="-mt-10 px-5">
          <Pressable accessibilityRole="button" accessibilityLabel="Watch the sample race stream" onPress={() => router.push('/live/stream')}>
            <Card className="overflow-hidden" bordered={false}>
              <View className="h-52 items-center justify-center" style={{ backgroundColor: palette.neutral600 }}>
                <Image source={require('../../../assets/images/web/home-race-feature.jpg')} contentFit="cover" style={{ position: 'absolute', inset: 0, opacity: 0.7 }} accessibilityLabel="Race preview" />
                <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: colors.accent }}>
                  <Play size={24} color={colors.brand} fill={colors.brand} />
                </View>
                <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-3">
                  <Text variant="bodySm" className="font-sans-bold" style={{ color: colors.textInverse }}>Today’s Racing</Text>
                  <Text variant="micro" style={{ color: colors.textInverse }}>Open the race stream and updates</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        </View>

        <View className="flex-row gap-2 px-5 pt-4">
          <QuickTile
            icon={<Radio size={18} color={colors.brand} />}
            title="Live Updates"
            subtitle="Official feed status"
            onPress={() => router.push('/live/updates')}
          />
          <QuickTile
            icon={<Rows3 size={18} color={colors.brand} />}
            title="Entries"
            subtitle={`${race?.entries ?? 10} runners`}
            onPress={() => race?.id && router.push(`/race/${race.id}/entries`)}
          />
          <QuickTile
            icon={<TrendingUp size={18} color={colors.brand} />}
            title="Totalizer"
            subtitle="Pool totals"
            onPress={() => router.push('/totalizer/race-3')}
          />
        </View>

        <View className="px-5 pt-6">
          <View className="flex-row items-center justify-between">
            <Text variant="heading">Available games</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/games')}>
              <Text variant="caption" className="font-sans-bold" style={{ color: colors.brand }}>View all</Text>
            </Pressable>
          </View>
          <View className="gap-2 pt-3">
            {markets.map((market, index) => (
              <Pressable key={market} accessibilityRole="button" onPress={() => router.push(`/selection/${race?.id ?? ''}?market=${encodeURIComponent(market)}`)}>
                <Card className="flex-row items-center gap-3 p-3">
                  <View className="h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: colors.brand }}>
                    <Text variant="micro" style={{ color: colors.accentSoft }}>{index + 1}</Text>
                  </View>
                  <Text variant="bodySm" className="flex-1 font-sans-bold">{market.replace('_', ' ')}</Text>
                  <Text variant="caption" tone="muted">›</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function QuickTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable className="flex-1" accessibilityRole="button" onPress={onPress}>
    <Card className="items-center px-2 py-3">
      {icon}
      <Text variant="micro" className="pt-1.5 font-sans-bold">
        {title}
      </Text>
      <Text variant="micro" tone="secondary">
        {subtitle}
      </Text>
    </Card>
    </Pressable>
  );
}
