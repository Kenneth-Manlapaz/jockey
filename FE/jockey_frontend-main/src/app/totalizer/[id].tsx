import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppBar, Card, Screen, Text } from '@/components/ui';
import { usePoolOverview } from '@/lib/api';
import { formatPeso } from '@/lib/format';
import { useTheme } from '@/theme';

export default function TotalizerOverviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading } = usePoolOverview();

  if (isLoading || !data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar title="Totalizer" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-teal-950 px-5 pb-14 pt-5">
          <Text variant="eyebrow" tone="accent">
            PARI-MUTUEL INFORMATION
          </Text>
          <Text variant="display" className="pt-1.5 text-2xl" style={{ color: colors.textInverse }}>
            {data.raceLabel}
          </Text>
          <Text variant="micro" tone="inactive" className="pt-1.5">
            {data.venue} · {data.postTime}
          </Text>
        </View>

        <View className="-mt-8 gap-4 px-5">
          <View className="rounded-2xl p-4" style={{ backgroundColor: colors.accent }}>
            <Text
              variant="micro"
              className="font-sans-bold tracking-wide"
              style={{ color: colors.brand }}
            >
              TOTAL POOL SALES
            </Text>
            <Text variant="display" className="pt-1 text-2xl" style={{ color: colors.brand }}>
              {formatPeso(data.poolSales)}
            </Text>
            <Text variant="micro" className="pt-0.5" style={{ color: colors.brand }}>
              Across {data.pools.length} pools
            </Text>
          </View>

          <Text variant="title">Available pools</Text>

          <View className="gap-2.5">
            {data.pools.map((pool, index) => (
              <Card
                key={pool.id}
                className="p-0"
                onTouchEnd={() => router.push(`/totalizer/pool/${pool.id}`)}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/totalizer/pool/${pool.id}`)}
                  className="p-3 active:opacity-80"
                >
                  <View className="flex-row items-center gap-1.5">
                    <View
                      className="h-7 w-7 items-center justify-center rounded-md"
                      style={{ backgroundColor: colors.brand }}
                    >
                      <Text variant="labelSm" style={{ color: colors.accentSoft }}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text variant="label" className="font-display">
                      {pool.market}
                    </Text>
                  </View>

                  <Text variant="micro" tone="secondary" className="pt-2.5">
                    POOL
                  </Text>
                  <Text
                    variant="display"
                    className="pt-0.5 text-lg"
                    style={{ color: colors.brand }}
                  >
                    {formatPeso(pool.totalPool)}
                  </Text>

                  <View
                    className="mt-2 flex-row items-center justify-between border-t pt-2"
                    style={{ borderTopColor: colors.border }}
                  >
                    <View>
                      <Text variant="micro" tone="secondary">
                        Est. dividend
                      </Text>
                      <Text
                        variant="micro"
                        className="font-sans-bold"
                        style={{ color: colors.brand }}
                      >
                        {formatPeso(pool.estimatedDividend)} / {formatPeso(pool.perUnit)}
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </View>
                </Pressable>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
