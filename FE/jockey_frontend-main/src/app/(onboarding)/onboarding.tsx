import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, LogoLockup, Screen, Text } from '@/components/ui';
import { useOnboardingSlides } from '@/lib/api';
import { useTheme } from '@/theme';
import type { OnboardingSlide } from '@/types';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, palette } = useTheme();
  const { data: slides } = useOnboardingSlides();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<OnboardingSlide>>(null);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const isLast = slides ? index === slides.length - 1 : false;

  const goNext = () => {
    if (!slides) return;
    if (isLast) {
      router.replace('/welcome');
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <Screen className="bg-teal-950" edgeToEdgeTop>
      <View className="flex-1" style={{ backgroundColor: colors.brand, paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-9 pt-4">
          <LogoLockup size={32} />
          <Pressable onPress={() => router.replace('/welcome')} hitSlop={8}>
            <Text variant="caption" style={{ color: colors.textMuted }}>
              Skip
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={slides ?? []}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          renderItem={({ item }) => (
            <View style={{ width }} className="flex-1 justify-end px-9 pb-11">
              <View
                className="mb-8 h-64 overflow-hidden rounded-2xl"
                style={{ backgroundColor: palette.teal900 }}
              >
                <View className="flex-1" />
              </View>
              <Text variant="micro" tone="accent" className="font-sans-bold tracking-widest">
                {item.eyebrow}
              </Text>
              <Text variant="displayLg" className="pt-3" style={{ color: colors.textInverse }}>
                {item.title}
                {'\n'}
                <Text variant="displayLg" style={{ color: colors.accentSoft }}>
                  {item.highlight}
                </Text>
              </Text>
              <Text variant="body" className="pt-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {item.description}
              </Text>
            </View>
          )}
        />

        <View className="px-9 pb-8">
          <View className="flex-row gap-1.5 pb-6">
            {(slides ?? []).map((slide, i) => (
              <View
                key={slide.id}
                className="h-[5px] w-[5px] rounded-full"
                style={{ backgroundColor: colors.accent, opacity: i === index ? 0.95 : 0.5 }}
              />
            ))}
          </View>
          <Button label={isLast ? 'Get started' : 'Continue'} variant="accent" onPress={goNext} />
        </View>
      </View>
    </Screen>
  );
}
