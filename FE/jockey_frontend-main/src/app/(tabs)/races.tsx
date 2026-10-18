import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Trophy } from 'lucide-react-native';

import { AppBar, Card, Chip, Screen, Text } from '@/components/ui';
import { useMeetingDays } from '@/lib/api';
import { useTheme } from '@/theme';
import type { MeetingDay, Race, MarketType } from '@/types';

const FILTERS = ['All', 'Upcoming', 'Ongoing', 'Completed'] as const;
const MARKETS: MarketType[] = ['WIN', 'PLACE', 'FORECAST', 'TRIFECTA', 'REVERSE_FORECAST', 'BOX_TRIFECTA', 'MULTI_RACE'];

function formatMeetingDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-PH', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function getCalendarDays(days: MeetingDay[]) {
  if (!days.length) return [];
  const anchorDay = days.find((day) => day.races.length > 0) ?? days[0];
  if (!anchorDay) return [];
  const byDate = new Map(days.map((day) => [day.date, day]));
  const anchor = new Date(`${anchorDay.date}T12:00:00`);
  for (let offset = -2; offset <= 2; offset += 1) {
    const date = new Date(anchor);
    date.setDate(date.getDate() + offset);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!byDate.has(iso)) byDate.set(iso, { date: iso, day: String(date.getDate()), weekday: date.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase(), raceCount: 0, races: [] });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function dateStatus(value: string) {
  const today = new Date();
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return value < current ? 'PAST' : value > current ? 'UPCOMING' : 'TODAY';
}

