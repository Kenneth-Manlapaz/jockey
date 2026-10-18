import { View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Button, GradientOverlay, LogoLockup, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, gradients, palette } = useTheme();

  return (
    <Screen className="bg-stone-100">
      <View className="flex-1">
        <View className="h-80">
          <View className="flex-1" style={{ backgroundColor: palette.neutral600 }} />
          <GradientOverlay colors={gradients.welcomeFade} locations={[0, 0.6, 1]} />
          <View className="absolute left-6 top-14">
            <LogoLockup size={40} />
          </View>
        </View>

        <View className="flex-1 justify-start px-7 pt-3.5">
          <Text variant="eyebrow" tone="accent">
            THE SPORT OF KINGS
          </Text>
          <Text variant="displayXl" className="pt-2.5">
            Every race.{'\n'}
            <Text variant="displayXl" style={{ color: colors.brand }}>
              Every moment.
            </Text>
          </Text>
          <Text variant="body" tone="secondary" className="pt-2.5">
            Explore racing events, meet the contenders, and learn the game—all in one premium
            experience.
          </Text>

          <View className="gap-2.5 pt-6">
            <Button
              label="Create account"
              trailingIcon={<ArrowRight size={16} color={colors.textInverse} />}
              onPress={() => router.push('/signup')}
            />
            <Button label="Log in" variant="secondary" onPress={() => router.push('/login')} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
