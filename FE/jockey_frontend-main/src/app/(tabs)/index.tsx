import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Ticket } from 'lucide-react-native';

import { LiveHeroCard } from '@/components/domain/live-hero-card';
import { PromoCard } from '@/components/domain/promo-card';
import { RaceCard } from '@/components/domain/race-card';
import { ResultRow } from '@/components/domain/result-row';
import { UtilityLinkCard } from '@/components/domain/utility-link-card';
import { Avatar, Card, Media, Screen, SectionHeader, Text } from '@/components/ui';
import { useHome } from '@/lib/api';
import { useAuthUser } from '@/lib/auth/session';
import { useTheme } from '@/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading } = useHome();
  const user = useAuthUser();

  if (isLoading || !data) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.brand} />
      </Screen>
    );
  }

  return (
    <Screen edgeToEdgeTop>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-teal-950 px-5 pb-16" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text
                variant="micro"
                className="font-sans tracking-wider"
                style={{ color: colors.accentSoft }}
              >
                {data.dateLabel}
              </Text>
              <Text variant="displayLg" className="pt-2" style={{ color: colors.textInverse }}>
                Good afternoon,{' '}
                <Text variant="displayLg" style={{ color: colors.accentSoft }}>
                  {user?.firstName ?? data.greetingName}
                </Text>
              </Text>
            </View>
            <View className="flex-row items-center gap-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => router.push('/notifications')}
                className="h-[38px] w-[38px] items-center justify-center rounded-xl border border-white/25 bg-white/10"
              >
                <Bell size={18} color={colors.textInverse} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile"
                onPress={() => router.push('/profile')}
              >
                <Avatar initials={user?.initials ?? 'IS'} size={40} presence={false} />
              </Pressable>
            </View>
          </View>
        </View>

        <View className="-mt-12 px-5">
          <LiveHeroCard
            race={data.liveRace}
            series={data.liveSeries}
            onWatch={() => router.push('/live')}
          />
        </View>

        <View className="px-5 pt-6">
          <SectionHeader
            title="Today's races"
            actionLabel="View schedule"
            onAction={() => router.push('/races')}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, gap: 10 }}
        >
          {data.todayRaces.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              size="compact"
              onPress={() => router.push(`/race/${race.id}`)}
            />
          ))}
        </ScrollView>

        <View className="px-5 pt-6">
          <PromoCard promo={data.promo} onPress={() => router.push('/games')} />
        </View>

        <View className="px-5 pt-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open My Bets"
            onPress={() => router.push('/betting-history')}
          >
            <Card className="flex-row items-center gap-3 p-4">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-teal-950">
                <Ticket size={20} color={colors.accentSoft} />
              </View>
              <View className="flex-1">
                <Text variant="labelSm">My Bets</Text>
                <Text variant="caption" tone="secondary">View your tickets and bet status</Text>
              </View>
              <Text variant="labelSm" tone="accent">›</Text>
            </Card>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-2.5 px-5 pt-4">
          {data.quickLinks.map((link) => {
            const isGuideShortcut = link.icon === 'totalizer';
            const displayLink = isGuideShortcut
              ? { ...link, icon: 'guide' as const, label: 'JockeyPH Guide', sublabel: 'Race sheet and system tips' }
              : link;

            return (
              <UtilityLinkCard
                key={link.id}
                className="w-[48.5%]"
                link={displayLink}
                onPress={() => router.push(isGuideShortcut ? '/jockeyph-guide' : '/games')}
              />
            );
          })}
        </View>

        <View className="px-5 pt-6">
          <SectionHeader
            title="Latest results"
            actionLabel="See all"
            onAction={() => router.push('/results')}
          />
          <View className="gap-2.5 pt-2.5">
            {data.latestResults.map((result) => (
              <ResultRow
                key={result.id}
                result={result}
                onPress={() => router.push(`/result/${result.id}`)}
              />
            ))}
          </View>
        </View>

        <View className="px-5 pt-6">
          <SectionHeader title="Featured contenders" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, gap: 10 }}
        >
          {data.featured.map((item) => (
            <Card key={item.id} className="w-40 overflow-hidden" bordered={false}>
              <Media src={item.image} style={{ height: 80, width: '100%' }} />
              <View className="p-2">
                <Text variant="micro" tone="accent" className="font-sans tracking-wide">
                  FEATURED {item.kind.toUpperCase()}
                </Text>
                <Text variant="bodySm" className="pt-1 font-sans-bold">
                  {item.name}
                </Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      </ScrollView>
    </Screen>
  );
}
