import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { api, getApiErrorMessage } from '@/lib/api';
import { useTheme } from '@/theme';
import { useBetWinNotificationsStore } from '@/lib/notifications/bet-wins';

type RecordValue = Record<string, unknown>;

function recordsOf(value: unknown): RecordValue[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is RecordValue => typeof row === 'object' && row !== null);
  }
  if (typeof value === 'object' && value !== null) {
    const root = value as RecordValue;
    for (const key of ['results', 'notifications']) {
      if (Array.isArray(root[key])) {
        return (root[key] as unknown[]).filter(
          (row): row is RecordValue => typeof row === 'object' && row !== null,
        );
      }
    }
  }
  return [];
}

function firstText(record: RecordValue, keys: string[]) {
  for (const key of keys) {
    if (typeof record[key] === 'string' && record[key]) return record[key] as string;
  }
  return '';
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const betWinNotifications = useBetWinNotificationsStore((state) => state.notifications);
  const markBetWinsRead = useBetWinNotificationsStore((state) => state.markAllRead);
  const [payload, setPayload] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const reload = useCallback(async () => {
    try {
      setPayload(await api.getNotifications());
      setError('');
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => { void reload(); }, 0);
    return () => clearTimeout(task);
  }, [reload]);

  const markRead = async () => {
    setMarking(true);
    markBetWinsRead();
    try {
      await api.markAllNotificationsRead();
      await reload();
    } catch (cause) {
      // Local demo win alerts remain readable even when the notification API is unavailable.
      if (!betWinNotifications.length) setError(getApiErrorMessage(cause, 'Could not update notifications.'));
    } finally {
      setMarking(false);
    }
  };

  const rows = [...betWinNotifications, ...recordsOf(payload)];
  const remoteUnread = typeof payload === 'object' && payload !== null && 'unread_count' in payload
    ? Number((payload as RecordValue).unread_count)
    : recordsOf(payload).filter((row) => row.is_read === false || row.read === false).length;
  const unread = remoteUnread + betWinNotifications.filter((notification) => !notification.is_read).length;

  return (
    <Screen>
      <AppBar title="Notifications" fallbackHref="/profile" />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View>
      ) : error && !betWinNotifications.length ? (
        <View className="flex-1 items-center justify-center px-8">
          <Bell size={24} color={colors.brand} />
          <Text variant="labelSm" className="pt-3 text-center">Sign in to view notifications</Text>
          <Text variant="caption" tone="secondary" className="pt-2 text-center">{error}</Text>
          <Button label="Sign in" className="mt-4" onPress={() => router.push('/login')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between px-1 pb-1">
            <Text variant="caption" tone="secondary">{unread} unread</Text>
            <Pressable disabled={!unread || marking} accessibilityRole="button" onPress={() => void markRead()}>
              <Text style={{ color: unread && !marking ? colors.brand : colors.textInactive, fontSize: 12, fontWeight: '700' }}>
                {marking ? 'Updating…' : 'Mark all read'}
              </Text>
            </Pressable>
          </View>
          {rows.length ? rows.map((row, index) => (
            <Pressable key={String(row.id ?? index)} accessibilityRole={typeof row.deep_link === 'string' || typeof row.href === 'string' ? 'button' : undefined} onPress={() => {
              const destination = firstText(row, ['deep_link', 'href']);
              if (destination.startsWith('/')) router.push(destination as never);
            }}>
              <Card className="flex-row items-center gap-3 p-3.5">
                <Bell size={17} color={colors.brand} />
                <View className="flex-1">
                  <Text variant="labelSm">{firstText(row, ['title', 'message', 'text']) || 'Race day update'}</Text>
                  {firstText(row, ['body']) ? <Text variant="caption" tone="secondary" className="pt-1">{firstText(row, ['body'])}</Text> : null}
                  <Text variant="micro" tone="secondary" className="pt-1">{firstText(row, ['created_at', 'timestamp', 'date'])}</Text>
                </View>
              </Card>
            </Pressable>
          )) : (
            <View className="items-center px-6 py-12">
              <Bell size={24} color={colors.brand} />
              <Text variant="labelSm" className="pt-3">You’re all caught up</Text>
              <Text variant="caption" tone="secondary" className="pt-2 text-center">There are no unread notifications.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
