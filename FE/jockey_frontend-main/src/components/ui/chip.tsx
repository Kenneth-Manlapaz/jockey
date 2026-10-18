import { forwardRef } from 'react';
import { Pressable, type PressableProps, View } from 'react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export type ChipVariant = 'filled' | 'outline';

export interface ChipProps extends Omit<PressableProps, 'children'> {
  label: string;
  selected?: boolean;
  variant?: ChipVariant;
  dotColor?: string;
  className?: string;
}

/** Pill used for filters, statuses and tags. */
export const Chip = forwardRef<View, ChipProps>(
  (
    { label, selected = false, variant = 'outline', dotColor, className, onPress, ...props },
    ref,
  ) => {
    const { colors } = useTheme();

    const bg = selected ? colors.brand : 'transparent';
    const border = selected ? colors.brand : colors.borderStrong;
    const textColor = selected ? colors.textInverse : colors.textPrimary;

    const Container: typeof Pressable | typeof View = onPress ? Pressable : View;

    return (
      <Container
        ref={ref as never}
        onPress={onPress}
        className={cn(
          'flex-row items-center justify-center gap-1.5 self-start rounded-[20px] border px-3 py-1.5',
          onPress && 'active:opacity-70',
          className,
        )}
        style={{ backgroundColor: bg, borderColor: border }}
      >
        {dotColor ? (
          <View className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: dotColor }} />
        ) : null}
        <Text
          variant="caption"
          className="font-sans-semibold uppercase tracking-wide"
          style={{ color: textColor }}
        >
          {label}
        </Text>
      </Container>
    );
  },
);

Chip.displayName = 'Chip';
