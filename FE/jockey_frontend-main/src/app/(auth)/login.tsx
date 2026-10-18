import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { AuthCard } from '@/components/domain/auth-card';
import { Button, PasswordField, Text, TextField } from '@/components/ui';
import { useSessionStore } from '@/lib/auth/session';
import { getAuthErrorMessage } from '@/lib/auth/error-message';
import { loginSchema, type LoginValues } from '@/lib/validation/auth';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useSessionStore((state) => state.signIn);
  const loading = useSessionStore((state) => state.loading);
  const [error, setError] = useState('');
  const { control, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onSubmit = async (values: LoginValues) => {
    setError('');
    try {
      await signIn({ email: values.email, password: values.password });
      router.replace('/');
    } catch (cause) {
      setError(getAuthErrorMessage(cause, 'login'));
    }
  };

  return (
    <AuthCard mode="login">
      {error ? (
        <ViewError message={error} />
      ) : null}
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
            autoComplete="current-password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            style={{ fontSize: 14 }}
          />
        )}
      />
      <Button
        label="Sign in"
        variant="accent"
        loading={loading}
        onPress={() => handleSubmit(onSubmit)()}
        className="mt-1 rounded-xl"
      />
      <Text style={{ color: '#71717a', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 2 }}>
        New to Philippine Jockey?{' '}
        <Text
          accessibilityRole="link"
          onPress={() => router.push('/signup')}
          style={{ color: '#0f766e', fontWeight: '700' }}
        >
          Create an account
        </Text>
      </Text>
    </AuthCard>
  );
}

function ViewError({ message }: { message: string }) {
  return (
    <Text
      accessibilityRole="alert"
      style={{ color: '#991b1b', backgroundColor: '#fff7f7', borderColor: '#fecaca', borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18 }}
    >
      {message}
    </Text>
  );
}
