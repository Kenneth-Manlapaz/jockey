import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from './text';
import { type StatusTone, useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface StatusChipProps extends Omit<ViewProps, 'children'> {
  tone: StatusTone;
  label: string;
  className?: string;
}

/** Canonical status pill driven by the statusTones token map. */
export const StatusChip = forwardRef<View, StatusChipProps>(
  ({ tone, label, className, style, ...props }, ref) => {
    const { status, colors } = useTheme();
    const t = status[tone];
    const live = tone === 'live';

    return (
      <View
        ref={ref}
        className={cn('flex-row items-center gap-1.5 rounded-[20px] px-2 py-1', className)}
        style={[
          { backgroundColor: live ? 'transparent' : t.background, borderWidth: live ? 0 : 0 },
          style,
        ]}
        {...props}
      >
        {live ? (
          <View
            className="h-[6px] w-[6px] rounded-full"
            style={{
              backgroundColor: t.dot,
              shadowColor: colors.live,
              shadowOpacity: 0.4,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 0 },
              elevation: 2,
            }}
          />
        ) : (
          <View className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: t.dot }} />
        )}
        <Text
          variant="micro"
          className="font-sans-bold uppercase tracking-wide"
          style={{ color: t.text }}
        >
          {label}
        </Text>
      </View>
    );
  },
);

StatusChip.displayName = 'StatusChip';
