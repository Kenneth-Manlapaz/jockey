import '@/global.css';

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts as useDMSans,
} from '@expo-google-fonts/dm-sans';
import {
  LibreCaslonDisplay_400Regular,
  useFonts as useLibre,
} from '@expo-google-fonts/libre-caslon-display';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palette } from '@/theme';
import { ApiErrorBanner } from '@/components/ui/api-error-banner';
import { useApiErrorNotice } from '@/lib/api/error-notice';
import { getApiErrorMessage } from '@/lib/api/errors';

export const unstable_settings = {
  initialRouteName: 'splash',
};

SplashScreen.preventAutoHideAsync();

const reportQueryError = (error: Error) => {
  useApiErrorNotice.getState().show(getApiErrorMessage(error));
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportQueryError }),
  mutationCache: new MutationCache({ onError: reportQueryError }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [sansLoaded] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [displayLoaded] = useLibre({ LibreCaslonDisplay_400Regular });

  const fontsLoaded = sansLoaded && displayLoaded;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== 'web') SystemUI.setBackgroundColorAsync(palette.stone100);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={DefaultTheme}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.stone100 },
              }}
            >
              <Stack.Screen name="splash" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="selection/[id]" />
              <Stack.Screen name="bet-cart" />
              <Stack.Screen name="withdraw" />
              <Stack.Screen name="review" options={{ presentation: 'modal' }} />
              <Stack.Screen name="bet-complete" options={{ gestureEnabled: false }} />
              <Stack.Screen name="ticket/[id]" />
              <Stack.Screen name="games" />
              <Stack.Screen name="games/[id]" />
              <Stack.Screen name="live/updates" />
              <Stack.Screen name="live/stream" />
              <Stack.Screen name="race/[id]" />
              <Stack.Screen name="race/[id]/entries" />
              <Stack.Screen name="race/[id]/bet" />
              <Stack.Screen name="racing-guide" />
              <Stack.Screen name="jockeyph-guide" />
              <Stack.Screen name="horse/[id]" />
              <Stack.Screen name="horse/[id]/statistics" />
              <Stack.Screen name="jockey/[id]" />
              <Stack.Screen name="jockey/[id]/statistics" />
              <Stack.Screen name="club/[slug]" />
              <Stack.Screen name="rewards" />
              <Stack.Screen name="contender" />
              <Stack.Screen name="totalizer/dividend/[id]" />
            </Stack>
            <ApiErrorBanner />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