export default function RacesScreen() {
  const router = useRouter();
  const { market: marketParam } = useLocalSearchParams<{ market?: string }>();
  const { colors } = useTheme();
  const { data: sourceDays = [], isLoading } = useMeetingDays();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const market = MARKETS.find((item) => item === marketParam?.toUpperCase()) ?? '';

  const days = useMemo(() => getCalendarDays(sourceDays), [sourceDays]);
  const clubs = useMemo(() => {
    const grouped = new Map<string, { name: string; raceCount: number; nextRace: Race }>();
    for (const day of days) for (const race of day.races) {
      const name = race.clubName || race.venue;
      const prior = grouped.get(name);
      grouped.set(name, { name, raceCount: (prior?.raceCount ?? 0) + 1, nextRace: prior?.nextRace ?? race });
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [days]);
  const activeDay = days.find((day) => day.date === selectedDate) ?? days.find((day) => day.races.length > 0) ?? days[0];
  const dayIndex = days.findIndex((day) => day.date === activeDay?.date);
  const races = (activeDay?.races ?? [])
    .filter((race) => !selectedClub || (race.clubName || race.venue) === selectedClub)
    .filter((race) => filter === 'All' || race.status.toLowerCase() === filter.toLowerCase())
    .filter((race) => `${race.name} ${race.clubName ?? ''} ${race.venue}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.number - b.number);

  const selectClub = (clubName: string) => {
    setSelectedClub(clubName);
    const matchingDay = days.find((day) => day.races.some((race) => (race.clubName || race.venue) === clubName));
    if (matchingDay) setSelectedDate(matchingDay.date);
  };

  const openRace = (race: Race) => router.push({ pathname: '/race/[id]', params: { id: race.id, market } });
  const openBet = (race: Race) => {
    if (!market) {
      router.push({ pathname: '/games', params: { race: race.id } });
      return;
    }

    router.push({ pathname: '/selection/[id]', params: { id: race.id, market } });
  };

  return (
    <Screen>
      <AppBar
        title="Race Schedule"
        left="brand"
        right={<Pressable accessibilityRole="button" accessibilityLabel={searchOpen ? 'Close race search' : 'Search races'} onPress={() => { setSearchOpen((value) => !value); setSearch(''); }} className="h-9 w-9 items-center justify-center rounded-full bg-white"><Search size={18} color={colors.textPrimary} /></Pressable>}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {searchOpen ? <TextInput accessibilityLabel="Search by race or club" placeholder="Search races or clubs" value={search} onChangeText={setSearch} autoFocus className="mx-4 mt-2 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm" /> : null}

        {!selectedClub ? (
          <View className="px-4 pb-5">
            <View className="flex-row items-center justify-between pt-4">
              <Text variant="labelSm">Choose a club to start</Text>
              <Text variant="micro" tone="muted">{clubs.length} clubs</Text>
            </View>
            <Text variant="micro" tone="secondary" className="pb-3 pt-1">Select the racing club whose race card you want to bet on.</Text>
            {isLoading ? <Text variant="caption" tone="secondary">Loading race clubs…</Text> : null}
            <View className="gap-2">
              {clubs.map((club) => (
                <Pressable key={club.name} accessibilityRole="button" onPress={() => selectClub(club.name)} className="min-h-[58px] flex-row items-center gap-2.5 rounded-2xl border border-stone-200 bg-white p-2.5">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-teal-950"><Trophy size={15} color={colors.accentIcon} /></View>
                  <View className="flex-1 gap-1"><Text variant="micro" className="font-sans-bold">{club.name}</Text><Text variant="micro" tone="secondary">{club.raceCount} {club.raceCount === 1 ? 'race' : 'races'} · {club.nextRace.venue}</Text></View>
                  <ChevronRight size={17} color={colors.textMuted} />
                </Pressable>
              ))}
              {!isLoading && clubs.length === 0 ? <Card className="p-4"><Text variant="caption" tone="secondary">No race clubs are available.</Text></Card> : null}
            </View>
          </View>
        ) : (
          <>
            <View className="min-h-12 flex-row items-center justify-between bg-teal-950 px-3.5 py-2">
              <Pressable accessibilityRole="button" onPress={() => setSelectedClub('')} className="flex-row items-center gap-1"><ArrowLeft size={13} color={colors.textMuted} /><Text variant="micro" style={{ color: colors.textMuted }}>All clubs</Text></Pressable>
              <View className="items-end"><Text variant="micro" className="tracking-widest" style={{ color: colors.accent }}>BETTING AT</Text><Text variant="micro" className="font-sans-bold" style={{ color: colors.textInverse }}>{selectedClub}</Text></View>
            </View>

            <View className="flex-row items-stretch justify-between border-b border-stone-200 bg-stone-50 px-2 pt-1">
              <Pressable accessibilityRole="button" accessibilityLabel="Previous day" disabled={dayIndex <= 0} onPress={() => setSelectedDate(days[dayIndex - 1]?.date ?? '')} className="w-7 items-center justify-center"><ChevronLeft size={16} color={colors.textSecondary} /></Pressable>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 3 }}>
                {days.map((day) => {
                  const chosen = activeDay?.date === day.date;
                  const dayDate = new Date(`${day.date}T12:00:00`);
                  return <Pressable key={day.date} accessibilityRole="button" accessibilityState={{ selected: chosen }} onPress={() => setSelectedDate(day.date)} className="min-w-[48px] flex-1 items-center justify-center gap-1 rounded-t-xl px-1 py-2" style={{ backgroundColor: chosen ? colors.brand : 'transparent' }}>
                    <Text variant="micro" className="font-sans-bold" style={{ color: chosen ? colors.textInverse : colors.textSecondary }}>{dayDate.getDate()}</Text>
                    <Text variant="micro" className="font-sans-bold" style={{ color: chosen ? colors.textInverse : colors.textSecondary }}>{dayDate.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase()}</Text>
                    <Text variant="micro" style={{ color: chosen ? colors.textMuted : colors.textInactive, fontSize: 7 }}>{dateStatus(day.date)}</Text>
                  </Pressable>;
                })}
              </ScrollView>
              <Pressable accessibilityRole="button" accessibilityLabel="Next day" disabled={dayIndex >= days.length - 1} onPress={() => setSelectedDate(days[dayIndex + 1]?.date ?? '')} className="w-7 items-center justify-center"><ChevronRight size={16} color={colors.textSecondary} /></Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 13, paddingVertical: 8 }}>
              {FILTERS.map((option) => <Chip key={option} label={option} selected={filter === option} onPress={() => setFilter(option)} />)}
            </ScrollView>

            <View className="px-3">
              <View className="flex-row items-center justify-between py-2"><Text variant="micro" className="font-sans-bold">{activeDay ? formatMeetingDate(activeDay.date) : 'Race day'}</Text><Text variant="micro" tone="muted">{races.length} races</Text></View>
              <View className="gap-2">
                {races.map((race) => <ScheduleRaceCard key={race.id} race={race} onOpen={() => openRace(race)} onBet={() => openBet(race)} onClub={() => router.push(`/club/${(race.clubName || race.venue).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`)} />)}
                {!isLoading && races.length === 0 ? <Text variant="micro" tone="secondary" className="py-4 text-center">{activeDay?.raceCount ? 'No races match this filter.' : `No races scheduled for ${activeDay ? formatMeetingDate(activeDay.date) : 'this date'}. Select another date.`}</Text> : null}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function ScheduleRaceCard({ race, onOpen, onBet, onClub }: { race: Race; onOpen: () => void; onBet: () => void; onClub: () => void }) {
  const { colors } = useTheme();
  const status = race.status.toUpperCase();
  const statusColor = race.status === 'upcoming' ? colors.success : race.status === 'ongoing' ? colors.warning : colors.textMuted;
  const statusBackground = race.status === 'upcoming' ? '#e6f3ec' : race.status === 'ongoing' ? '#C6A15B' : '#e8eaed';

  return (
    <View className="min-h-[132px] flex-row items-stretch gap-3 rounded-[20px] border border-stone-200 bg-white p-3 shadow-sm">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open race ${race.number}: ${race.name}`}
        onPress={onOpen}
        className="w-[68px] items-center justify-center rounded-xl bg-teal-950"
      >
        <Text style={{ color: colors.textInverse, fontSize: 9, letterSpacing: 1.5 }}>RACE</Text>
        <Text style={{ color: colors.textInverse, fontFamily: 'LibreCaslonDisplay_400Regular', fontSize: 36, lineHeight: 42 }}>{race.number}</Text>
      </Pressable>

      <View className="flex-1 justify-between py-1">
        <Pressable accessibilityRole="button" onPress={onOpen} className="gap-1.5 pr-1">
          <Text numberOfLines={1} style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '600' }}>{race.name}</Text>
          <Text numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 11 }}>{race.clubName || race.venue} · {race.distanceM.toLocaleString()} m · {race.entries} entries</Text>
        </Pressable>

        <View className="flex-row flex-wrap items-center gap-2">
          <Pressable accessibilityRole="button" onPress={onClub} className="min-h-9 items-center justify-center rounded-full border border-teal-900 px-3">
            <Text style={{ color: colors.brand, fontSize: 11, fontWeight: '600' }}>View club</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onBet} className="min-h-9 flex-row items-center justify-center gap-2 rounded-full bg-teal-950 px-4">
            <Text style={{ color: colors.textInverse, fontSize: 11, fontWeight: '600' }}>Place a bet</Text>
            <ChevronRight size={14} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>

      <View className="w-[78px] items-end justify-between py-1">
        <View className="rounded-full px-3 py-2" style={{ backgroundColor: statusBackground }}>
          <Text style={{ color: statusColor, fontSize: 9, fontWeight: '600' }}>{status}</Text>
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '500' }}>{race.postTime}</Text>
      </View>
    </View>
  );
}
