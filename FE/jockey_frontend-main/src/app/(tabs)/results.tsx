import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppBar, Card, Chip, Screen, StatusChip, Text } from '@/components/ui';
import { api, useResults } from '@/lib/api';
import { useTheme } from '@/theme';
import { useBetsStore } from '@/lib/bets/store';
import { getBetResultMessages, getBetWinNotifications } from '@/lib/bet-result';
import { useBetWinNotificationsStore } from '@/lib/notifications/bet-wins';
import type { ResultDetail } from '@/types';

const FILTERS = ['All', 'Official', 'Provisional', 'Cancelled'] as const;

export default function ResultsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading } = useResults();
  const tickets = useBetsStore((state) => state.tickets);
  const loadBets = useBetsStore((state) => state.loadBets);
  const addWinNotifications = useBetWinNotificationsStore((state) => state.add);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [resultDetails, setResultDetails] = useState<Record<string, ResultDetail>>({});

  useEffect(() => { void loadBets(); }, [loadBets]);
  useEffect(() => {
    let active = true;
    const loadOfficialResults = async () => {
      const official = data?.filter((result) => result.status === 'official') ?? [];
      const details = await Promise.all(official.map((result) => api.getResultDetail(result.id)));
      if (!active) return;
      const available = details.filter((result): result is ResultDetail => Boolean(result));
      setResultDetails(Object.fromEntries(available.map((result) => [result.id, result])));
    };
    void loadOfficialResults().catch(() => undefined);
    return () => { active = false; };
  }, [data]);
  useEffect(() => {
    Object.values(resultDetails).forEach((result) => {
      addWinNotifications(getBetWinNotifications(tickets, {
        resultId: result.id,
        raceId: result.raceId,
        raceNumber: result.raceNumber,
        status: result.status,
        winner: result.winner.horse,
        podium: result.podium,
        dividends: result.dividends,
      }));
    });
  }, [addWinNotifications, resultDetails, tickets]);

  const results =
    data?.filter((r) => (filter === 'All' ? true : r.status === filter.toLowerCase())) ?? [];

  return (
    <Screen>
      <AppBar title="Race Results" left="brand" />

      <View className="flex-row items-center justify-between bg-white p-3">
        <View
          className="h-8 w-8 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.surfaceMuted }}
        >
          <ChevronLeft size={16} color={colors.textPrimary} />
        </View>
        <View className="items-center">
          <Text variant="micro" tone="secondary" className="tracking-wide">
            RESULTS FOR
          </Text>
          <Text variant="labelSm" className="pt-0.5">
            Thursday, 24 October
          </Text>
        </View>
        <View
          className="h-8 w-8 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.surfaceMuted }}
        >
          <ChevronRight size={16} color={colors.textPrimary} />
        </View>
      </View>

      <View
        className="flex-row gap-1.5 border-b px-4 py-3"
        style={{ borderBottomColor: colors.border }}
      >
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? <ActivityIndicator color={colors.brand} /> : null}
        {results.map((result) => (
          (() => {
            const betMessages = getBetResultMessages(tickets, {
              raceId: result.raceId,
              raceNumber: result.raceNumber,
              status: result.status,
              winner: result.winner.horse,
              podium: resultDetails[result.id]?.podium,
              dividends: resultDetails[result.id]?.dividends,
            });
            return (
          <Card
            key={result.id}
            className="overflow-hidden"
            onTouchEnd={() => router.push(`/result/${result.id}`)}
          >
            <View
              className="flex-row items-center justify-between border-b px-3 py-2.5"
              style={{ borderBottomColor: colors.border }}
            >
              <Text variant="micro" tone="accent" className="font-sans-bold">
                RACE {result.raceNumber}
              </Text>
              <StatusChip
                tone={result.status}
                label={result.status.charAt(0).toUpperCase() + result.status.slice(1)}
              />
            </View>
            <View className="flex-row items-center gap-3 p-3">
              <View
                className="h-8 w-8 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colors.accent }}
              >
                <Text variant="caption" tone="muted">
                  1
                </Text>
              </View>
              <View className="flex-1">
                <Text variant="micro" tone="secondary">
                  WINNER
                </Text>
                <Text variant="display" className="text-base">
                  {result.winner.horse}
                </Text>
                <Text variant="micro" tone="muted">
                  {result.winner.jockey}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textPrimary} />
            </View>
            {betMessages.map((message, index) => <View key={`${result.id}-bet-${index}`} className="mx-3 mb-2 rounded-lg p-2" style={{ backgroundColor: colors.accentFaint }}><Text variant="caption" style={{ color: colors.brand }}>{message}</Text></View>)}
            <View
              className="flex-row items-center justify-between px-3 py-2"
              style={{ backgroundColor: colors.surfaceMuted }}
            >
              <Text variant="micro" tone="secondary">
                {result.venue}
              </Text>
              <Text variant="micro" tone="secondary">
                {result.postTime} · {result.distanceM.toLocaleString()} m
              </Text>
            </View>
          </Card>
            );
          })()
        ))}
      </ScrollView>
    </Screen>
  );
}
