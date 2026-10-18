import { forwardRef, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = forwardRef<View, CheckboxProps>(
  ({ checked, onChange, label, children, disabled, className }, ref) => {
    const { colors } = useTheme();

    return (
      <Pressable
        ref={ref}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        onPress={() => onChange(!checked)}
        className={cn('flex-row items-center gap-2', disabled && 'opacity-50', className)}
      >
        <View
          className="h-4 w-4 items-center justify-center rounded-sm"
          style={{
            backgroundColor: checked ? colors.brand : 'transparent',
            borderWidth: 1,
            borderColor: colors.borderStrong,
          }}
        >
          {checked ? <Check size={11} color={colors.textInverse} strokeWidth={3} /> : null}
        </View>
        {label ? <Text variant="caption">{label}</Text> : null}
        {children}
      </Pressable>
    );
  },
);

Checkbox.displayName = 'Checkbox';
