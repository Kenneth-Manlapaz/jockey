import { Pressable, View } from 'react-native';
import { ArrowRight, BookOpen, CalendarDays, Trophy } from 'lucide-react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { QuickLink } from '@/types';

const icons = {
  totalizer: Trophy,
  games: CalendarDays,
  guide: BookOpen,
} as const;

export interface UtilityLinkCardProps {
  link: QuickLink;
  onPress?: () => void;
  className?: string;
}

/** Compact icon + label shortcut card (Totalizer / Games guide). */
export function UtilityLinkCard({ link, onPress, className }: UtilityLinkCardProps) {
  const { colors } = useTheme();
  const Icon = icons[link.icon];

  return (
    <Card className={`min-h-[70px] p-0 ${className ?? ''}`}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="flex-row items-center gap-2.5 p-3 active:opacity-80"
      >
        <View className="h-[34px] w-[34px] items-center justify-center rounded-xl" style={{ backgroundColor: colors.backgroundAlt }}>
          <Icon size={18} color={colors.brand} />
        </View>
        <View className="flex-1">
          <Text variant="micro" className="font-sans-bold" style={{ color: colors.textPrimary }}>
            {link.label}
          </Text>
          <Text variant="micro" tone="secondary" className="pt-0.5">
            {link.sublabel}
          </Text>
        </View>
        <ArrowRight size={16} color={colors.textInactive} />
      </Pressable>
    </Card>
  );
}
