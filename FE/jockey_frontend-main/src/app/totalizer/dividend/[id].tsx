import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { AppBar, Card, Screen, Text } from '@/components/ui';
import { usePoolDividend } from '@/lib/api';
import { formatPeso } from '@/lib/format';
import { useTheme } from '@/theme';

function KeyValueRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-center justify-between py-3.5"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <Text variant="micro" tone="secondary" className="tracking-wide">
        {label}
      </Text>
      <Text variant="label" className="font-display" style={{ color: colors.brand }}>
        {value}
      </Text>
    </View>
  );
}

export default function PoolDividendScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pool, isLoading } = usePoolDividend(id);

  if (isLoading || !pool) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar title="Pool & Dividend" />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <Text variant="caption" tone="accent" className="tracking-wide">
            {pool.raceLabel}
          </Text>
          <Text variant="displayLg" className="pt-1 text-center">
            {pool.market.replace(/_/g, ' ')}
          </Text>
          <Text variant="caption" tone="secondary" className="pt-1 text-center">
            Sample pari-mutuel pool snapshot
          </Text>
        </View>

        <Card className="px-3.5 py-0">
          <KeyValueRow label="TOTAL SAMPLE POOL" value={formatPeso(pool.totalPool)} />
          <KeyValueRow label="SAMPLE SALES" value={`${pool.salesUnits.toLocaleString()} units`} />
          <KeyValueRow
            label="WINNING UNITS"
            value={`${pool.winningUnits.toLocaleString()} units`}
          />
          <KeyValueRow
            label="ILLUSTRATIVE DIVIDEND"
            value={`${formatPeso(pool.dividendPerUnit)} / ${formatPeso(pool.perUnit).replace('.00', '')}`}
            last
          />
        </Card>

        <View>
          <Text variant="title">Pool distribution</Text>
          <View className="gap-3 pt-3">
            {pool.distribution.map((item) => (
              <View key={item.label}>
                <View className="flex-row items-center justify-between">
                  <Text variant="caption" className="font-sans-bold">
                    {item.label}
                  </Text>
                  <Text variant="micro" tone="secondary">
                    {item.percent}%
                  </Text>
                </View>
                <View
                  className="mt-1 h-2 overflow-hidden rounded-[5px]"
                  style={{ backgroundColor: colors.border }}
                >
                  <View
                    className="h-2 rounded-[5px]"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
