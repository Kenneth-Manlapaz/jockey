import { Pressable, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { GameGuide } from '@/types';

export interface GameGuideCardProps {
  guide: GameGuide;
  onLearnMore?: () => void;
  actionLabel?: string;
}

const GAME_DESCRIPTIONS: Record<string, string> = {
  WIN: 'Choose the horse that finishes first.',
  PLACE: 'Choose a horse to finish first or second.',
  FORECAST: 'Pick the first two finishers in order.',
  REVERSE_FORECAST: 'Pick the top two in any order.',
  TRIFECTA: 'Pick the first three finishers in exact order.',
};

/** One market explainer in the Games & Guide list. */
export function GameGuideCard({ guide, onLearnMore, actionLabel = 'Learn more' }: GameGuideCardProps) {
  const { colors } = useTheme();
  const description = GAME_DESCRIPTIONS[guide.title.toUpperCase()] ?? guide.description;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${guide.title} game guide`}
      onPress={onLearnMore}
      className="min-h-[78px] flex-row items-start gap-2.5 rounded-[13px] border bg-white p-2.5 shadow-sm active:opacity-80"
      style={{ borderColor: colors.border }}
    >
      <View className="h-[31px] w-[31px] items-center justify-center rounded-[9px] bg-teal-950">
        <Text style={{ color: colors.textInverse, fontSize: 10, fontWeight: '700' }}>
          {guide.number}
        </Text>
      </View>
      <View className="flex-1 gap-[3px]">
        <Text style={{ color: colors.textPrimary, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 15, lineHeight: 16, textTransform: 'uppercase' }}>
          {guide.title}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 9, lineHeight: 12 }}>
          {description}
        </Text>
        <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 8, lineHeight: 11 }}>
          {guide.selectionHint}
        </Text>
        <View className="mt-1 flex-row items-center justify-between border-t border-stone-100 pt-1">
          <Text style={{ color: colors.brand, fontSize: 9, fontWeight: '700' }}>{actionLabel}</Text>
          <View className="h-[19px] w-[19px] items-center justify-center rounded-full" style={{ backgroundColor: '#e7f0eb' }}>
            <ArrowRight size={11} color={colors.brand} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
