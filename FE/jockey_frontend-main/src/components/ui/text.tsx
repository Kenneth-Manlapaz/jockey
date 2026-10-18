import { forwardRef } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export type TextVariant =
  | 'displayXl'
  | 'displayLg'
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'labelSm'
  | 'eyebrow'
  | 'micro'
  | 'caption';

export type TextTone =
  'primary' | 'secondary' | 'muted' | 'inactive' | 'inverse' | 'accent' | 'accentSoft' | 'brand';

const variantClass: Record<TextVariant, string> = {
  displayXl: 'font-display text-4xl leading-[44px]',
  displayLg: 'font-display text-[30px] leading-9',
  display: 'font-display text-2xl leading-none',
  title: 'font-display text-xl leading-8',
  heading: 'font-sans-bold text-base leading-6',
  body: 'font-sans text-xs leading-5',
  bodySm: 'font-sans text-[10px] leading-4',
  label: 'font-sans-bold text-sm leading-5',
  labelSm: 'font-sans-bold text-xs leading-4',
  eyebrow: 'font-sans-bold text-[10px] leading-4 tracking-widest',
  micro: 'font-sans text-[8px] leading-3',
  caption: 'font-sans text-[9px] leading-3',
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
}

export const Text = forwardRef<RNText, TextProps>(
  ({ variant = 'body', tone = 'primary', className, style, ...props }, ref) => {
    const { colors } = useTheme();

    const toneColor: Record<TextTone, string> = {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      muted: colors.textMuted,
      inactive: colors.textInactive,
      inverse: colors.textInverse,
      accent: colors.accent,
      accentSoft: colors.accentSoft,
      brand: colors.brand,
    };

    return (
      <RNText
        ref={ref}
        className={cn(variantClass[variant], className)}
        style={[{ color: toneColor[tone] }, style]}
        {...props}
      />
    );
  },
);

Text.displayName = 'Text';
