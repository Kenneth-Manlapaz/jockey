import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, CalendarDays, ChevronLeft, Clock3, Flag, MapPin, Share2, Trophy } from 'lucide-react-native';
import { Image } from 'expo-image';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRace } from '@/lib/api';
import { useTheme } from '@/theme';

export default function RaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(id);

  if (isLoading) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  if (!race) return <Screen><AppBar title="Race" fallbackHref="/races" /><View className="flex-1 items-center justify-center"><Text variant="labelSm">Race unavailable</Text></View></Screen>;

  const venue = race.clubName || race.venue;
  const tabs = [
    { label: 'Overview', href: `/race/${race.id}` },
    { label: 'Entries', href: `/race/${race.id}/entries` },
    { label: 'Course', href: `/race/${race.id}/entries` },
    { label: 'Games', href: '/games' },
    { label: 'Totalizer', href: '/totalizer/race-3' },
    { label: 'Live', href: '/live' },
  ];

  return (
    <Screen edgeToEdgeTop>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="h-[300px] justify-between overflow-hidden bg-teal-950">
          <Image
            source={race.heroImageUrl ? { uri: race.heroImageUrl } : require('../../../assets/images/web/home-race-feature.jpg')}
            contentFit="cover"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            accessibilityLabel={`${venue} racecourse`}
          />
          <View className="absolute inset-0 bg-teal-950/60" />
          <View className="flex-row items-center justify-between px-4 pt-3">
            <Pressable accessibilityRole="button" accessibilityLabel="Back to races" onPress={() => router.replace('/races')} className="h-9 w-9 items-center justify-center rounded-full bg-white/85">
              <ChevronLeft size={19} color={colors.brand} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Save or share this race" onPress={() => router.push('/favorites')} className="h-9 w-9 items-center justify-center rounded-full bg-white/85">
              <Share2 size={17} color={colors.brand} />
            </Pressable>
          </View>
          <View className="px-5 pb-5">
            <Text variant="eyebrow" style={{ color: colors.accent }}>{`RACE ${race.number} · ${race.status.toUpperCase()}`}</Text>
            <Text variant="displayLg" className="pt-1" style={{ color: colors.textInverse }}>{race.name}</Text>
            <Text variant="caption" className="pt-1" style={{ color: colors.textInverse }}>{venue}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 10, paddingVertical: 9 }}>
          {tabs.map((tab, index) => (
            <Pressable key={tab.label} accessibilityRole="button" onPress={() => router.push(tab.href as never)} className="rounded-full border px-3 py-2" style={{ backgroundColor: index === 0 ? colors.brand : colors.surface, borderColor: index === 0 ? colors.brand : colors.border }}>
              <Text variant="micro" className="font-sans-bold" style={{ color: index === 0 ? colors.textInverse : colors.textSecondary }}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="gap-3 px-4 pt-2">
          <View className="flex-row flex-wrap overflow-hidden rounded-2xl bg-white">
            <RaceFact icon={<CalendarDays size={15} color={colors.accentIcon} />} label="STATUS" value={race.status[0].toUpperCase() + race.status.slice(1)} />
            <RaceFact icon={<Clock3 size={15} color={colors.accentIcon} />} label="POST TIME" value={race.postTime} />
            <RaceFact icon={<Flag size={15} color={colors.accentIcon} />} label="DISTANCE" value={`${race.distanceM.toLocaleString()} m`} />
            <RaceFact icon={<Trophy size={15} color={colors.accentIcon} />} label="ENTRIES" value={`${race.entries} horses`} />
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push(`/club/${venue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`)} className="flex-row items-center gap-3 border-b px-2 py-3" style={{ borderColor: colors.border }}>
            <MapPin size={17} color={colors.brand} />
            <View className="flex-1 gap-1"><Text variant="micro" tone="muted" className="tracking-wide">RACING CLUB / VENUE</Text><Text variant="bodySm" className="font-sans-bold">{venue}</Text></View>
            <ArrowRight size={15} color={colors.brand} />
          </Pressable>

          <Card className="flex-row items-center justify-between p-3">
            <Fact label="SURFACE" value={race.surface || 'Turf'} />
            <Fact label="CONDITION" value={race.trackCondition || 'Good'} />
            <Pressable accessibilityRole="button" onPress={() => router.push(`/race/${race.id}/entries`)} className="flex-row items-center gap-1"><Text variant="micro" className="font-sans-bold" style={{ color: colors.brand }}>Course info</Text><ArrowRight size={13} color={colors.brand} /></Pressable>
          </Card>

          <View className="py-2">
            <Text variant="title">About this race</Text>
            <Text variant="caption" tone="secondary" className="pt-1.5">{race.description || `A ${race.distanceM.toLocaleString()} metre ${race.surface || 'turf'} race at ${race.venue}, featuring ${race.entries} participating horses.`}</Text>
          </View>

          <View className="flex-row items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: colors.accentFaint }}>
            <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.accent }}><Trophy size={18} color={colors.textInverse} /></View>
            <View><Text variant="micro" tone="secondary">PURSE</Text><Text variant="labelSm">{race.purseAmount ? `₱${race.purseAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'Race purse details'}</Text></View>
          </View>

          <Button label="Place a bet" trailingIcon={<ArrowRight size={16} color={colors.textInverse} />} onPress={() => router.push({ pathname: '/games', params: { race: race.id } })} />
          <Button label={`View ${race.entries} entries`} variant="secondary" onPress={() => router.push(`/race/${race.id}/entries`)} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function RaceFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <View className="min-h-[62px] w-1/2 flex-row items-center gap-2 border-b border-r border-stone-100 px-3 py-2">
    {icon}<View className="gap-1"><Text variant="micro" tone="muted" className="tracking-wider">{label}</Text><Text variant="micro" className="font-sans-bold">{value}</Text></View>
  </View>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <View className="gap-1"><Text variant="micro" tone="muted" className="tracking-wider">{label}</Text><Text variant="micro" className="font-sans-bold">{value}</Text></View>;
}
