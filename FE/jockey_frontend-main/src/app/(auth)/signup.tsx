import { useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { AuthCard } from '@/components/domain/auth-card';
import { Button, Checkbox, PasswordField, Text, TextField } from '@/components/ui';
import { useSessionStore } from '@/lib/auth/session';
import { getAuthErrorMessage } from '@/lib/auth/error-message';
import { signupSchema, type SignupValues } from '@/lib/validation/auth';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useSessionStore();
  const [error, setError] = useState('');
  const { control, handleSubmit } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', agree: false },
  });

  const onSubmit = async (values: SignupValues) => {
    setError('');
    const [firstName, ...lastParts] = values.fullName.trim().split(/\s+/);
    try {
      await signUp({
        firstName,
        lastName: lastParts.join(' ') || firstName,
        email: values.email,
        mobile: '',
        password: values.password,
      });
      router.replace('/');
    } catch (cause) {
      setError(getAuthErrorMessage(cause, 'register'));
    }
  };

  return (
    <AuthCard mode="register">
      {error ? <AuthError message={error} /> : null}
      <Controller
        control={control}
        name="fullName"
        render={({ field, fieldState }) => (
          <TextField
            label="Full name"
            placeholder="Your name"
            autoComplete="name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            style={{ fontSize: 14 }}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="Email address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            style={{ fontSize: 14 }}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <PasswordField
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            style={{ fontSize: 14 }}
          />
        )}
      />
      <Controller
        control={control}
        name="agree"
        render={({ field, fieldState }) => (
          <ViewTerms
            checked={!!field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Button
        label="Create account"
        variant="accent"
        loading={loading}
        onPress={() => handleSubmit(onSubmit)()}
        className="mt-1 rounded-xl"
      />
      <Text style={{ color: '#71717a', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 2 }}>
        Already a member?{' '}
        <Text
          accessibilityRole="link"
          onPress={() => router.push('/login')}
          style={{ color: '#0f766e', fontWeight: '700' }}
        >
          Sign in
        </Text>
      </Text>
    </AuthCard>
  );
}

function ViewTerms({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  error?: string;
}) {
  return (
    <View>
      <Checkbox checked={checked} onChange={onChange}>
        <Text style={{ color: '#71717a', fontSize: 11, lineHeight: 16, flexShrink: 1 }}>
          I accept the account terms for this demo.
        </Text>
      </Checkbox>
      {error ? <Text style={{ color: '#b91c1c', fontSize: 11, marginTop: 5 }}>{error}</Text> : null}
    </View>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <Text
      accessibilityRole="alert"
      style={{ color: '#991b1b', backgroundColor: '#fff7f7', borderColor: '#fecaca', borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18 }}
    >
      {message}
    </Text>
  );
}
