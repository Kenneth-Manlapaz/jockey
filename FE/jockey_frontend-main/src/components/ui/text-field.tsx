import { forwardRef, type ReactNode } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  rightAccessory?: ReactNode;
  containerClassName?: string;
  className?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, rightAccessory, containerClassName, className, style, ...props }, ref) => {
    const { colors } = useTheme();

    return (
      <View className={cn('w-full', containerClassName)}>
        {label ? (
          <Text variant="labelSm" className="mb-1.5">
            {label}
          </Text>
        ) : null}
        <View
          className="h-12 flex-row items-center rounded-xl border px-3"
          style={{
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.borderStrong,
          }}
        >
          <TextInput
            ref={ref}
            className={cn('flex-1 font-sans text-xs', className)}
            style={[{ color: colors.textPrimary, paddingVertical: 0 }, style]}
            placeholderTextColor={colors.textMuted}
            {...props}
          />
          {rightAccessory}
        </View>
        {error ? (
          <Text variant="micro" tone="accent" style={{ color: colors.danger }} className="mt-1">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';
