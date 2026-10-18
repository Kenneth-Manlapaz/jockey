import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface CardProps extends ViewProps {
  bordered?: boolean;
  muted?: boolean;
  className?: string;
}

export const Card = forwardRef<View, CardProps>(
  ({ bordered = true, muted = false, className, style, ...props }, ref) => {
    const { colors } = useTheme();
    return (
      <View
        ref={ref}
        className={cn('rounded-[18px]', className)}
        style={[
          {
            backgroundColor: muted ? colors.surfaceMuted : colors.surface,
            borderWidth: bordered ? 1 : 0,
            borderColor: colors.border,
          },
          style,
        ]}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';
