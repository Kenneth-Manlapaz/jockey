import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BetProgress } from '@/components/domain/bet-progress';
import { RunnerSelectRow } from '@/components/domain/runner-select-row';
import { Button, Screen, Text } from '@/components/ui';
import { useRace, useRaceGames } from '@/lib/api';
import { useBetsStore } from '@/lib/bets/store';
import { requirementFor } from '@/lib/markets';
import { useTheme } from '@/theme';
import type { CartItem, MarketType } from '@/types';

export default function MakeSelectionScreen() {
  const {
    id,
    market: marketParam,
    editId,
    runner: runnerParam,
  } = useLocalSearchParams<{
    id: string;
    market?: string;
    editId?: string;
    runner?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(id);
  const { data: games = [], isLoading: gamesLoading } = useRaceGames(id);
  const cart = useBetsStore((state) => state.cart);
  const addToCart = useBetsStore((state) => state.addToCart);
  const updateCart = useBetsStore((state) => state.updateCart);

  const editing = editId ? cart.find((item) => item.id === editId) : undefined;
  const [selected, setSelected] = useState<string[]>(
    () => editing?.runners.map((runner) => runner.entryId ?? String(runner.runnerNumber)) ?? runnerParam?.split(',') ?? [],
  );

  const market = ((marketParam as string) ?? 'WIN').toUpperCase() as MarketType;
  const game = games.find((item) => item.code.toUpperCase() === market);
  const fallbackRequirement = requirementFor(market);
  const required = game?.selections_required ?? fallbackRequirement.min;

  const selectedRunners = useMemo(
    () =>
      selected
        .map((id) => (race?.runners ?? []).find((runner) => runner.id === id || String(runner.number) === id))
        .filter((runner) => runner !== undefined),
    [race?.runners, selected],
  );

  const valid = required > 0 && selectedRunners.length === required;

  const toggle = (runnerId: string) => {
    setSelected((prev) => {
      if (prev.includes(runnerId)) return prev.filter((id) => id !== runnerId);
      return prev.length < required ? [...prev, runnerId] : prev;
    });
  };

  const buildCartItem = (): Omit<CartItem, 'id'> | null => {
    if (!race || selectedRunners.length === 0) return null;
    return {
      raceId: race.id,
      raceNumber: race.number,
      raceName: race.name,
      raceDateLabel: race.raceDate ?? '',
      postTime: race.postTime,
      market,
      stake: editing?.stake ?? 50,
      runners: selectedRunners.map((runner) => ({
        raceId: race.id,
        raceLabel: `Race ${race.number} · ${race.name}`,
        runnerNumber: runner.number,
        horse: runner.horse,
        jockey: runner.jockey,
        odds: runner.odds,
        entryId: runner.id,
      })),
    };
  };

  const commit = () => {
    const item = buildCartItem();
    if (!item) return;
    if (editId) updateCart(editId, item);
    else {
      const duplicate = cart.find((existing) =>
        existing.raceId === item.raceId &&
        existing.market === item.market &&
        existing.runners.map((runner) => runner.entryId).join(',') === item.runners.map((runner) => runner.entryId).join(','),
      );
      if (duplicate) updateCart(duplicate.id, item);
      else addToCart(item);
    }
  };

  if (isLoading || gamesLoading || !race) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <BetProgress step={2} />

        <View className="pb-3">
          <Text variant="micro" className="font-sans-bold tracking-widest" style={{ color: colors.brand }}>
            MAKE SELECTION · {market.replace(/_/g, ' ')}
          </Text>
          <Text variant="display" className="pt-1 text-3xl" style={{ color: colors.brand }}>{race.name}</Text>
          <Text variant="caption" tone="secondary" className="pt-1">Race {race.number} · Select {required} {required === 1 ? 'runner' : 'runners'}.</Text>
        </View>
        <Text variant="caption" tone="secondary" className="pb-3">Choose {required} runner{required === 1 ? '' : 's'} for {market.replace(/_/g, ' ')}.</Text>

        <View className="gap-2">
          {race.runners?.map((runner) => (
            <RunnerSelectRow
              key={runner.id}
              runner={runner}
              selected={selected.includes(runner.id) || selected.includes(String(runner.number))}
              onToggle={() => toggle(runner.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View
        className="flex-row items-center justify-between gap-2 border-t px-3 py-2.5"
        style={{ borderTopColor: colors.border, backgroundColor: '#f8f4e9' }}
      >
        <View className="flex-1">
          <Text variant="labelSm">{selectedRunners.length} bet {selectedRunners.length === 1 ? 'selection' : 'selections'} ready</Text>
          <Text variant="micro" tone="secondary">
            {selectedRunners.length} of {required} selected
          </Text>
        </View>
        {editId ? (
          <Button
            label="Update bet"
            size="sm"
            fullWidth={false}
            disabled={!valid}
            onPress={() => {
              commit();
              router.back();
            }}
          />
        ) : (
          <Button
            label="Add bet to cart"
              size="sm"
              fullWidth={false}
              disabled={!valid}
              onPress={() => {
                commit();
                router.navigate('/bet-cart');
              }}
            />
        )}
      </View>
    </Screen>
  );
}
