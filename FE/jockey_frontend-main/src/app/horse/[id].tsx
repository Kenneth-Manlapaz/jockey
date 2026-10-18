import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Heart } from 'lucide-react-native';
import { Image } from 'expo-image';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRace } from '@/lib/api';
import { useTheme } from '@/theme';

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function HorseProfileScreen() {
  const { id, race: raceId } = useLocalSearchParams<{ id: string; race?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(raceId ?? '');
  const horse = race?.runners?.find((runner) => runner.horseId === id || runner.id === id);

  if (isLoading) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  if (!race || !horse) return <Screen><AppBar title="Horse profile" fallbackHref="/races" /><View className="flex-1 items-center justify-center p-6"><Text variant="labelSm">Horse details unavailable</Text><Text variant="caption" tone="secondary" className="pt-2 text-center">Open a horse from a race entry list to view its profile.</Text></View></Screen>;

  const recentForm = horse.form?.split(/[-\s,]+/).filter(Boolean).slice(0, 5) ?? [];

  return (
    <Screen>
      <AppBar title="Horse profile" fallbackHref={`/race/${race.id}/entries`} right={<Heart size={18} color={colors.textPrimary} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View className="h-[280px] justify-end overflow-hidden bg-teal-950">
          <Image
            source={horse.photoUrl ? { uri: horse.photoUrl } : require('../../../assets/images/web/racehorse-action.jpg')}
            contentFit="cover"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            accessibilityLabel={`${horse.horse} portrait`}
          />
          <View className="absolute inset-0 bg-teal-950/55" />
          <View className="px-5 pb-5">
            <View className="mb-3 h-9 w-9 items-center justify-center rounded-lg bg-[#C6A15B]">
              <Text style={{ color: colors.brand, fontSize: 15, fontWeight: '700' }}>{horse.number}</Text>
            </View>
            <Text variant="eyebrow" style={{ color: colors.accent }}>{horse.horseId ? `HORSE ID · ${horse.horseId}` : `RACE ${race.number} · ENTRY ${horse.number}`}</Text>
            <Text variant="displayLg" className="pt-1" style={{ color: colors.textInverse }}>{horse.horse}</Text>
            <Text variant="micro" className="pt-1" style={{ color: colors.textMuted }}>{race.name} · {race.clubName ?? race.venue}</Text>
          </View>
        </View>

        <View className="px-4">
          <View className="flex-row gap-2 py-4">
            <Card className="flex-1 items-center p-3"><Text variant="micro" tone="secondary">GATE</Text><Text variant="title" className="pt-1">{horse.number}</Text></Card>
            <Card className="flex-1 items-center p-3"><Text variant="micro" tone="secondary">WEIGHT</Text><Text variant="title" className="pt-1">{horse.weightKg != null ? `${horse.weightKg} kg` : 'Unavailable'}</Text></Card>
            <Card className="flex-1 items-center p-3"><Text variant="micro" tone="secondary">ODDS</Text><Text variant="title" className="pt-1">{horse.odds ? horse.odds.toFixed(2) : 'Unavailable'}</Text></Card>
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/jockey/[id]', params: { id: slugify(horse.jockey), race: race.id, horse: horse.horseId ?? horse.id } })} className="mb-2 flex-row items-center justify-between rounded-2xl bg-white p-4">
            <View><Text variant="micro" tone="secondary">JOCKEY</Text><Text variant="labelSm" className="pt-1">{horse.jockey}</Text></View><ArrowRight size={16} color={colors.textSecondary} />
          </Pressable>
          <Card className="mb-2 p-4"><Text variant="micro" tone="secondary">TRAINER</Text><Text variant="labelSm" className="pt-1">{horse.trainer || 'Details unavailable'}</Text></Card>
          <Card className="p-4"><Text variant="micro" tone="secondary">OWNER</Text><Text variant="labelSm" className="pt-1">{horse.owner || 'Details unavailable'}</Text></Card>

          <Text variant="title" className="pt-6">Recent form</Text>
          {recentForm.length ? (
            <Card className="mt-3 flex-row items-center justify-around p-4">
              {recentForm.map((place, index) => (
                <View key={`${place}-${index}`} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: index === 0 ? colors.accentFaint : colors.surfaceMuted }}>
                  <Text variant="labelSm">{place}</Text>
                </View>
              ))}
            </Card>
          ) : <Card className="mt-3 p-4"><Text variant="caption" tone="secondary">Recent race results are not available.</Text></Card>}

          <Text variant="title" className="pt-6">Current race</Text>
          <Card className="mt-3 p-4"><Text variant="micro" tone="accent">{`RACE ${race.number} · ${race.status.toUpperCase()}`}</Text><Text variant="labelSm" className="pt-1">{race.name}</Text><Text variant="caption" tone="secondary" className="pt-1">{race.venue} · {race.distanceM.toLocaleString()} m</Text></Card>
          <Button label="View detailed statistics" className="mt-4" onPress={() => router.push({ pathname: '/horse/[id]/statistics', params: { id, race: race.id } })} />
          <Button label="Back to race entries" variant="secondary" className="mt-2" onPress={() => router.push(`/race/${race.id}/entries`)} />
        </View>
      </ScrollView>
    </Screen>
  );
}
