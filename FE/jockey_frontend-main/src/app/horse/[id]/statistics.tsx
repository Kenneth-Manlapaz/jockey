import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRace } from '@/lib/api';
import { useTheme } from '@/theme';

export default function HorseStatisticsScreen() {
  const { id, race: raceId } = useLocalSearchParams<{ id: string; race?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(raceId ?? '');
  const horse = race?.runners?.find((runner) => runner.horseId === id || runner.id === id);
  if (isLoading) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  if (!race || !horse) return <Screen><AppBar title="Horse Statistics" fallbackHref="/races" /><View className="flex-1 items-center justify-center"><Text variant="labelSm">Horse statistics unavailable</Text></View></Screen>;

  return (
    <Screen>
      <AppBar title="Horse Statistics" fallbackHref={{ pathname: '/horse/[id]', params: { id, race: race.id } }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 36 }}>
        <View className="flex-row items-center gap-3 rounded-2xl bg-teal-950 p-5"><View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accent }}><Text variant="labelSm">{horse.number}</Text></View><View className="flex-1"><Text variant="micro" style={{ color: colors.accentSoft }}>{`PH-JK-${horse.id.padStart(6, '0')}`}</Text><Text variant="display" className="pt-1" style={{ color: colors.textInverse }}>{horse.horse}</Text><Text variant="micro" className="pt-1" style={{ color: colors.textMuted }}>{horse.trainer || 'Thoroughbred'} · {horse.owner || 'Race entry'}</Text></View></View>
        <View className="flex-row flex-wrap gap-2">
          <Stat label="RACE NO." value={String(horse.number)} />
          <Stat label="ODDS" value={horse.odds ? horse.odds.toFixed(2) : '—'} />
          <Stat label="WEIGHT KG" value={horse.weightKg ? String(horse.weightKg) : '—'} />
          <Stat label="ENTRY STATUS" value={horse.status || 'Entered'} />
        </View>
        <Card className="flex-row items-center justify-between p-4"><View><Text variant="micro" tone="secondary">RACE</Text><Text variant="labelSm" className="pt-1">{race.name}</Text></View><Text variant="caption" tone="secondary">{race.distanceM.toLocaleString()} m</Text></Card>
        <Card className="p-4"><Text variant="labelSm">Race entry details</Text><Text variant="caption" tone="secondary" className="pt-2">Career totals and historical results are not included in the available race-entry data.</Text></Card>
        <Button label="Back to race entries" variant="secondary" onPress={() => router.push(`/race/${race.id}/entries`)} />
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <Card className="min-w-[46%] flex-1 items-center p-3"><Text variant="micro" tone="secondary">{label}</Text><Text variant="labelSm" className="pt-1">{value}</Text></Card>;
}
