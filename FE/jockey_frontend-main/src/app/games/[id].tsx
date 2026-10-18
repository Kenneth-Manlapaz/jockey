import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { CalendarDays, ClipboardCheck, Trophy } from 'lucide-react-native';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useGameGuide } from '@/lib/api';
import { useTheme } from '@/theme';

export default function GameGuideDetailScreen() {
  const { id, race } = useLocalSearchParams<{ id: string; race?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { data: guide, isLoading } = useGameGuide(id);

  if (isLoading) {
    return <Screen className="items-center justify-center"><ActivityIndicator color={colors.brand} /></Screen>;
  }

  if (!guide) {
    return <Screen><AppBar title="Game guide" fallbackHref="/games" /><View className="flex-1 items-center justify-center p-6"><Text variant="labelSm">Guide unavailable</Text><Button label="Back to games" className="mt-4" onPress={() => router.replace('/games')} /></View></Screen>;
  }

  const market = guide.title.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const steps = [
    ...(race ? [] : ['Choose a race from the schedule.']),
    `${guide.selectionHint} on the selection screen.`,
    'Review your wager before confirming your ticket.',
  ];
  const stepIcons = [...(race ? [] : [CalendarDays]), Trophy, ClipboardCheck];

  return (
    <Screen>
      <AppBar title={race ? 'Betting' : 'Game guide'} fallbackHref={{ pathname: '/games', params: race ? { race } : {} }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
        <View className="relative min-h-[190px] justify-center overflow-hidden rounded-2xl border p-5" style={{ backgroundColor: colors.brand, borderColor: colors.accent }}>
          <Image
            source={require('../../../assets/images/web/chestnut-thoroughbred.jpg')}
            contentFit="cover"
            accessibilityLabel="Thoroughbred horse"
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '53%', height: '100%', opacity: 0.72 }}
          />
          <View className="absolute right-0 top-0 h-full w-[58%] bg-teal-950/35" />
          <View className="z-10 w-[72%]">
            <View className="flex-row items-center gap-2">
              <Trophy size={15} color={colors.accentIcon} />
              <Text variant="eyebrow" style={{ color: colors.accent }}>{`GAME GUIDE · ${guide.number}`}</Text>
            </View>
            <Text variant="displayLg" className="pt-2" style={{ color: colors.textInverse }}>{guide.title}</Text>
            <Text variant="body" className="pt-2" style={{ color: colors.textInverse }}>{guide.description}</Text>
            <View className="mt-4 h-[2px] w-12" style={{ backgroundColor: colors.accent }} />
          </View>
        </View>

        <View className="flex-row items-center gap-4 pt-6">
          <Text variant="title">How to play</Text>
          <View className="h-px flex-1" style={{ backgroundColor: colors.accent }} />
        </View>
        <View className="gap-3 pt-3">
          {steps.map((step, index) => {
            const StepIcon = stepIcons[index];
            return (
              <Card key={step} className="min-h-[76px] flex-row items-center gap-3 rounded-2xl p-3">
                <View className="h-11 w-11 items-center justify-center rounded-full border bg-teal-950" style={{ borderColor: colors.accent }}>
                  <Text variant="label" style={{ color: colors.textInverse }}>{index + 1}</Text>
                </View>
                <View className="h-10 w-px" style={{ backgroundColor: colors.accent }} />
                <Text variant="body" className="flex-1">{step}</Text>
                <StepIcon size={22} color={colors.accentIcon} />
              </Card>
            );
          })}
        </View>

        <Button
          label="Proceed"
          className="mt-5"
          onPress={() => race
            ? router.push({ pathname: '/selection/[id]', params: { id: race, market } })
            : router.push({ pathname: '/races', params: { market } })}
        />
      </ScrollView>
    </Screen>
  );
}
