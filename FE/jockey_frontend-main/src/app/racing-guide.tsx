import { Pressable, ScrollView, View } from 'react-native';
import { ArrowRight, BookOpen, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppBar, Card, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

const PROGRAM_GUIDE = [
  { title: 'Race heading', detail: 'The blue heading identifies the race number, start time, race track, distance, exotic betting events, and race group.' },
  { title: 'Pool betting events', detail: 'The next line lists pool bets available for the race, such as Trifecta and Quartet.' },
  { title: 'Dazo tips', detail: 'The third line shows selections from tipsters B, W, and Y. A star beside a horse name marks a Dazo tip.' },
  { title: 'Gate and entry columns', detail: 'The left column is the starting gate number. The following columns show the horse, jockey, jockey weight, and the horse’s best time at this track and distance within the last 180 days.' },
  { title: 'Horse details', detail: 'Tap a horse name to view its last five races at any track, its last five races at this track and distance, and its profile with group, jockey, trainer, and owner.' },
  { title: 'Personal favorites', detail: 'Use a star in the rightmost column to mark or remove a horse from your own favorites.' },
  { title: 'Announcements', detail: 'View Announcement contains race-related notices, including coupled entries, additional prizes, and sponsors.' },
  { title: 'When the program closes', detail: 'The race program is no longer available after race results have been entered.' },
];

const RESULTS_GUIDE = [
  { title: 'Race heading', detail: 'The red heading identifies the race number, race track, distance, and race group.' },
  { title: 'Clocking and finish', detail: 'Clocking lists the time for each race quarter. The winning time is shown in minutes and seconds. LF (Lengths Finished) is the winning horse’s distance ahead of the second and third placers; the final numbers show the placing.' },
  { title: 'Dividends', detail: 'The line below the heading lists the payout for each available betting event in Philippine pesos.' },
  { title: 'Race positions', detail: 'The 1/2 column shows each horse’s position at halfway. The 1/4 column shows its position with a quarter of the race remaining.' },
  { title: 'Placing and entry details', detail: 'Horses are listed by finish, with the winner first. Rating-based races show the group after the horse name. A, B, C, or D marks a LLAMADO pick. The remaining columns show jockey, jockey weight, and the horse’s race time.' },
  { title: 'Deadheat and disqualification', detail: 'DH means deadheat. DQ means disqualified. Either marker appears after the horse name when applicable.' },
  { title: 'Replay', detail: 'View Replay opens the race replay in a new window.' },
];

export default function RacingGuideScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen>
      <AppBar title="Race Program & Tips" fallbackHref="/races" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <View className="mb-4 rounded-2xl bg-teal-950 p-5">
          <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accent }}>
            <BookOpen size={19} color={colors.brand} />
          </View>
          <Text variant="eyebrow" className="pt-4" style={{ color: colors.accent }}>JOCKEYPH LEARNING GUIDE</Text>
          <Text variant="displayLg" className="pt-1" style={{ color: colors.textInverse }}>Race Program & Tips</Text>
        <Text variant="bodySm" className="pt-2" style={{ color: colors.textInverse, fontSize: 14, lineHeight: 21 }}>
            Learn to read race programs and results, compare runners, and understand the JockeyPH demo tip.
          </Text>
        </View>

        <Card className="mb-5 flex-row items-start gap-2.5 p-3.5" style={{ backgroundColor: '#C6A15B', borderColor: '#C6A15B' }}>
          <Info size={16} color={colors.accentIcon} />
          <Text variant="bodySm" className="flex-1" tone="secondary" style={{ fontSize: 13, lineHeight: 20 }}>
            This is a reference guide. Race-specific fields appear when they are provided with the race data.
          </Text>
        </Card>

        <Pressable accessibilityRole="link" onPress={() => router.push('/jockeyph-guide')} className="mb-5">
          <Card className="flex-row items-center gap-3 p-4">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal-950"><BookOpen size={17} color={colors.accentIcon} /></View>
            <View className="flex-1"><Text variant="label">JockeyPH Guide</Text><Text variant="bodySm" tone="secondary" className="pt-1" style={{ fontSize: 13, lineHeight: 20 }}>See a historical race-sheet example and how bettors read it.</Text></View>
            <ArrowRight size={16} color={colors.info} />
          </Card>
        </Pressable>

        <GuideSection title="Reading the Race Program" accent="#2563eb" items={PROGRAM_GUIDE} />
        <GuideSection title="Reading the Race Results" accent="#dc2626" items={RESULTS_GUIDE} />

        <Card className="mt-1 p-4">
          <Text variant="labelSm">Race-day note</Text>
          <Text variant="bodySm" tone="secondary" className="pt-1.5" style={{ fontSize: 13, lineHeight: 20 }}>
            Program information is for pre-race use. Once results are entered, refer to the official results page.
          </Text>
        </Card>
        <Text
          accessibilityRole="link"
          onPress={() => router.push('/races')}
          variant="caption"
          className="pt-5 text-center font-sans-bold"
          style={{ color: colors.info }}
        >
          Return to race schedule
        </Text>
      </ScrollView>
    </Screen>
  );
}

function GuideSection({ title, accent, items }: { title: string; accent: string; items: { title: string; detail: string }[] }) {
  const { colors } = useTheme();

  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center gap-2">
        <View className="h-5 w-1 rounded-full" style={{ backgroundColor: accent }} />
        <Text variant="title">{title}</Text>
      </View>
      <Card className="px-3.5">
        {items.map((item, index) => (
          <View
            key={item.title}
            className="py-3"
            style={index < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}
          >
            <Text variant="label">{item.title}</Text>
            <Text variant="bodySm" tone="secondary" className="pt-1 leading-5" style={{ fontSize: 13, lineHeight: 20 }}>{item.detail}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}
