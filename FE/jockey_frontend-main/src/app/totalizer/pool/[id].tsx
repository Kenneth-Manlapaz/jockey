import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { usePool } from '@/lib/api';
import { formatPeso } from '@/lib/format';
import { poolTones, useTheme } from '@/theme';

function KeyValueRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      className="flex-row items-center justify-between border-b py-2.5"
      style={{ borderBottomColor: colors.border }}
    >
      <Text variant="micro" tone="secondary">
        {label}
      </Text>
      <Text
        variant="micro"
        className="font-sans-bold"
        style={highlight ? { color: colors.brand } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}

function DividendPill({ label, settled }: { label: string; settled?: boolean }) {
  const tone = settled ? poolTones.estimate : poolTones.notSettled;
  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-[20px] px-2 py-1"
      style={{ backgroundColor: tone.background }}
    >
      <View className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: tone.dot }} />
      <Text
        variant="micro"
        className="font-sans-bold uppercase tracking-wide"
        style={{ color: tone.text }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function PoolDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pool, isLoading } = usePool(id);

  if (isLoading || !pool) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar title="Totalizer Details" />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: colors.brand }}
          >
            <Text variant="display" className="text-xl" style={{ color: colors.accentSoft }}>
              1
            </Text>
          </View>
          <View>
            <Text variant="micro" tone="secondary" className="tracking-wide">
              SELECTED POOL
            </Text>
            <Text variant="display" className="text-2xl">
              {pool.market}
            </Text>
            <Text variant="micro" tone="secondary">
              {pool.raceLabel}
            </Text>
          </View>
        </View>

        <Card className="px-3 py-1">
          <KeyValueRow label="Total pool" value={formatPeso(pool.totalPool)} />
          <KeyValueRow label="Total sales" value={`${pool.totalSales.toLocaleString()} units`} />
          <KeyValueRow label="Refunds" value={formatPeso(pool.refunds)} />
          <KeyValueRow label="Deductions" value={formatPeso(pool.deductions)} />
          <View className="flex-row items-center justify-between py-2.5">
            <Text variant="micro" tone="secondary">
              Distributable pool
            </Text>
            <Text variant="micro" className="font-sans-bold" style={{ color: colors.brand }}>
              {formatPeso(pool.distributable)}
            </Text>
          </View>
        </Card>

        <View className="gap-3">
          <Card className="p-3">
            <Text variant="micro" tone="secondary" className="tracking-wide">
              ESTIMATED DIVIDEND
            </Text>
            <Text variant="display" className="pt-1 text-xl" style={{ color: colors.brand }}>
              {formatPeso(pool.estimatedDividend)}
            </Text>
            <Text variant="micro" tone="secondary" className="pb-2 pt-1">
              per {formatPeso(pool.perUnit)} unit
            </Text>
            <DividendPill label="Estimate" settled />
          </Card>
          <Card className="p-3">
            <Text variant="micro" tone="secondary" className="tracking-wide">
              FINAL DIVIDEND
            </Text>
            <Text variant="display" className="pt-1 text-xl" style={{ color: colors.brand }}>
              —
            </Text>
            <Text variant="micro" tone="secondary" className="pb-2 pt-1">
              Available after settlement
            </Text>
            <DividendPill label="Not settled" />
          </Card>
        </View>

        <View>
          <Text variant="title">Pool breakdown</Text>
          <Card className="mt-2.5 p-3.5">
            <View className="h-3.5 flex-row overflow-hidden rounded-md">
              {pool.breakdown.map((item) => (
                <View
                  key={item.label}
                  style={{ flex: item.percent, backgroundColor: item.color }}
                />
              ))}
            </View>
            <View className="gap-1.5 pt-3">
              {pool.breakdown.map((item) => (
                <View key={item.label} className="flex-row items-center gap-1.5">
                  <View
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text variant="micro">{item.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <Button
          label="View estimated pool demonstration"
          variant="secondary"
          onPress={() => router.push(`/totalizer/dividend/${pool.id}`)}
        />
      </ScrollView>
    </Screen>
  );
}
