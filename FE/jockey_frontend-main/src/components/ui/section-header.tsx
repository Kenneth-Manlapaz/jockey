import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/** Section title with an optional "View all"-style action link. */
export function SectionHeader({ title, actionLabel, onAction, className }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View className={cn('flex-row items-center justify-between', className)}>
      <Text variant="title">{title}</Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onAction}
          className="flex-row items-center gap-0.5"
        >
          <Text variant="eyebrow" className="text-[10px]" style={{ color: colors.brand }}>
            {actionLabel}
          </Text>
          <ChevronRight size={14} color={colors.brand} />
        </Pressable>
      ) : null}
    </View>
  );
}
