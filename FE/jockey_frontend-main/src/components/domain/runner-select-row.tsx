import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { Runner } from '@/types';

const runnerBadgeColors = ['#C6A15B', '#26374b', '#7c3aed', '#64748b', '#059669', '#dc2626'] as const;

export interface RunnerSelectRowProps {
  runner: Runner;
  selected: boolean;
  onToggle: () => void;
}

/** Runner choice row styled to match the compact web betting selector. */
export function RunnerSelectRow({ runner, selected, onToggle }: RunnerSelectRowProps) {
  const { colors } = useTheme();
  const badgeColor = runnerBadgeColors[(Math.max(1, runner.number) - 1) % runnerBadgeColors.length];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${runner.number}. ${runner.horse}, ${runner.odds.toFixed(2)} odds`}
      onPress={onToggle}
      className="min-h-[51px] flex-row items-center gap-2.5 rounded-xl border px-2.5 py-2 active:opacity-80"
      style={{
        backgroundColor: selected ? '#ecfdf5' : colors.surface,
        borderColor: selected ? colors.brand : colors.border,
      }}
    >
      <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: badgeColor }}>
        <Text style={{ color: colors.textInverse, fontSize: 11, fontWeight: '700' }}>{runner.number}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} variant="micro" className="font-sans-bold">{runner.horse}</Text>
        <Text numberOfLines={1} variant="micro" tone="secondary" style={{ fontSize: 8 }}>
          {runner.jockey}{runner.trainer ? ` · ${runner.trainer}` : ''}
        </Text>
      </View>
      <View className="min-w-[40px] items-center rounded-lg px-2 py-1.5" style={{ backgroundColor: colors.accentFaint }}>
        <Text style={{ color: colors.brand, fontSize: 9, fontWeight: '700' }}>{runner.odds.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}
