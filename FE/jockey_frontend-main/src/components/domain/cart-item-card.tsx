import { Pressable, View } from 'react-native';
import { Pencil, Trash2 } from 'lucide-react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';
import type { CartItem } from '@/types';

export interface CartItemCardProps {
  item: CartItem;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** One staged selection in the compact website-style bet cart. */
export function CartItemCard({ item, index, onEdit, onDelete }: CartItemCardProps) {
  const { colors } = useTheme();
  const label = item.market.replace(/_/g, ' ');

  return (
    <Card className="overflow-hidden p-3" style={{ borderRadius: 14 }}>
      <View className="flex-row items-center justify-between">
        <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>BET {index}</Text>
        <View className="rounded-full bg-emerald-50 px-2 py-1"><Text style={{ color: colors.info, fontSize: 7, fontWeight: '700' }}>IN CART</Text></View>
      </View>
      <Text className="pt-2" style={{ color: colors.textMuted, fontSize: 7, letterSpacing: 1 }}>RACE {item.raceNumber} · {item.raceName.toUpperCase()}</Text>
      <View className="flex-row items-center justify-between border-b border-dashed border-stone-200 pb-2 pt-1">
        <Text style={{ color: colors.brand, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 19 }}>{label}</Text>
        <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 7, maxWidth: 130 }}>{item.runners.map((runner) => runner.horse).join(' · ')}</Text>
      </View>
      <View className="gap-1 pt-1.5">
        {item.runners.map((runner) => (
          <View key={`${item.id}-${runner.runnerNumber}`} className="flex-row items-center gap-2 py-1">
            <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.brand }}><Text style={{ color: colors.textInverse, fontSize: 11, fontWeight: '700' }}>{runner.runnerNumber}</Text></View>
            <View className="flex-1"><Text style={{ fontSize: 9, fontWeight: '700' }}>{runner.horse}</Text><Text style={{ color: colors.textSecondary, fontSize: 7 }}>{runner.jockey}</Text></View>
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row border-t border-stone-100 pt-2">
        <Pressable accessibilityRole="button" onPress={onEdit} className="flex-1 flex-row items-center justify-center gap-1 py-1"><Pencil size={12} color={colors.info} /><Text style={{ color: colors.info, fontSize: 8, fontWeight: '700' }}>Edit bet</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete} className="flex-1 flex-row items-center justify-center gap-1 py-1"><Trash2 size={12} color={colors.danger} /><Text style={{ color: colors.danger, fontSize: 8, fontWeight: '700' }}>Delete</Text></Pressable>
      </View>
    </Card>
  );
}
