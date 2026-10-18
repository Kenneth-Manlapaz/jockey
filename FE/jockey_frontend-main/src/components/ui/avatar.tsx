import { forwardRef } from 'react';
import { View, type ViewProps } from 'react-native';
import { Pencil } from 'lucide-react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface AvatarProps extends ViewProps {
  initials: string;
  size?: number;
  presence?: boolean;
  showEdit?: boolean;
  className?: string;
}

export const Avatar = forwardRef<View, AvatarProps>(
  (
    { initials, size = 44, presence = false, showEdit = false, className, style, ...props },
    ref,
  ) => {
    const { colors } = useTheme();
    const glyph = initials.slice(0, 2).toUpperCase();

    return (
      <View
        ref={ref}
        className={cn('relative', className)}
        style={[{ width: size, height: size }, style]}
        {...props}
      >
        <View
          className="flex-1 items-center justify-center rounded-full"
          style={{
            backgroundColor: colors.avatarBg,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.25)',
          }}
        >
          <Text variant="display" className="text-[22px]" style={{ color: colors.avatarText }}>
            {glyph}
          </Text>
        </View>

        {presence ? (
          <View
            className="absolute rounded-full"
            style={{
              width: 10,
              height: 10,
              right: 2,
              bottom: 2,
              backgroundColor: colors.presence,
              borderWidth: 2,
              borderColor: colors.brand,
            }}
          />
        ) : null}

        {showEdit ? (
          <View
            className="absolute items-center justify-center rounded-xl"
            style={{
              width: 28,
              height: 28,
              right: -2,
              bottom: -2,
              backgroundColor: colors.accent,
              borderWidth: 1,
              borderColor: colors.brand,
            }}
          >
            <Pencil size={13} color={colors.brand} />
          </View>
        ) : null}
      </View>
    );
  },
);

Avatar.displayName = 'Avatar';
