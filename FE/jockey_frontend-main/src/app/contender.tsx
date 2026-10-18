import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { SilkBadge } from '@/components/domain/silk-badge';
import { AppBar, Card, Media, Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function ContenderScreen() {
  const { colors } = useTheme();
  const { name, kind, number, race } = useLocalSearchParams<{
    name?: string;
    kind?: string;
    number?: string;
    race?: string;
  }>();

  const isJockey = kind === 'jockey';
  const runnerNumber = Number(number) || undefined;
  const label = isJockey ? 'Jockey' : 'Horse';

  return (
    <Screen edgeToEdgeTop>
      <View style={{ backgroundColor: colors.brand }}>
        <AppBar title={label} variant="dark" fallbackHref="/results" />
        <View className="items-center px-5 pb-8 pt-2">
          <View className="overflow-hidden rounded-3xl" style={{ width: 96, height: 96 }}>
            <Media style={{ width: 96, height: 96 }} />
          </View>
          <Text variant="micro" className="pt-4 tracking-wide" style={{ color: colors.accentSoft }}>
            {(race ?? '').toUpperCase()}
          </Text>
          <Text
            variant="displayLg"
            className="pt-1.5 text-center"
            style={{ color: colors.textInverse }}
          >
            {name ?? label}
          </Text>
        </View>
      </View>

      <View className="gap-3 p-5">
        <Card className="flex-row items-center gap-3 p-4">
          {runnerNumber ? <SilkBadge number={runnerNumber} size="lg" /> : null}
          <View className="flex-1">
            <Text variant="micro" tone="secondary" className="tracking-wide">
              SADDLECLOTH
            </Text>
            <Text variant="labelSm" className="pt-1">
              {runnerNumber ? `No. ${runnerNumber}` : '—'}
            </Text>
          </View>
        </Card>

        <Card className="p-4">
          <Text variant="caption" tone="secondary">
            {isJockey
              ? 'Jockey profiles, mounts and form figures are illustrative in this demo and not yet connected to live records.'
              : 'Horse profiles, past performances and form figures are illustrative in this demo and not yet connected to live records.'}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
