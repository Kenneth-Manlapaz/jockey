import { forwardRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3',
  md: 'h-11 px-4',
  lg: 'h-14 px-6',
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      label,
      variant = 'primary',
      size = 'md',
      leadingIcon,
      trailingIcon,
      loading = false,
      fullWidth = true,
      disabled,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const isDisabled = disabled || loading;

    const surface: Record<ButtonVariant, { bg: string; border: string; label: string }> = {
      primary: { bg: colors.brand, border: 'transparent', label: colors.textInverse },
      accent: { bg: colors.accent, border: 'transparent', label: colors.brand },
      secondary: { bg: 'transparent', border: colors.borderStrong, label: colors.brand },
      destructive: { bg: colors.surface, border: colors.dangerSoft, label: colors.danger },
      ghost: { bg: 'transparent', border: 'transparent', label: colors.textPrimary },
    };

    const s = surface[variant];

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        className={cn(
          'flex-row items-center justify-center gap-2.5 rounded-xl border active:opacity-80',
          sizeClass[size],
          fullWidth && 'self-stretch',
          isDisabled && 'opacity-50',
          className,
        )}
        style={[
          { backgroundColor: s.bg, borderColor: s.border },
          typeof style === 'function' ? undefined : style,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={s.label} size="small" />
        ) : (
          <>
            {leadingIcon}
            <Text variant="label" style={{ color: s.label }} className="text-center">
              {label}
            </Text>
            {trailingIcon}
          </>
        )}
      </Pressable>
    );
  },
);

Button.displayName = 'Button';
