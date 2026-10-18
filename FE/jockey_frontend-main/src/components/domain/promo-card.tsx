import { Pressable, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Promo } from '@/types';

export interface PromoCardProps {
  promo: Promo;
  onPress?: () => void;
}

/** Dark editorial promo inviting new users to learn the game. */
export function PromoCard({ promo, onPress }: PromoCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl p-4 active:opacity-90"
      style={{ backgroundColor: '#C6A15B' }}
    >
      <View className="flex-1">
        <Text variant="eyebrow" tone="accent">
          {promo.eyebrow}
        </Text>
        <Text variant="title" className="pt-1" style={{ color: colors.brand }}>
          {promo.title}
        </Text>
        <Text variant="bodySm" className="pt-1 font-sans" style={{ color: colors.textSecondary }}>
          {promo.description}
        </Text>
      </View>
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.brand }}
      >
        <ArrowRight size={18} color={colors.textInverse} />
      </View>
    </Pressable>
  );
}
