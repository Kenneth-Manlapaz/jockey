import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Trophy, WalletCards } from 'lucide-react-native';

import { Button, Screen, Text } from '@/components/ui';
import { useRace, useRaceGames } from '@/lib/api';
import { useTheme } from '@/theme';
import type { MarketType } from '@/types';

const GAME_HELP: Partial<Record<MarketType, string>> = {
  WIN: 'Choose the horse you think will finish first.',
  PLACE: 'Choose a horse to finish first or second.',
  FORECAST: 'Pick the first two finishers in the correct order.',
  REVERSE_FORECAST: 'Pick the top two finishers in either order.',
  TRIFECTA: 'Pick the first three finishers in the correct order.',
};

export default function RaceBetGamePickerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: race, isLoading } = useRace(id);
  const { data: games, isLoading: gamesLoading } = useRaceGames(id);
  if (isLoading || gamesLoading) return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  if (!race) return <Screen><View className="flex-1 items-center justify-center"><Text variant="labelSm">Race unavailable</Text><Button label="Back to races" className="mt-4" onPress={() => router.replace('/races')} /></View></Screen>;

  return (
    <Screen>
      <View className="bg-teal-950">
        <View className="h-[46px] flex-row items-center justify-between px-3">
          <Pressable accessibilityRole="button" accessibilityLabel="Back to race" onPress={() => router.back()} className="h-8 w-8 items-center justify-center rounded-full bg-white/10"><Trophy size={15} color={colors.accentIcon} /></Pressable>
          <Text style={{ color: colors.textInverse, fontSize: 9, fontWeight: '700' }}>Games &amp; Guide</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} className="h-8 w-8 items-center justify-center rounded-full bg-white/10"><WalletCards size={15} color={colors.textInverse} /></Pressable>
        </View>
        <View className="px-4 pb-7 pt-1">
          <Text style={{ color: colors.accent, fontSize: 7, fontWeight: '700', letterSpacing: 1.3 }}>LEARN BEFORE YOU SELECT</Text>
          <Text style={{ color: colors.textInverse, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 25, lineHeight: 26, marginTop: 6 }}>Understand the race,{ '\n' }enjoy every moment.</Text>
          <Text style={{ color: colors.textMuted, fontSize: 8, marginTop: 5 }}>Race {race.number} · {race.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ gap: 8, marginTop: -9, paddingHorizontal: 10, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {(games ?? []).map((game, index) => {
          const code = game.code.toUpperCase().replace(/\s+/g, '_') as MarketType;
          const hint = GAME_HELP[code] ?? game.short_description;
          return (
            <Pressable key={game.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/selection/[id]', params: { id: race.id, market: code } })} className="min-h-[75px] flex-row items-start gap-2.5 rounded-2xl border border-stone-200 bg-white p-2.5">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-teal-950"><Text style={{ color: colors.textInverse, fontSize: 9, fontWeight: '700' }}>{index + 1}</Text></View>
              <View className="min-w-0 flex-1">
                <Text style={{ color: colors.textPrimary, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 16 }}>{game.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 8, lineHeight: 11, marginTop: 2 }}>{hint}</Text>
                <Text style={{ color: colors.info, fontSize: 7, fontWeight: '700', marginTop: 4 }}>Select {game.selections_required} {game.selections_required === 1 ? 'horse' : 'horses'}{game.is_ordered && game.selections_required > 1 ? ' in order' : ''}</Text>
                <View className="mt-1.5 flex-row items-center gap-1"><Text style={{ color: colors.brand, fontSize: 8, fontWeight: '700' }}>Choose game</Text><ArrowRight size={12} color={colors.brand} /></View>
              </View>
              <ArrowRight size={14} color={colors.brand} />
            </Pressable>
          );
        })}
        {games?.length === 0 ? <View className="rounded-xl border border-dashed border-stone-300 p-4"><Text variant="caption" tone="secondary">No games are available for this race yet.</Text></View> : null}
      </ScrollView>
    </Screen>
  );
}
