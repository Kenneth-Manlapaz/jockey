import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, FileText, Info, LockKeyhole, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';

import { AppBar, Card, Screen, Text } from '@/components/ui';
import { useSessionStore } from '@/lib/auth/session';
import { useTheme } from '@/theme';

const SETTINGS_KEY = 'pj-web-settings';
type Preferences = { raceReminders: boolean; resultAnnouncements: boolean };
const DEFAULT_PREFERENCES: Preferences = { raceReminders: true, resultAnnouncements: true };

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signOut = useSessionStore((state) => state.signOut);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [openLegal, setOpenLegal] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SETTINGS_KEY).then((saved) => {
      if (!active || !saved) return;
      try {
        setPreferences({ ...DEFAULT_PREFERENCES, ...(JSON.parse(saved) as Partial<Preferences>) });
      } catch {
        // Keep the website's default preferences if saved data is invalid.
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const togglePreference = (key: keyof Preferences) => {
    setPreferences((current) => {
      const next = { ...current, [key]: !current[key] };
      void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const logout = async () => {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    signOut();
    router.replace('/login');
  };

  const legalRows = [
    { id: 'privacy', title: 'Privacy policy', detail: 'How account information is handled', body: 'Privacy policy information will be provided before account data is used in production.', icon: <ShieldCheck size={16} color={colors.brand} /> },
    { id: 'terms', title: 'Terms and Conditions', detail: 'Use of the Philippine Jockey demo', body: 'This is a play-money frontend demo. Production terms will be provided before real wagering is enabled.', icon: <FileText size={16} color={colors.brand} /> },
    { id: 'about', title: 'About this application', detail: 'Philippine Jockey', body: 'Philippine Jockey helps you explore race cards, horses, and play-money betting games.', icon: <Info size={16} color={colors.brand} /> },
  ];

  return (
    <Screen>
      <AppBar title="Settings" fallbackHref="/profile" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View className="pb-3"><Text variant="eyebrow" tone="secondary">PROFILE SETTINGS</Text><Text variant="display" className="pt-1 text-2xl">Settings</Text></View>

        <SettingsSection title="ACCOUNT">
          <SettingsRow icon={<UserRound size={16} color={colors.brand} />} title="Account settings" detail="Personal information and profile" onPress={() => router.push('/edit-profile')} />
          <SettingsRow icon={<Bell size={16} color={colors.brand} />} title="Notification preferences" detail="Choose your race day updates" onPress={() => router.push('/notifications')} />
          <SettingsRow icon={<LockKeyhole size={16} color={colors.brand} />} title="Change password" detail="Unavailable until account security is connected" disabled />
        </SettingsSection>

        <SettingsSection title="LEGAL & INFORMATION">
          {legalRows.map((row) => {
            const expanded = openLegal === row.id;
            return (
              <View key={row.id}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpenLegal(expanded ? null : row.id)} className="min-h-12 flex-row items-center gap-2 border-b border-stone-100 px-2 py-2">
                  <IconBox>{row.icon}</IconBox><View className="flex-1"><Text variant="micro" className="font-sans-bold">{row.title}</Text><Text variant="micro" tone="secondary">{row.detail}</Text></View><ChevronRight size={15} color={colors.textMuted} style={expanded ? { transform: [{ rotate: '90deg' }] } : undefined} />
                </Pressable>
                {expanded ? <Text variant="micro" tone="secondary" className="px-3 py-2">{row.body}</Text> : null}
              </View>
            );
          })}
        </SettingsSection>

        <Card className="mt-1 overflow-hidden p-0">
          <PreferenceRow title="Race reminders" detail="Get notified before race time" value={preferences.raceReminders} onToggle={() => togglePreference('raceReminders')} />
          <PreferenceRow title="Results announcements" detail="Get notified when results are official" value={preferences.resultAnnouncements} onToggle={() => togglePreference('resultAnnouncements')} last />
        </Card>

        <Pressable accessibilityRole="button" onPress={() => void logout()} className="mt-3 min-h-10 flex-row items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white">
          <LogOut size={15} color={colors.danger} /><Text variant="caption" className="font-sans-bold" style={{ color: colors.danger }}>Log out</Text>
        </Pressable>
        <Text variant="micro" tone="muted" className="pt-3 text-center">Philippine Jockey · Play-money demo</Text>
      </ScrollView>
    </Screen>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <View className="mb-3"><Text variant="micro" tone="muted" className="px-1 pb-1 font-sans-bold tracking-widest">{title}</Text><Card className="overflow-hidden p-0">{children}</Card></View>;
}

function IconBox({ children }: { children: React.ReactNode }) {
  return <View className="h-6 w-6 items-center justify-center rounded-md bg-emerald-50">{children}</View>;
}

function SettingsRow({ icon, title, detail, onPress, disabled = false }: { icon: React.ReactNode; title: string; detail: string; onPress?: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole={disabled ? 'text' : 'button'} accessibilityState={{ disabled }} onPress={onPress} disabled={disabled} className={`min-h-12 flex-row items-center gap-2 border-b border-stone-100 px-2 py-2 ${disabled ? 'opacity-60' : ''}`}>
    <IconBox>{icon}</IconBox><View className="flex-1"><Text variant="micro" className="font-sans-bold">{title}</Text><Text variant="micro" tone="secondary">{detail}</Text></View><ChevronRight size={15} color={colors.textMuted} />
  </Pressable>;
}

function PreferenceRow({ title, detail, value, onToggle, last = false }: { title: string; detail: string; value: boolean; onToggle: () => void; last?: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={onToggle} className="min-h-12 flex-row items-center gap-2 px-3 py-2" style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: colors.border }}>
    <View className="flex-1"><Text variant="micro" className="font-sans-bold">{title}</Text><Text variant="micro" tone="secondary">{detail}</Text></View>
    <View className="h-[18px] w-[32px] justify-center rounded-full px-[2px]" style={{ backgroundColor: value ? colors.brand : colors.borderStrong }}><View className={`h-[14px] w-[14px] rounded-full bg-white ${value ? 'self-end' : 'self-start'}`} /></View>
  </Pressable>;
}
