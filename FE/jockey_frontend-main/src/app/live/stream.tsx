import { ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { ArrowRight, Volume2 } from 'lucide-react-native';
import { useHome, useRace } from '@/lib/api';
import { useTheme } from '@/theme';
import { AppBar, Button, Card, Screen, Text } from '@/components/ui';

export default function LiveStreamScreen() {
  const router = useRouter();
  const { colors, palette } = useTheme();
  const { data } = useHome();
  const race = data?.liveRace;
  const { data: raceDetails } = useRace(race?.id ?? '');
  const runners = [...(raceDetails?.runners ?? race?.runners ?? [])].sort((a, b) => a.number - b.number);
  const player = useVideoPlayer(
    'https://videos.pexels.com/video-files/16794017/16794017-uhd_3840_2160_24fps.mp4',
    (videoPlayer) => {
      videoPlayer.loop = true;
      videoPlayer.muted = true;
      videoPlayer.play();
    },
  );

  return (
    <Screen edgeToEdgeTop style={{ backgroundColor: '#14201d' }}>
      <AppBar title="Live Stream" variant="dark" fallbackHref="/live" />
      <ScrollView className="bg-[#14201d]" contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
        <Card className="overflow-hidden" bordered={false}>
          <View className="h-60" style={{ backgroundColor: palette.neutral600 }}>
            <Image
              source={require('../../../assets/images/web/home-race-feature.jpg')}
              contentFit="cover"
              style={{ position: 'absolute', inset: 0, opacity: 0.55 }}
              accessibilityLabel="Race replay poster"
            />
            <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls />
          </View>
          <View className="p-4">
            <Text variant="labelSm" style={{ color: colors.textInverse }}>Race {race?.number ?? '-'} - {race?.name ?? 'Race replay'}</Text>
            <Text variant="caption" className="pt-1" style={{ color: colors.textMuted }}>{race?.venue ?? ''} - {race?.distanceM ?? '-'} m - {race?.postTime ?? ''}</Text>
          </View>
        </Card>
        <View className="flex-row items-center gap-2 px-4">
          <Volume2 size={15} color={colors.textMuted} />
          <Text variant="caption" className="flex-1" style={{ color: colors.textMuted }}>Sample racing preview. Official live video is not connected yet.</Text>
        </View>
        <Button className="mx-4" label="View race updates" leadingIcon={<ArrowRight size={17} color={colors.textInverse} />} onPress={() => router.push('/live/updates')} />
        <View className="gap-2 px-4">
          <Text variant="labelSm" style={{ color: colors.textInverse }}>Race entries</Text>
          {runners.length ? runners.map((runner) => (
            <Card key={runner.id} className="flex-row items-center gap-3 p-3">
              <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: runnerColor(runner.number) }}><Text variant="caption" style={{ color: colors.textInverse }}>{runner.number}</Text></View>
              <View className="flex-1"><Text variant="bodySm" className="font-sans-bold">{runner.horse}</Text><Text variant="micro" tone="secondary">{runner.jockey}</Text></View>
            </Card>
          )) : <Text variant="caption" style={{ color: colors.textMuted }}>Race entries are not available yet.</Text>}
        </View>
      </ScrollView>
    </Screen>
  );
}

function runnerColor(number: number) {
  const colors = ['#5d8a72', '#5d78a6', '#82709d', '#778496', '#5b8a82', '#a56d70', '#a18b5b', '#6e8994'];
  return colors[(Math.max(number, 1) - 1) % colors.length];
}
