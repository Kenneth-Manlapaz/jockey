import { useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { GradientOverlay, LogoLockup, Screen, Text } from '@/components/ui';
import { useSessionStore } from '@/lib/auth/session';
import { BYPASS_AUTH } from '@/lib/config';
import { useTheme } from '@/theme';

const HERO_IMAGE = 'https://placehold.co/366x838';
const SPLASH_DURATION_MS = 1800;
const DOT_OPACITY = [0.95, 0.9, 0.5];

export default function SplashScreen() {
  const router = useRouter();
  const { colors, gradients } = useTheme();

  useEffect(() => {
    const timer = setTimeout(async () => {
      const session = useSessionStore.getState();
      if (BYPASS_AUTH) {
        session.signInDemo();
        router.replace('/');
        return;
      }
      await session.restore();
      router.replace(useSessionStore.getState().user ? '/' : '/signup');
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Screen className="bg-teal-950" edgeToEdgeTop>
      <View className="flex-1" style={{ backgroundColor: colors.brand }}>
        <Image
          source={{ uri: HERO_IMAGE }}
          contentFit="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}
        />
        <GradientOverlay colors={gradients.onboardingFade} locations={[0, 0.82]} />

        <View className="flex-1 justify-end px-9 pb-11">
          <LogoLockup size={56} />

          <View className="pb-28 pt-7">
            <Text variant="displayLg" style={{ color: colors.textInverse }}>
              Racing intelligence.{'\n'}Refined for you.
            </Text>
          </View>

          <View className="flex-row gap-1.5 pb-6">
            {DOT_OPACITY.map((opacity, index) => (
              <View
                key={index}
                className="h-[5px] w-[5px] rounded-full"
                style={{ backgroundColor: colors.accent, opacity }}
              />
            ))}
          </View>

          <Text
            variant="micro"
            className="tracking-widest"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            All Rights Reserved.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
