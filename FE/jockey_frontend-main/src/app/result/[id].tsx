import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Podium } from '@/components/domain/podium';
import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRace, useResultDetail } from '@/lib/api';
import { formatPeso } from '@/lib/format';
import { palette, useTheme } from '@/theme';
import { useBetsStore } from '@/lib/bets/store';
import { getBetResultMessages, getBetWinNotifications } from '@/lib/bet-result';
import { useBetWinNotificationsStore } from '@/lib/notifications/bet-wins';

export default function ResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: result, isLoading } = useResultDetail(id);
  const { data: race } = useRace(result?.raceId ?? '');
  const tickets = useBetsStore((state) => state.tickets);
  const addWinNotifications = useBetWinNotificationsStore((state) => state.add);
  const loadBets = useBetsStore((state) => state.loadBets);
  useEffect(() => { void loadBets(); }, [loadBets]);
  useEffect(() => {
    if (!result) return;
    addWinNotifications(getBetWinNotifications(tickets, {
      resultId: result.id,
      raceId: result.raceId,
      raceNumber: result.raceNumber,
      status: result.status,
      winner: result.winner.horse,
      podium: result.podium,
      dividends: result.dividends,
    }));
  }, [addWinNotifications, result, tickets]);
  const betMessages = result ? getBetResultMessages(tickets, {
    raceId: result.raceId,
    raceNumber: result.raceNumber,
    status: result.status,
    winner: result.winner.horse,
    podium: result.podium,
    dividends: result.dividends,
  }) : [];

  const winner = result?.podium.find((entry) => entry.place === 1) ?? result?.podium[0];
  const winningRunner = race?.runners?.find((runner) => runner.horse.toLowerCase() === winner?.horse.toLowerCase());
  const jockeySlug = winner?.jockey.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (isLoading || !result) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  return (
    <Screen edgeToEdgeTop>
      <View style={{ backgroundColor: colors.brand }}>
        <AppBar
          title="Official Results"
          variant="dark"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter results"
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              <SlidersHorizontal size={18} color={colors.textInverse} />
            </Pressable>
          }
        />

        <View className="items-center px-5 pb-24">
          <View
            className="flex-row items-center gap-1.5 rounded-[20px] px-2 py-1"
            style={{ backgroundColor: palette.orange100 }}
          >
            <View
              className="h-[5px] w-[5px] rounded-full"
              style={{ backgroundColor: palette.yellow700 }}
            />
            <Text
              variant="caption"
              className="font-sans-bold uppercase tracking-wide"
              style={{ color: palette.yellow700, fontSize: 11 }}
            >
              Official
            </Text>
          </View>
          <Text variant="caption" className="pt-3 tracking-wide" style={{ color: colors.accentSoft, fontSize: 10 }}>
            {result.dateLabel}
          </Text>
          <Text
            variant="displayLg"
            className="pt-1.5 text-center"
            style={{ color: colors.textInverse }}
          >
            {result.raceName}
          </Text>
          <Text variant="bodySm" className="pt-1.5" style={{ color: colors.textMuted, fontSize: 12 }}>
            {result.distanceM.toLocaleString()} m · {result.venue}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        style={{ marginTop: -56 }}
        showsVerticalScrollIndicator={false}
      >
        <Podium entries={result.podium} />
        <Text variant="caption" tone="secondary" className="-mt-3 text-center" style={{ fontSize: 10 }}>
          Example horse photos are illustrative and do not depict the named runners.
        </Text>

        {betMessages.length ? <View className="gap-2">
          {betMessages.map((message, index) => <Card key={`bet-result-${index}`} className="p-3" style={{ backgroundColor: colors.accentFaint }}>
            <Text variant="bodySm" className="font-sans-bold" style={{ color: colors.brand }}>{message}</Text>
          </Card>)}
        </View> : null}

        <Card className="items-center p-3.5">
          <Text variant="caption" tone="secondary" className="tracking-wide" style={{ fontSize: 11 }}>
            OFFICIAL WINNING TIME
          </Text>
          <Text variant="displayLg" className="pt-0.5" style={{ color: colors.brand }}>
            {result.time}
          </Text>
          <Text variant="bodySm" tone="secondary" style={{ fontSize: 12 }}>
            Track condition: {result.trackCondition}
          </Text>
        </Card>

        <View>
          <Text variant="title" style={{ fontSize: 23 }}>Dividends</Text>
          <Card className="mt-2.5 px-3.5">
            {result.dividends.map((dividend, index) => (
              <View
                key={dividend.market}
                className="flex-row items-center justify-between py-2.5"
                style={
                  index === result.dividends.length - 1
                    ? undefined
                    : { borderBottomWidth: 1, borderBottomColor: colors.border }
                }
              >
                <Text variant="bodySm" className="font-sans-bold" style={{ fontSize: 13 }}>
                  {dividend.market.replace(/_/g, ' ')}
                </Text>
                <Text variant="bodySm" tone="secondary" style={{ fontSize: 13 }}>
                  {dividend.selection}
                </Text>
                <Text variant="bodySm" className="font-sans-bold" style={{ color: colors.brand, fontSize: 13 }}>
                  {formatPeso(dividend.amount)}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        <View>
          <Text variant="title" style={{ fontSize: 23 }}>Race summary</Text>
          <Text variant="body" tone="secondary" className="pt-2" style={{ fontSize: 14, lineHeight: 21 }}>
            {result.summary}
          </Text>
        </View>

        <View className="flex-row gap-2.5">
          <Button
            label="Winning horse"
            variant="secondary"
            fullWidth={false}
            className="flex-1"
            disabled={!winner}
            onPress={() =>
              winner && (winningRunner && race
                ? router.push({ pathname: '/horse/[id]', params: { id: winningRunner.horseId ?? winningRunner.id, race: race.id } })
                : router.push({ pathname: '/contender', params: { kind: 'horse', name: winner.horse, number: String(winner.number), race: result.raceName } }))
            }
          />
          <Button
            label="Winning jockey"
            variant="secondary"
            fullWidth={false}
            className="flex-1"
            disabled={!winner}
            onPress={() =>
              winner && (winningRunner && race
                ? router.push({ pathname: '/jockey/[id]', params: { id: jockeySlug ?? 'unknown', race: race.id, horse: winningRunner.horseId ?? winningRunner.id, result: result.id } })
                : router.push({ pathname: '/contender', params: { kind: 'jockey', name: winner.jockey, number: String(winner.number), race: result.raceName } }))
            }
          />
        </View>

        <Button label="How to read race results" variant="secondary" size="sm" onPress={() => router.push('/racing-guide')} />
      </ScrollView>
    </Screen>
  );
}
