import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useHome, useRace } from '@/lib/api';
import { useTheme } from '@/theme';
import { AppBar, Button, Card, Screen, Text } from '@/components/ui';

export default function LiveUpdatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: home } = useHome();
  const { data: race } = useRace(home?.liveRace.id ?? '');
  const runners = [...(race?.runners ?? home?.liveRace.runners ?? [])].sort((a, b) => a.number - b.number);

  return (
    <Screen>
      <AppBar title="Live Race Updates" fallbackHref="/live" />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 36 }}>
        <View className="rounded-2xl bg-teal-950 p-5">
          <Text variant="eyebrow" style={{ color: colors.accent }}>{`RACE ${home?.liveRace.number ?? '—'} · ${home?.liveRace.postTime ?? ''}`}</Text>
          <Text variant="display" className="pt-2" style={{ color: colors.textInverse }}>Official update feed</Text>
          <Text variant="caption" className="pt-2" style={{ color: colors.textMuted }}>{(race?.status ?? home?.liveRace.status ?? 'upcoming').toUpperCase()}</Text>
        </View>
        <Card className="p-4">
          <Text variant="labelSm">Running positions</Text>
          <Text variant="caption" tone="secondary" className="pt-2">Waiting for official updates. Positions and elapsed times will appear when a race feed is connected.</Text>
        </Card>
        <View>
          <Text variant="labelSm" className="pb-2">Entry monitor</Text>
          {runners.length ? runners.map((runner) => (
            <Card key={runner.id} className="mb-2 flex-row items-center gap-3 p-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-950"><Text variant="caption" style={{ color: colors.textInverse }}>{runner.number}</Text></View>
              <View className="flex-1"><Text variant="bodySm" className="font-sans-bold">{runner.horse}</Text><Text variant="micro" tone="secondary">{runner.jockey}</Text></View>
              <Text variant="micro" tone="muted">NO POSITION</Text>
            </Card>
          )) : <Card className="p-4"><Text variant="caption" tone="secondary">Race entries are not available yet.</Text></Card>}
        </View>
        <Button label="Watch sample stream" variant="secondary" onPress={() => router.push('/live/stream')} />
        {home?.liveRace.id ? <Button label="View race entries" onPress={() => router.push(`/race/${home.liveRace.id}/entries`)} /> : null}
      </ScrollView>
    </Screen>
  );
}
