import { View } from 'react-native';
import { Wallet } from 'lucide-react-native';

import { Card, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export interface BalanceCardProps {
  label?: string;
  amount: number;
  currency: string;
}

function formatAmount(currency: string, amount: number) {
  return `${currency}${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BalanceCard({ label = 'DEMO BALANCE', amount, currency }: BalanceCardProps) {
  const { colors } = useTheme();

  return (
    <Card className="flex-row items-center gap-3 p-4" bordered>
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: colors.accentFaint }}
      >
        <Wallet size={20} color={colors.brand} />
      </View>
      <View className="flex-1">
        <Text variant="micro" tone="accent" className="font-sans-bold tracking-widest">
          {label}
        </Text>
        <Text variant="display" className="pt-1 text-2xl">
          {formatAmount(currency, amount)}
        </Text>
        <Text variant="caption" tone="muted">
          Simulated funds for demonstrations only
        </Text>
      </View>
    </Card>
  );
}
