import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, MapPin } from 'lucide-react-native';
import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useHome } from '@/lib/api';
import { useTheme } from '@/theme';

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function displayName(slug: string) {
  return slug.split('-').filter(Boolean).map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');
}

export default function ClubProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading } = useHome();
  if (isLoading || !data) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;

  const races = data.todayRaces.filter((race) => toSlug(race.clubName || race.venue) === slug);
  const featuredRace = races.find((race) => race.status === 'upcoming' || race.status === 'ongoing') ?? races[0];
  const clubName = featuredRace?.clubName || featuredRace?.venue || displayName(slug);

  return (
    <Screen>
      <AppBar title="Racing club" fallbackHref="/races" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
        <View className="rounded-2xl bg-teal-950 p-5">
          <Text variant="eyebrow" style={{ color: colors.accent }}>RACING CLUB</Text>
          <Text variant="displayLg" className="pt-2" style={{ color: colors.textInverse }}>{clubName}</Text>
          <View className="flex-row items-center gap-1.5 pt-2"><MapPin size={13} color={colors.textMuted} /><Text variant="caption" style={{ color: colors.textMuted }}>{featuredRace?.venue || 'Philippines'}</Text></View>
        </View>
        <View className="py-5"><Text variant="eyebrow" tone="accent">ABOUT THE CLUB</Text><Text variant="title" className="pt-1">Race day at {clubName}</Text><Text variant="caption" tone="secondary" className="pt-2">Explore the scheduled races and participating horses for this club.</Text></View>
        <View className="flex-row gap-2"><Card className="flex-1 p-3"><Text variant="micro" tone="secondary">MEETING</Text><Text variant="labelSm" className="pt-1">{data.dateLabel}</Text></Card><Card className="flex-1 p-3"><Text variant="micro" tone="secondary">RACES TODAY</Text><Text variant="labelSm" className="pt-1">{races.length}</Text></Card></View>
        <View className="flex-row items-center justify-between pt-6 pb-3"><Text variant="title">Club race card</Text><Text variant="caption" tone="secondary">{races.length} races</Text></View>
        {races.length ? races.map((race) => (
          <Card key={race.id} className="mb-2 flex-row items-center gap-3 p-3" onTouchEnd={() => router.push(`/race/${race.id}`)}>
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-teal-950"><Text variant="labelSm" style={{ color: colors.textInverse }}>{race.number}</Text></View>
            <View className="flex-1"><Text variant="bodySm" className="font-sans-bold">{race.name}</Text><Text variant="micro" tone="secondary" className="pt-0.5">{race.postTime} · {race.distanceM.toLocaleString()} m · {race.entries} entries</Text></View>
            <ArrowRight size={16} color={colors.textSecondary} />
          </Card>
        )) : <Card className="p-4"><Text variant="caption" tone="secondary">There are no races scheduled for this club yet.</Text></Card>}
        {featuredRace ? <Button label="Open featured race" className="mt-4" onPress={() => router.push(`/race/${featuredRace.id}`)} /> : null}
        <Button label="All clubs and races" variant="secondary" className="mt-2" onPress={() => router.push('/races')} />
      </ScrollView>
    </Screen>
  );
}
