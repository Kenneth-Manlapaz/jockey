import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';

import { LogoBadge } from './logo';
import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export type AppBarLeft = 'back' | 'brand' | 'none';

export interface AppBarProps {
  title?: string;
  left?: AppBarLeft;
  right?: ReactNode;
  variant?: 'light' | 'dark';
  onBack?: () => void;
  /** Where to go when there is no history to pop (e.g. a deep link). */
  fallbackHref?: Href;
  bordered?: boolean;
  className?: string;
}

/** Three-slot app bar: left (back/brand), centered title, right action. */
export function AppBar({
  title,
  left = 'back',
  right,
  variant = 'light',
  onBack,
  fallbackHref,
  bordered = true,
  className,
}: AppBarProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const isDark = variant === 'dark';

  const iconColor = isDark ? colors.textInverse : colors.textPrimary;

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) return router.back();
    if (fallbackHref) router.replace(fallbackHref);
  };

  return (
    <View
      className={cn('h-16 flex-row items-center justify-between px-4 py-2.5', className)}
      style={
        bordered
          ? { borderBottomWidth: 1, borderBottomColor: isDark ? 'transparent' : colors.border }
          : undefined
      }
    >
      <View className="flex-1 flex-row items-center">
        {left === 'back' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={handleBack}
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' }}
          >
            <ChevronLeft size={20} color={iconColor} />
          </Pressable>
        ) : left === 'brand' ? (
          <LogoBadge size={28} tone="accent" />
        ) : null}
      </View>

      <View pointerEvents="none" className="absolute left-0 right-0 items-center">
        {title ? (
          <Text variant="heading" className="font-sans-bold" style={{ color: iconColor }}>
            {title}
          </Text>
        ) : null}
      </View>

      <View className="flex-1 flex-row items-center justify-end">{right}</View>
    </View>
  );
}
