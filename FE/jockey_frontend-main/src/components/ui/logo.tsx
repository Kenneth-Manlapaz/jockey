import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import { Trophy } from 'lucide-react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface LogoBadgeProps extends ViewProps {
  size?: number;
  tone?: 'accent' | 'brand';
  className?: string;
}

/** Circular outlined badge containing the jockey mark. */
export const LogoBadge = forwardRef<View, LogoBadgeProps>(
  ({ size = 28, tone = 'accent', className, style, ...props }, ref) => {
    const { colors } = useTheme();
    const color = tone === 'accent' ? colors.accent : colors.brand;
    const iconColor = tone === 'accent' ? colors.accentIcon : colors.brand;

    return (
      <View
        ref={ref}
        className={cn('items-center justify-center rounded-2xl', className)}
        style={[{ width: size, height: size, borderWidth: 1, borderColor: color }, style]}
        {...props}
      >
        <Trophy size={size * 0.55} color={iconColor} strokeWidth={1.8} />
      </View>
    );
  },
);

LogoBadge.displayName = 'LogoBadge';

export interface LogoLockupProps extends ViewProps {
  size?: number;
  className?: string;
}

/** Brand lockup: badge + "PHILIPPINE JOCKEY" wordmark. Used in app bars. */
export const LogoLockup = forwardRef<View, LogoLockupProps>(
  ({ size = 28, className, style, ...props }, ref) => {
    const { colors } = useTheme();
    return (
      <View
        ref={ref}
        className={cn('flex-row items-center gap-2', className)}
        style={style}
        {...props}
      >
        <LogoBadge size={size} tone="accent" />
        <View className="justify-center">
          <Text variant="micro" tone="accent" className="font-sans-bold tracking-widest">
            PHILIPPINE
          </Text>
          <Text
            variant="display"
            className="text-lg tracking-wider"
            style={{ color: colors.textInverse }}
          >
            JOCKEY
          </Text>
        </View>
      </View>
    );
  },
);

LogoLockup.displayName = 'LogoLockup';
