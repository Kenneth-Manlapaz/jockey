import { useRouter } from 'expo-router';
import { ArrowRight, BookOpen, CalendarDays, CircleAlert, Flag, MapPin, Star, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { AppBar, Card, Screen, Text } from '@/components/ui';
import { useJockeyPHGuide } from '@/lib/api';
import { generateRaceTips } from '@/lib/race-guide-tips';
import { useTheme } from '@/theme';

export default function JockeyPHGuideScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data, isLoading } = useJockeyPHGuide();
  const [favorites, setFavorites] = useState<string[]>([]);

  if (isLoading || !data) {
    return <Screen><AppBar title="JockeyPH Guide" fallbackHref="/(tabs)" /><View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.brand} /></View></Screen>;
  }

  const race = data.sampleRaces[0];
  const systemTips = generateRaceTips(race);

  return (
    <Screen>
      <AppBar
        title="JockeyPH Guide"
        fallbackHref="/(tabs)"
        right={(
          <Pressable accessibilityRole="button" accessibilityLabel="Learn how to read the race program" onPress={() => router.push('/racing-guide')} className="flex-row items-center gap-1 rounded-full px-2 py-2">
            <BookOpen size={15} color={colors.info} />
            <Text variant="micro" className="font-sans-bold" style={{ color: colors.info }}>Learn to read</Text>
          </Pressable>
        )}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View className="mb-4 overflow-hidden rounded-2xl bg-teal-950 p-5">
          <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accent }}><BookOpen size={19} color={colors.brand} /></View>
          <Text variant="eyebrow" className="pt-4" style={{ color: colors.accent }}>RACE-DAY REFERENCE</Text>
          <Text variant="displayLg" className="pt-1" style={{ color: colors.textInverse }}>Understanding the race program</Text>
          <Text variant="body" className="pt-2" style={{ color: colors.textInverse }}>A printed Philippine horse-racing program with race schedules, runners, jockeys, handicapping details, and betting pools.</Text>
          <View className="mt-4 flex-row items-center gap-2"><CalendarDays size={14} color={colors.accentIcon} /><Text variant="caption" style={{ color: colors.accentSoft }}>Historical example · {data.dateLabel}</Text></View>
        </View>

        <Section title="The sheet you shared" subtitle="A MetroTurf race-day program" icon={<MapPin size={17} color={colors.accentIcon} />}>
          <Fact label="VENUE" value={data.venue} detail={data.location} />
          <Fact label="DATE" value={data.dateLabel} detail="Archived example" />
          <Fact label="PRINTED PRICE" value={`₱${data.printedPricePhp.toFixed(2)}`} detail="Price shown on the sheet" />
          <Notice>{data.historicalNotice}</Notice>
        </Section>

        <Section title="How to read a race block" subtitle="Start with the race heading" icon={<Flag size={17} color={colors.accentIcon} />}>
          <View className="overflow-hidden rounded-xl border" style={{ borderColor: colors.border }}>
            <View className="flex-row justify-between bg-blue-950 px-3 py-3">
              <Text variant="labelSm" style={{ color: colors.textInverse }}>RACE {race.number}</Text>
              <Text variant="labelSm" style={{ color: colors.textInverse }}>ST {race.postTime}</Text>
              <Text variant="labelSm" style={{ color: colors.textInverse }}>{race.distanceM.toLocaleString()} M</Text>
            </View>
            <View className="p-3">
              <Text variant="bodySm" className="text-center font-sans-bold" style={{ fontSize: 12, lineHeight: 18 }}>{race.bettingEvents.join(' · ').toUpperCase()}</Text>
              <Text variant="bodySm" className="pt-1 text-center font-sans-bold" tone="secondary" style={{ fontSize: 12, lineHeight: 18 }}>{race.group.toUpperCase()}</Text>
              <View className="mt-2 flex-row justify-between border-y py-2" style={{ borderColor: colors.border }}>
                {race.tipsters.map((tip) => <Text key={tip.code} variant="bodySm" tone="secondary" style={{ fontSize: 12, lineHeight: 18 }}><Text variant="bodySm" className="font-sans-bold" style={{ fontSize: 12 }}>{tip.code}</Text> {tip.picks}</Text>)}
              </View>
              {race.entries.map((entry) => {
                const favorite = favorites.includes(entry.gate);
                return (
                  <View key={entry.gate} className="flex-row items-center gap-2 border-b py-2" style={{ borderColor: colors.border }}>
                    <View className="h-7 w-7 items-center justify-center rounded-md bg-teal-950"><Text variant="caption" style={{ color: colors.textInverse }}>{entry.gate}</Text></View>
                    <View className="min-w-0 flex-1 gap-0.5"><Text variant="labelSm">{entry.horse}{entry.tipsterStar ? ' ★' : ''}</Text><Text variant="bodySm" tone="secondary" style={{ fontSize: 12, lineHeight: 17 }}>{[entry.ageSexClass, entry.recentTime].filter(Boolean).join(' · ') || 'No recent time listed'}</Text><Text variant="bodySm" tone="secondary" style={{ fontSize: 12, lineHeight: 17 }}>{[entry.jockey, entry.weight].filter(Boolean).join(' · ')}</Text><Text variant="bodySm" tone="muted" style={{ fontSize: 12, lineHeight: 17 }}>{[entry.trainer && `Trainer: ${entry.trainer}`, entry.owner && `Owner: ${entry.owner}`].filter(Boolean).join(' · ')}</Text></View>
                    <Star size={14} fill={favorite ? colors.accentIcon : 'transparent'} color={favorite ? colors.accentIcon : colors.textInactive} onPress={() => setFavorites((current) => favorite ? current.filter((gate) => gate !== entry.gate) : [...current, entry.gate])} />
                  </View>
                );
              })}
              <Text variant="bodySm" className="pt-3 text-center" tone="secondary" style={{ fontSize: 12, lineHeight: 18 }}>Historical example. Personal stars are saved only for this screen session.</Text>
            </View>
          </View>
          <InfoRow title="Heading" detail="Race number, start time, distance, betting events, and group." />
          <InfoRow title="Pool lists" detail="Multi-race pools identify which races are combined, such as Pick 5 or Winner-Take-All." />
          <InfoRow title="B, W, Y lines" detail="Tipster combinations suggest horses for a pool or exotic bet." />
          <InfoRow title="Entry rows" detail="Gate number, horse and jockey details, weight, prior time, and star markers." />
        </Section>

        <Section title="Pools listed on this sheet" subtitle="Multi-race betting options" icon={<Trophy size={17} color={colors.accentIcon} />}>
          {data.pools.map((pool) => <View key={pool.name} className="mb-2 flex-row items-center justify-between rounded-xl border bg-white px-3 py-3" style={{ borderColor: colors.border }}><Text variant="labelSm" className="flex-1">{pool.name}</Text><Text variant="caption" className="rounded-full px-2 py-1 font-sans-bold" style={{ backgroundColor: '#e7f3ee', color: colors.info }}>{pool.races}</Text></View>)}
          <Text variant="bodySm" tone="secondary" className="pt-1 leading-5" style={{ fontSize: 13, lineHeight: 20 }}>Single-race options include {data.singleRaceOptions.join(', ')}. Check the printed pool rules before placing a bet.</Text>
        </Section>

        <Section title="Can it help pick a horse?" subtitle="Use it to compare, not predict" icon={<Star size={17} color={colors.accentIcon} />}>
          <Text variant="body" tone="secondary" className="pb-2">Yes. It gives a bettor information to compare runners and build a considered selection.</Text>
          <Card className="my-2 rounded-2xl p-4" style={{ backgroundColor: colors.brand, borderColor: colors.accent }}>
            <View className="flex-row items-center gap-2"><Star size={14} color={colors.accentIcon} /><Text variant="eyebrow" style={{ color: colors.accent }}>JOCKEYPH SYSTEM TIP · DEMO</Text></View>
            {systemTips.length ? <>
              <Text variant="body" className="pt-2" style={{ color: colors.textInverse }}>These runners appear most often in the B, W, and Y tipster lists:</Text>
              <View className="mt-2 gap-2">
                {systemTips.map((tip) => <View key={tip.gate} className="flex-row items-start gap-3 rounded-xl bg-white px-3 py-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal-950"><Text variant="label" style={{ color: colors.textInverse }}>{tip.gate}</Text></View>
                  <View className="min-w-0 flex-1 gap-1"><Text variant="label">{tip.horse}</Text><Text variant="bodySm" tone="secondary" style={{ fontSize: 12, lineHeight: 18 }}>{[tip.ageSexClass, tip.recentTime, tip.jockey, tip.weight].filter(Boolean).join(' · ') || 'Runner details not listed'}</Text><Text variant="bodySm" tone="secondary" style={{ fontSize: 12, lineHeight: 18 }}>Picked by {tip.tipsterCodes.join(', ')} · Trainer: {tip.trainer ?? 'not listed'}</Text></View>
                </View>)}
              </View>
              <Text variant="caption" className="pt-3" style={{ color: colors.textInverse, fontSize: 12, lineHeight: 18 }}>Method: count repeated gate numbers, then sort ties by average tipster position. Based on this archived sheet.</Text>
            </> : <Text variant="caption" className="pt-2" style={{ color: colors.textInverse }}>There are not enough repeated tipster picks in this race to generate a shortlist.</Text>}
          </Card>
          {data.selectionFactors.map((factor, index) => <InfoRow key={factor.title} title={`${index + 1}. ${factor.title}`} detail={factor.detail} />)}
          <View className="mt-3 rounded-xl p-3" style={{ backgroundColor: '#f6f3ea' }}>
            <Text variant="labelSm">Data needed for stronger tips</Text>
            <Text variant="bodySm" tone="secondary" className="pt-1" style={{ fontSize: 13, lineHeight: 20 }}>The current demo tip only compares B/W/Y selections. Better analysis needs complete, up-to-date race data:</Text>
            {data.tipDataNeeded.map((item) => <View key={item.field} className="border-b py-2.5" style={{ borderColor: colors.border }}><Text variant="labelSm" className="font-sans-bold">{item.field}</Text><Text variant="bodySm" tone="secondary" className="pt-0.5" style={{ fontSize: 12, lineHeight: 18 }}>{item.reason}</Text></View>)}
          </View>
          <Notice>No sheet can guarantee a winner. Use current official race information and bet only within a set budget.</Notice>
        </Section>

        <PressLink label="Learn how to read the race program" onPress={() => router.push('/racing-guide')} />
      </ScrollView>
    </Screen>
  );
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <View className="mb-5"><View className="mb-2 flex-row items-center gap-2"><View className="h-9 w-9 items-center justify-center rounded-xl bg-white">{icon}</View><View className="flex-1"><Text variant="micro" tone="secondary">{subtitle.toUpperCase()}</Text><Text variant="title">{title}</Text></View></View><Card className="p-3">{children}</Card></View>;
}

function Fact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <View className="mb-2 rounded-xl border bg-white p-3" style={{ borderColor: '#e5e5e5' }}><Text variant="micro" tone="accent">{label}</Text><Text variant="labelSm" className="pt-1">{value}</Text><Text variant="caption" tone="secondary" className="pt-0.5">{detail}</Text></View>;
}

function InfoRow({ title, detail }: { title: string; detail: string }) {
  return <View className="border-b py-3" style={{ borderColor: '#e5e5e5' }}><Text variant="labelSm">{title}</Text><Text variant="caption" tone="secondary" className="pt-1 leading-5">{detail}</Text></View>;
}

function Notice({ children }: { children: string }) {
  return <Card className="mt-2 flex-row items-start gap-2.5 p-3" style={{ backgroundColor: '#FBF2D0', borderColor: '#F2D78F' }}><CircleAlert size={16} color="#8A6414" /><Text variant="caption" tone="secondary" className="flex-1">{children}</Text></Card>;
}

function PressLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Card className="flex-row items-center gap-2 p-4"><Text accessibilityRole="link" onPress={onPress} variant="labelSm" className="flex-1" style={{ color: '#0f766e' }}>{label}</Text><ArrowRight size={16} color="#0f766e" /></Card>;
}
