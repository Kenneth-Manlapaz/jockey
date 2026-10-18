import { forwardRef } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from '@/theme';

export interface InlineLinkProps {
  label: string;
  onPress?: () => void;
  className?: string;
}

export const InlineLink = forwardRef<View, InlineLinkProps>(
  ({ label, onPress, className }, ref) => {
    const { colors } = useTheme();
    return (
      <Pressable
        ref={ref}
        accessibilityRole="link"
        hitSlop={6}
        onPress={onPress}
        className={className}
      >
        <Text
          variant="caption"
          className="font-sans-bold underline"
          style={{ color: colors.brand }}
        >
          {label}
        </Text>
      </Pressable>
    );
  },
);

InlineLink.displayName = 'InlineLink';
