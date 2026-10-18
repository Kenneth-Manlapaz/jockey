import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { api, getApiErrorMessage } from '@/lib/api';
import { useTheme } from '@/theme';

type RecordValue = Record<string, unknown>;

function recordsOf(value: unknown): RecordValue[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is RecordValue => typeof row === 'object' && row !== null);
  }
  if (typeof value === 'object' && value !== null) {
    const root = value as RecordValue;
    for (const key of ['results', 'favorites']) {
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

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [items, setItems] = useState<RecordValue[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getFavorites()
      .then((payload) => { if (active) setItems(recordsOf(payload)); })
      .catch((cause: unknown) => {
        if (active) setError(getApiErrorMessage(cause, 'Could not load favorites.'));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <Screen>
      <AppBar title="Favorites" fallbackHref="/profile" />
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Heart size={24} color={colors.brand} />
          <Text variant="labelSm" className="pt-3 text-center">Sign in to view favorites</Text>
          <Text variant="caption" tone="secondary" className="pt-2 text-center">{error}</Text>
          <Button label="Sign in" className="mt-4" onPress={() => router.push('/login')} />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Heart size={24} color={colors.brand} />
          <Text variant="labelSm" className="pt-3">No saved favorites</Text>
          <Text variant="caption" tone="secondary" className="pt-2 text-center">Favorites from your account will show here.</Text>
          <Button label="Explore races" className="mt-4" onPress={() => router.push('/races')} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
          {items.map((record, index) => {
            const entity = (record.horse ?? record.jockey ?? record.entry ?? record.target ?? record.object ?? record) as RecordValue;
            const kind = firstText(record, ['type', 'favorite_type', 'content_type']) || (record.horse ? 'horse' : record.jockey ? 'jockey' : 'favorite');
            const name = firstText(entity, ['full_name', 'name', 'horse_name', 'display_name']) || `Saved ${kind} ${index + 1}`;
            return (
              <Card key={String(record.id ?? index)} className="flex-row items-center gap-3 p-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accentFaint }}>
                  <Heart size={16} color={colors.brand} />
                </View>
                <View className="flex-1">
                  <Text variant="labelSm">{name}</Text>
                  <Text variant="micro" tone="secondary">Favorite {kind}</Text>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
