import { forwardRef, useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { TextField, type TextFieldProps } from './text-field';
import { useTheme } from '@/theme';

export type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'rightAccessory'>;

/** Text field with a visibility toggle. */
export const PasswordField = forwardRef<TextInput, PasswordFieldProps>((props, ref) => {
  const [hidden, setHidden] = useState(true);
  const { colors } = useTheme();

  return (
    <TextField
      ref={ref}
      secureTextEntry={hidden}
      autoCapitalize="none"
      autoCorrect={false}
      rightAccessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          hitSlop={10}
          onPress={() => setHidden((h) => !h)}
        >
          {hidden ? (
            <EyeOff size={20} color={colors.textMuted} />
          ) : (
            <Eye size={20} color={colors.textMuted} />
          )}
        </Pressable>
      }
      {...props}
    />
  );
});

PasswordField.displayName = 'PasswordField';
