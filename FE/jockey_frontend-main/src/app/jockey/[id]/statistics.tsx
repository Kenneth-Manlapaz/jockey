import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Flag, Trophy } from 'lucide-react-native';
import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRace, useResultDetail } from '@/lib/api';
import { useTheme } from '@/theme';

export default function JockeyStatisticsScreen() {
  const { id, race: raceId, horse: horseId, result: resultId } = useLocalSearchParams<{ id: string; race?: string; horse?: string; result?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(raceId ?? '');
  const { data: result } = useResultDetail(resultId ?? '');
  const horse = race?.runners?.find((runner) => runner.horseId === horseId || runner.id === horseId);
  const place = result?.podium.find((entry) => entry.horse.toLowerCase() === horse?.horse.toLowerCase())?.place;
  if (isLoading) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  if (!race || !horse) return <Screen><AppBar title="Jockey Statistics" fallbackHref="/races" /><View className="flex-1 items-center justify-center"><Text variant="labelSm">Jockey statistics unavailable</Text></View></Screen>;
  const placeLabel = place ? `${place}${place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'}` : '—';

  return (
    <Screen>
      <AppBar title="Jockey Statistics" fallbackHref={{ pathname: '/jockey/[id]', params: { id, race: race.id, horse: horseId ?? '', result: resultId ?? '' } }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 36 }}>
        <View className="flex-row items-center gap-3 rounded-2xl bg-teal-950 p-5"><View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: colors.accent }}><Text variant="title">{horse.jockey.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</Text></View><View className="flex-1"><Text variant="eyebrow" style={{ color: colors.accent }}>RACE DAY PROFILE</Text><Text variant="display" className="pt-1" style={{ color: colors.textInverse }}>{horse.jockey}</Text><Text variant="micro" className="pt-1" style={{ color: colors.textMuted }}>{race.clubName ?? race.venue}</Text></View></View>
        <View className="flex-row gap-2"><Stat label="FINISH" value={placeLabel} /><Stat label="RACE" value={String(race.number)} /><Stat label="WINNING HORSE NO." value={String(horse.number)} /></View>
        <Card className="flex-row items-center gap-3 p-4"><Trophy size={18} color={colors.brand} /><View className="flex-1"><Text variant="micro" tone="secondary">OFFICIAL RACE RESULT</Text><Text variant="labelSm" className="pt-1">{result?.raceName ?? race.name}</Text><Text variant="micro" tone="muted" className="pt-1">{result?.venue ?? race.venue} · {result?.dateLabel ?? race.postTime}</Text></View><Text variant="labelSm">{place ? `#${place}` : '—'}</Text></Card>
        <Card className="p-4"><Text variant="labelSm">Race performance</Text><Row label={horse.horse} value={place ? `${placeLabel} place` : 'Result unavailable'} /><Row label="Race distance" value={`${race.distanceM.toLocaleString()} m`} /><Row label="Winning time" value={result?.time || 'Not provided'} /></Card>
        <Text variant="micro" tone="secondary">Career starts, win rate, and historical form are not present in the available data. This view shows the official race information.</Text>
        <Button label="Back to jockey profile" variant="secondary" onPress={() => router.push({ pathname: '/jockey/[id]', params: { id, race: race.id, horse: horseId ?? '', result: resultId ?? '' } })} />
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <Card className="flex-1 items-center p-3"><Text variant="title">{value}</Text><Text variant="micro" tone="secondary" className="pt-1 text-center">{label}</Text></Card>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View className="flex-row items-center justify-between border-b border-stone-200 py-3"><Text variant="caption" tone="secondary">{label === 'horse' ? <Flag size={14} /> : null} {label}</Text><Text variant="caption" className="font-sans-bold">{value}</Text></View>;
}
