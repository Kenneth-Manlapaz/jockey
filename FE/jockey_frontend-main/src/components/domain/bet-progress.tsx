import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

const LABELS = ['Games & Guide', 'Selection of Horses & Jockey', 'Bet Cart', 'Review'];

export function BetProgress({ step }: { step: 1 | 2 | 3 | 4 }) {
  const { colors } = useTheme();
  return (
    <View accessibilityLabel={`Betting step ${step} of 4`} className="flex-row justify-between gap-1 px-2 pb-3 pt-2">
      {LABELS.map((label, index) => {
        const number = index + 1;
        const complete = number < step;
        const current = number === step;
        return (
          <View key={label} className="min-w-0 flex-1 items-center gap-1">
            <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: complete || current ? colors.brand : colors.surface }}>
              {complete ? <Check size={13} color={colors.textInverse} strokeWidth={3} /> : <Text style={{ color: current ? colors.textInverse : colors.textMuted, fontSize: 9, fontWeight: current ? '700' : '500' }}>{number}</Text>}
            </View>
            <Text numberOfLines={2} style={{ color: current ? colors.brand : colors.textMuted, fontSize: 6, fontWeight: current ? '700' : '400', textAlign: 'center', lineHeight: 8 }}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}
