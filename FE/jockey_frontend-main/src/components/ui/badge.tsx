import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface BadgeProps extends Omit<ViewProps, 'children'> {
  count?: number;
  max?: number;
  className?: string;
}

/** Small accent count badge (e.g. notifications). */
export const Badge = forwardRef<View, BadgeProps>(
  ({ count, max = 99, className, style, ...props }, ref) => {
    const { colors } = useTheme();
    if (count === undefined || count <= 0) return null;
    const label = count > max ? `${max}+` : String(count);

    return (
      <View
        ref={ref}
        className={cn('min-h-4 min-w-4 items-center justify-center rounded-lg px-1', className)}
        style={[{ backgroundColor: colors.accent }, style]}
        {...props}
      >
        <Text variant="micro" style={{ color: colors.brand }} className="font-sans-bold">
          {label}
        </Text>
      </View>
    );
  },
);

Badge.displayName = 'Badge';
