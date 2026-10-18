import { View } from 'react-native';

import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { silkColorFor, useTheme } from '@/theme';

export interface SilkBadgeProps {
  number: number;
  /** Explicit silk colour; falls back to the saddlecloth-number silk. */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE: Record<
  NonNullable<SilkBadgeProps['size']>,
  { box: number; text: 'caption' | 'labelSm' | 'label' }
> = {
  sm: { box: 20, text: 'caption' },
  md: { box: 24, text: 'caption' },
  lg: { box: 36, text: 'labelSm' },
};

/** Colour-coded saddlecloth number used across selection/cart/ticket views. */
export function SilkBadge({ number, color, size = 'md', className }: SilkBadgeProps) {
  const { colors } = useTheme();
  const dim = SIZE[size];

  return (
    <View
      className={cn('items-center justify-center rounded-[6px]', className)}
      style={{ width: dim.box, height: dim.box, backgroundColor: color ?? silkColorFor(number) }}
    >
      <Text variant={dim.text} className="font-sans-bold" style={{ color: colors.textInverse }}>
        {number}
      </Text>
    </View>
  );
}
