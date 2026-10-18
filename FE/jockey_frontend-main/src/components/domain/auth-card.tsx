import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LogoBadge } from '@/components/ui/logo';
import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export function AuthCard({
  mode,
  children,
}: {
  mode: 'login' | 'register';
  children: ReactNode;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const register = mode === 'register';

  return (
    <Screen style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={['#103B2F', '#0d4638']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42%' }}
      />
      <View
        style={{
          position: 'absolute',
          top: '31%',
          left: '-15%',
          width: '130%',
          height: 110,
          backgroundColor: colors.background,
          transform: [{ rotate: '-7deg' }],
        }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
        >
        <View
          className="self-center rounded-[22px] bg-white"
          style={{
            width: '100%',
            maxWidth: 420,
            padding: 28,
            shadowColor: '#103B2F',
            shadowOpacity: 0.1,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 12 },
            elevation: 6,
          }}
        >
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Philippine Jockey home"
            onPress={() => router.replace('/')}
            className="self-start flex-row items-center gap-2.5"
          >
            <LogoBadge size={38} tone="accent" />
            <View>
              <Text style={{ color: '#C6A15B', fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>
                PHILIPPINE
              </Text>
              <Text style={{ color: colors.brand, fontSize: 22, lineHeight: 24, letterSpacing: 1 }}>
                JOCKEY
              </Text>
            </View>
          </Pressable>

          <Text
            variant="displayLg"
            style={{ color: '#18181b', fontSize: 40, lineHeight: 46, marginTop: 27 }}
          >
            {register ? 'Join the club.' : 'Welcome back.'}
          </Text>
          <Text style={{ color: '#71717a', fontSize: 14, lineHeight: 22, marginTop: 7 }}>
            {register
              ? 'Create your account to follow every race day.'
              : 'Sign in to pick up where race day left off.'}
          </Text>

          <View className="mt-5 gap-3.5">{children}</View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
