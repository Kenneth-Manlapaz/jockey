import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronRight, CreditCard, Heart, History, LogOut, Settings, ShieldCheck, Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { AppBar, Avatar, Button, Card, Screen, Text } from '@/components/ui';
import { DEMO_USER, useAuthUser, useSessionStore } from '@/lib/auth/session';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const sessionUser = useAuthUser();
  const signOut = useSessionStore((state) => state.signOut);
  const data = sessionUser ?? DEMO_USER;

  return (
    <Screen edgeToEdgeTop>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-teal-950 pb-8" style={{ paddingTop: insets.top }}>
          <AppBar
            title="PROFILE"
            left="none"
            variant="dark"
            bordered={false}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                hitSlop={8}
                onPress={() => router.push('/settings')}
                className="h-9 w-9 items-center justify-center rounded-full active:opacity-80"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Settings size={18} color={colors.textInverse} />
              </Pressable>
            }
          />
          <View className="items-center pt-2">
            <Avatar initials={data.initials} size={54} presence={false} />
            <Text variant="micro" className="pt-3 tracking-widest" style={{ color: colors.accent }}>
              {data.memberSince}
            </Text>
            <Text variant="display" className="pt-1 text-xl" style={{ color: colors.textInverse }}>
              {data.firstName} {data.lastName}
            </Text>
            <Text variant="caption" className="pt-1" style={{ color: colors.textMuted }}>
              {data.email}
            </Text>
            <Text
              variant="micro"
              className="pt-2 tracking-wide"
              style={{ color: colors.accentSoft }}
            >
            </Text>
          </View>
        </View>

        <View className="gap-3 px-4 pb-5">
          <Card className="gap-3 p-4" bordered>
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accentFaint }}>
                <Wallet size={20} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Text variant="caption" tone="secondary">DEMO WALLET BALANCE</Text>
                <Text variant="heading" className="pt-1 text-xl">₱{data.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
            <Button label="Withdraw money" variant="primary" onPress={() => router.push('/withdraw')} />
            <Text variant="micro" tone="muted" className="text-center">Demo balance only. Withdrawals are not processed.</Text>
          </Card>

          <Button
            label="Edit profile"
            variant="secondary"
            fullWidth
            className="-mt-2 bg-white"
            onPress={() => router.push('/edit-profile')}
          />

          <Card className="overflow-hidden">
            <MenuRow
              icon={<CreditCard size={18} color={colors.brand} />}
              title="Payment methods"
              subtitle="Choose a payout method"
              onPress={() => router.push('/withdraw')}
            />
            <MenuRow
              icon={<ShieldCheck size={18} color={colors.brand} />}
              title="Security settings"
              subtitle="Manage your account security"
              onPress={() => router.push('/settings')}
            />
            <MenuRow
              icon={<History size={18} color={colors.brand} />}
              title="Transaction history"
              subtitle="Review your demo tickets"
              onPress={() => router.push('/betting-history')}
            />
            <MenuRow
              icon={<Heart size={18} color={colors.brand} />}
              title="Favorites"
              subtitle="Your saved contenders"
              onPress={() => router.push('/favorites')}
            />
            <MenuRow
              icon={<Bell size={18} color={colors.brand} />}
              title="Notifications"
              subtitle="Race day updates"
              onPress={() => router.push('/notifications')}
            />
            <MenuRow
              icon={<Settings size={18} color={colors.brand} />}
              title="Settings"
              subtitle="Account preferences"
              last
              onPress={() => router.push('/settings')}
            />
          </Card>

          <Button
            label="Log out"
            variant="destructive"
            leadingIcon={<LogOut size={18} color={colors.danger} />}
            onPress={() => {
              signOut();
              router.replace('/welcome');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

interface MenuRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  last?: boolean;
  onPress?: () => void;
}

function MenuRow({ icon, title, subtitle, last, onPress }: MenuRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 p-3 active:opacity-70"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: colors.surfaceMuted }}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text variant="bodySm" className="font-sans-bold">
          {title}
        </Text>
        <Text variant="micro" tone="secondary">
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textPrimary} />
    </Pressable>
  );
}
