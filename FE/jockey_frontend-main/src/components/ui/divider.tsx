import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface DividerProps extends ViewProps {
  className?: string;
}

export function Divider({ className, style, ...props }: DividerProps) {
  const { colors } = useTheme();
  return (
    <View
      className={cn('h-px w-full', className)}
      style={[{ backgroundColor: colors.divider }, style]}
      {...props}
    />
  );
}
