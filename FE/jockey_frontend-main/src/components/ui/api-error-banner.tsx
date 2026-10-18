import { Pressable, View } from 'react-native';

import { useApiErrorNotice } from '@/lib/api/error-notice';
import { useTheme } from '@/theme';
import { Text } from './text';

export function ApiErrorBanner() {
  const message = useApiErrorNotice((state) => state.message);
  const dismiss = useApiErrorNotice((state) => state.dismiss);
  const { colors } = useTheme();

  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      className="absolute left-3 right-3 top-3 z-50 flex-row items-start gap-3 rounded-2xl border p-4 shadow-lg"
      style={{ backgroundColor: colors.surface, borderColor: colors.dangerSoft }}
    >
      <View className="flex-1 gap-1">
        <Text variant="label" style={{ color: colors.danger }}>Unable to load data</Text>
        <Text accessibilityLiveRegion="polite" variant="body">{message}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss error" onPress={dismiss} hitSlop={10}>
        <Text variant="label" style={{ color: colors.brand }}>Dismiss</Text>
      </Pressable>
    </View>
  );
}
