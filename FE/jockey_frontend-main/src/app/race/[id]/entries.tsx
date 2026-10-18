import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight, BookOpen, SlidersHorizontal } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRace } from '@/lib/api';
import { useTheme } from '@/theme';

const RACEHORSE_ACTION = require('../../../../assets/images/web/racehorse-action.jpg');
const HOME_RACE_FEATURE = require('../../../../assets/images/web/home-race-feature.jpg');

export default function RaceEntriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(id);

  if (isLoading) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  if (!race) return <Screen><AppBar title="Race Entries" fallbackHref="/races" /><View className="flex-1 items-center justify-center"><Text variant="labelSm">Race unavailable</Text></View></Screen>;

  const runners = [...(race.runners ?? [])].sort((a, b) => a.number - b.number);

  return (
    <Screen>
      <AppBar
        title="Race Entries"
        fallbackHref={`/race/${race.id}`}
        right={(
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="How to read the race program"
            onPress={() => router.push('/racing-guide')}
            className="h-9 w-9 items-center justify-center rounded-full bg-white"
          >
            <BookOpen size={17} color={colors.brand} />
          </Pressable>
        )}
      />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="rounded-2xl bg-teal-950 px-4 py-3.5">
          <View className="flex-row items-center justify-between">
            <Text variant="eyebrow" style={{ color: colors.accent }}>{`RACE ${race.number} · ${race.postTime}`}</Text>
            <View className="rounded-full bg-white/10 px-2 py-1">
              <Text style={{ color: colors.textInverse, fontSize: 8, fontWeight: '700' }}>{race.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text variant="display" className="pt-1" style={{ color: colors.textInverse }}>{race.name}</Text>
          <Text variant="micro" className="pt-1" style={{ color: colors.textMuted }}>
            {race.clubName || race.venue} · {race.distanceM.toLocaleString()} m · {race.entries} entries
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-3">
          <Text variant="labelSm">Participating horses</Text>
          <View className="flex-row items-center gap-1">
            <Text variant="micro" tone="secondary">Sort: Number</Text>
            <SlidersHorizontal size={12} color={colors.textSecondary} />
            <Text variant="micro" tone="secondary">{runners.length || race.entries}</Text>
          </View>
        </View>

        {runners.length ? runners.map((runner, index) => (
          <Pressable
            key={runner.id}
            accessibilityRole="button"
            accessibilityLabel={`View ${runner.horse}, jockey ${runner.jockey}`}
            onPress={() => router.push({ pathname: '/horse/[id]', params: { id: runner.horseId ?? runner.id, race: race.id } })}
            className="mb-2 min-h-[64px] flex-row items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-2.5 py-2 shadow-sm active:opacity-80"
          >
            <View className="h-8 w-7 items-center justify-center rounded-lg bg-teal-950">
              <Text style={{ color: colors.textInverse, fontSize: 12, fontWeight: '700' }}>{runner.number}</Text>
            </View>
            <Image
              source={runner.photoUrl ? { uri: runner.photoUrl } : index % 2 === 0 ? RACEHORSE_ACTION : HOME_RACE_FEATURE}
              contentFit="cover"
              style={{ width: 42, height: 42, borderRadius: 9, backgroundColor: colors.surfaceMuted }}
              accessibilityLabel={`${runner.horse} race photo`}
            />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>{runner.horse}</Text>
              <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 9 }}>{runner.jockey}</Text>
              <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 8 }}>
                {runner.weightKg != null ? `${runner.weightKg} kg` : 'Weight unavailable'}
                {runner.trainer ? ` · ${runner.trainer}` : ''}
              </Text>
            </View>
            <View className="items-end gap-1">
              <ArrowRight size={14} color={colors.textSecondary} />
              <Text style={{ color: colors.info, fontSize: 7, fontWeight: '600' }}>{runner.status || 'CONFIRMED'}</Text>
            </View>
          </Pressable>
        )) : (
          <Card className="p-4"><Text variant="caption" tone="secondary">Horse entries will appear here when available.</Text></Card>
        )}

        <Button label="Choose a game" className="mt-2" onPress={() => router.push(`/race/${race.id}/bet`)} />
      </ScrollView>
    </Screen>
  );
}
