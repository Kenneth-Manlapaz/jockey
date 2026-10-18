import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Trophy, WalletCards } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { GameGuideCard } from '@/components/domain/game-guide-card';
import { Screen, Text } from '@/components/ui';
import { useGameGuides } from '@/lib/api';
import { useTheme } from '@/theme';

export default function GamesScreen() {
  const router = useRouter();
  const { race } = useLocalSearchParams<{ race?: string }>();
  const { colors } = useTheme();
  const { data: guides, isLoading } = useGameGuides();

  return (
    <Screen>
      <View className="min-h-[214px] rounded-b-[22px] bg-teal-950 pb-8">
        <View className="h-14 flex-row items-center justify-between px-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Home" onPress={() => router.push('/')} className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <Trophy size={17} color={colors.accentIcon} />
          </Pressable>
          <Text variant="labelSm" className="font-sans-bold" style={{ color: colors.textInverse }}>{race ? 'Place a bet' : 'Games &amp; Guide'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Profile and wallet" onPress={() => router.push('/profile')} className="relative h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <WalletCards size={17} color={colors.textInverse} />
            <View className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.accent }} />
          </Pressable>
        </View>
        <View className="px-[18px] pt-3">
          <Text variant="eyebrow" style={{ color: colors.accent }}>
            {race ? 'SELECT A BETTING GAME' : 'LEARN BEFORE YOU SELECT'}
          </Text>
          <Text style={{ color: colors.textInverse, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 25, lineHeight: 27, paddingTop: 6 }}>
            {race ? <>Choose your game,{'\n'}place your bet.</> : <>Understand the race,{'\n'}enjoy every moment.</>}
          </Text>
          <Text variant="micro" className="pt-2" style={{ color: colors.textMuted }}>
            {race ? 'Select a bet type to continue.' : 'Explore games today.'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          style={{ marginTop: -20 }}
          contentContainerStyle={{ paddingHorizontal: 15, gap: 9, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {guides?.map((guide) => (
            <GameGuideCard
              key={guide.id}
              guide={guide}
              actionLabel={race ? 'Choose game' : undefined}
              onLearnMore={() => router.push({ pathname: '/games/[id]', params: { id: guide.id, ...(race ? { race } : {}) } })}
            />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
