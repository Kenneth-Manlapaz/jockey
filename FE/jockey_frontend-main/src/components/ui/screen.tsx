import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface ScreenProps extends ViewProps {
  children?: ReactNode;
  className?: string;
  /** Allow content to sit under the status bar (for dark hero headers). */
  edgeToEdgeTop?: boolean;
}

export function Screen({
  children,
  className,
  edgeToEdgeTop = false,
  style,
  ...props
}: ScreenProps) {
  const { colors } = useTheme();
  const edges = edgeToEdgeTop ? (['bottom'] as const) : (['top', 'bottom'] as const);

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, backgroundColor: colors.background }, style as never]}
      {...props}
    >
      <View className={cn('flex-1', className)}>{children}</View>
    </SafeAreaView>
  );
}
