import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Gift } from 'lucide-react-native';

import { AppBar, Button, Card, Screen, Text } from '@/components/ui';
import { useRewards } from '@/lib/api';
import { useTheme } from '@/theme';

export default function RewardsScreen() {
  const { colors } = useTheme();
  const { data, isLoading } = useRewards();
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());
  const points = data?.points ?? 0;

  return (
    <Screen>
      <View style={{ backgroundColor: colors.brand }}>
        <AppBar title="Rewards" variant="dark" />
        <View className="px-5 pb-6 pt-2">
          <Text variant="eyebrow" style={{ color: colors.accent }}>
            DEMO REWARDS
          </Text>
          <Text variant="displayLg" className="pt-2" style={{ color: colors.textInverse }}>
            {points.toLocaleString()} points
          </Text>
          <Text variant="caption" className="pt-2" style={{ color: colors.textMuted }}>
            Earn points as you play. Illustrative only — nothing here is redeemable.
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {data?.rewards.map((reward) => {
            const isRedeemed = redeemed.has(reward.id);
            const affordable = points >= reward.pointsCost && !isRedeemed;
            return (
              <Card key={reward.id} className="p-4">
                <View className="flex-row items-start gap-3">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.accentFaint }}
                  >
                    <Gift size={18} color={colors.brand} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text variant="labelSm" className="tracking-wide">
                        {reward.title}
                      </Text>
                      {reward.tag ? (
                        <View
                          className="rounded-full px-2 py-0.5"
                          style={{ backgroundColor: colors.accent }}
                        >
                          <Text
                            variant="micro"
                            className="font-sans-bold"
                            style={{ color: colors.brand }}
                          >
                            {reward.tag.toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text variant="caption" tone="secondary" className="pt-1">
                      {reward.description}
                    </Text>
                    <Text
                      variant="micro"
                      className="pt-1.5 font-sans-bold"
                      style={{ color: colors.brand }}
                    >
                      {reward.pointsCost.toLocaleString()} points
                    </Text>
                  </View>
                </View>
                <Button
                  label={
                    isRedeemed ? 'Redeemed (demo)' : affordable ? 'Redeem' : 'Not enough points'
                  }
                  variant={affordable ? 'primary' : 'secondary'}
                  size="sm"
                  disabled={!affordable}
                  className="mt-3"
                  onPress={() => setRedeemed((prev) => new Set(prev).add(reward.id))}
                />
              </Card>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
