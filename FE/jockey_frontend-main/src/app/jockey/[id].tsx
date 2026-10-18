import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Award, Flag, MapPin, Trophy } from 'lucide-react-native';
import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRace, useResultDetail } from '@/lib/api';
import { useTheme } from '@/theme';

export default function JockeyProfileScreen() {
  const { id, race: raceId, horse: horseId, result: resultId } = useLocalSearchParams<{ id: string; race?: string; horse?: string; result?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(raceId ?? '');
  const { data: result } = useResultDetail(resultId ?? '');
  const horse = race?.runners?.find((runner) => runner.horseId === horseId || runner.id === horseId);
  const initials = horse?.jockey.split(/\s+/).map((part) => part[0]).slice(0, 2).join('') ?? '';
  const finish = result?.podium.find((entry) => entry.horse.toLowerCase() === horse?.horse.toLowerCase())?.place;
  if (isLoading) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  if (!race || !horse) return <Screen><AppBar title="Jockey profile" fallbackHref="/races" /><View className="flex-1 items-center justify-center p-6"><Text variant="labelSm">Jockey details unavailable</Text><Text variant="caption" tone="secondary" className="pt-2 text-center">Open a jockey profile from a race result.</Text></View></Screen>;

  return (
    <Screen>
      <AppBar title="Jockey profile" fallbackHref={`/race/${race.id}`} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
        <View className="items-center rounded-2xl bg-teal-950 p-6"><View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: colors.accent }}><Text variant="title">{initials}</Text></View><Text variant="eyebrow" className="pt-3" style={{ color: colors.accent }}>WINNING JOCKEY · LICENSED RIDER</Text><Text variant="display" className="pt-1 text-center" style={{ color: colors.textInverse }}>{horse.jockey}</Text><Text variant="caption" className="pt-1" style={{ color: colors.textMuted }}>{race.clubName ?? race.venue}</Text></View>
        <View className="flex-row gap-2 py-4"><Stat label="THIS RACE" value={finish ? '1st' : '—'} /><Stat label="RACE NO." value={String(race.number)} /><Stat label="HORSE NO." value={String(horse.number)} /></View>
        <Card className="flex-row items-center gap-3 p-4"><Trophy size={18} color={colors.brand} /><View className="flex-1"><Text variant="micro" tone="secondary">WINNING RIDE</Text><Text variant="labelSm" className="pt-1">{horse.horse}</Text><Text variant="micro" tone="muted" className="pt-1">{race.name} · {result?.dateLabel ?? race.postTime}</Text></View></Card>
        <Text variant="title" className="pt-6">Race details</Text>
        <Detail icon={<Flag size={16} color={colors.brand} />} title={race.name} subtitle={`Race ${race.number} · ${race.distanceM.toLocaleString()} m`} />
        <Detail icon={<MapPin size={16} color={colors.brand} />} title={race.venue} subtitle={`${race.postTime} · ${race.trackCondition || 'Track condition unavailable'}`} />
        <Detail icon={<Award size={16} color={colors.brand} />} title={horse.trainer || 'Trainer unavailable'} subtitle="Trainer" />
        <Button label="Winning horse" variant="secondary" className="mt-4" onPress={() => router.push({ pathname: '/horse/[id]', params: { id: horse.horseId ?? horse.id, race: race.id } })} />
        <Button label="Jockey statistics" className="mt-2" onPress={() => router.push({ pathname: '/jockey/[id]/statistics', params: { id, race: race.id, horse: horse.horseId ?? horse.id, result: resultId ?? '' } })} />
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <Card className="flex-1 items-center p-3"><Text variant="micro" tone="secondary">{label}</Text><Text variant="title" className="pt-1">{value}</Text></Card>;
}

function Detail({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return <Card className="mt-2 flex-row items-center gap-3 p-3.5">{icon}<View className="flex-1"><Text variant="bodySm" className="font-sans-bold">{title}</Text><Text variant="micro" tone="secondary" className="pt-0.5">{subtitle}</Text></View></Card>;
}
