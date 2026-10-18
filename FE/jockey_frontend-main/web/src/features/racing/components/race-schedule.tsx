'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, Trophy } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { MeetingDay, Race } from '@/types';

const filters = ['All', 'Upcoming', 'Ongoing', 'Completed'] as const;

function clubSlug(name: string) {
  return encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
}

function formatMeetingDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-PH', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function dateStatus(value: string) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return value < today ? 'PAST' : value > today ? 'UPCOMING' : 'TODAY';
}

function RaceCard({ race, market }: { race: Race; market: string }) {
  const club = race.clubName || race.venue;
  const status = race.status === 'ongoing' ? 'ONGOING' : race.status.toUpperCase();
  const raceHref = `/race/${race.id}${market ? `?market=${encodeURIComponent(market)}` : ''}`;
  const betHref = `/race/${race.id}/bet?market=${encodeURIComponent(market || 'WIN')}`;
  return <article className="schedule-race-card">
    <Link className="schedule-race-number" href={raceHref}><small>RACE</small><strong>{race.number}</strong></Link>
    <Link className="schedule-race-main" href={raceHref}>
      <strong>{race.name}</strong>
      <small><span>{club}</span><i />{race.distanceM.toLocaleString()} m · {race.entries} entries</small>
    </Link>
    <div className="schedule-race-right"><span className={`schedule-status ${race.status}`}>{status}</span><time>{race.postTime}</time></div>
    <div className="schedule-race-actions">
      <Link className="schedule-club-link" href={`/club/${clubSlug(club)}`} aria-label={`View ${club} profile`}>View club</Link>
      <Link className="schedule-place-bet" href={betHref}>Place a bet <span aria-hidden="true">→</span></Link>
    </div>
  </article>;
}

export function RaceSchedule({ days, market = '' }: { days: MeetingDay[]; market?: string }) {
  const [dayId, setDayId] = useState(days.find((day) => day.races.length > 0)?.date ?? days[0]?.date ?? '');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const dateRail = useRef<HTMLDivElement>(null);
  const calendarDays = useMemo(() => {
    if (!days.length) return days;
    const byDate = new Map(days.map((day) => [day.date, day]));
    const anchor = new Date(`${(days.find((day) => day.races.length > 0) ?? days[0]).date}T12:00:00`);
    for (let offset = -2; offset <= 2; offset += 1) {
      const date = new Date(anchor);
      date.setDate(date.getDate() + offset);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!byDate.has(iso)) byDate.set(iso, { date: iso, day: String(date.getDate()), weekday: date.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase(), raceCount: 0, races: [] });
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [days]);
  const selectedDay = calendarDays.find((day) => day.date === dayId) ?? calendarDays[0];
  const clubs = useMemo(() => {
    const grouped = new Map<string, { name: string; raceCount: number; nextRace: Race }>();
    for (const day of calendarDays) for (const race of day.races) {
      const name = race.clubName || race.venue;
      const previous = grouped.get(name);
      grouped.set(name, { name, raceCount: (previous?.raceCount ?? 0) + 1, nextRace: previous?.nextRace ?? race });
    }
    return [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [calendarDays]);
  const races = useMemo(() => [...(selectedDay?.races ?? [])]
    .filter((race) => !selectedClub || (race.clubName || race.venue) === selectedClub)
    .filter((race) => filter === 'All' || race.status.toLowerCase() === filter.toLowerCase())
    .filter((race) => `${race.name} ${race.clubName ?? ''} ${race.venue}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.number - b.number), [selectedDay, selectedClub, filter, search]);
  const selectedIndex = calendarDays.findIndex((day) => day.date === dayId);

  function moveMeeting(index: number) {
    const nextDay = calendarDays[index];
    if (!nextDay) return;
    setDayId(nextDay.date);
    requestAnimationFrame(() => {
      const rail = dateRail.current;
      const button = rail?.querySelector<HTMLElement>(`[data-meeting-day="${nextDay.date}"]`);
      if (rail && button) rail.scrollTo({ left: Math.max(0, button.offsetLeft - rail.offsetLeft - button.offsetWidth * 2), behavior: 'smooth' });
    });
  }

  return <main className="app-page schedule-page">
    <header className="schedule-header">
      <Link className="schedule-logo" href="/dashboard" aria-label="Home"><Trophy size={15} /></Link>
      <div><span>RACES</span><h1>Race Schedule</h1></div>
      <button className="schedule-search" type="button" aria-label={searchOpen ? 'Close race search' : 'Search races'} onClick={() => { setSearchOpen((open) => !open); setSearch(''); }}><Search size={18} /></button>
    </header>
    {searchOpen && <input className="schedule-search-input" aria-label="Search by race or club" placeholder="Search races or clubs" value={search} onChange={(event) => setSearch(event.target.value)} autoFocus />}
    {!selectedClub ? <section className="schedule-club-picker" aria-label="Choose a racing club">
      <div className="schedule-section-heading"><strong>Choose a club to start</strong><small>{clubs.length} clubs</small></div>
      <p>Select the racing club whose race card you want to bet on.</p>
      <div className="schedule-club-list">{clubs.map((club) => <button type="button" className="schedule-club-card" key={club.name} onClick={() => { setSelectedClub(club.name); setDayId(days.find((day) => day.races.some((race) => (race.clubName || race.venue) === club.name))?.date ?? dayId); }}>
        <span className="schedule-club-emblem"><Trophy size={15} /></span><span><strong>{club.name}</strong><small>{club.raceCount} {club.raceCount === 1 ? 'race' : 'races'} · {club.nextRace.venue}</small></span><ChevronRight size={17} />
      </button>)}</div>
    </section> : <>
    <div className="schedule-club-selected"><button type="button" onClick={() => setSelectedClub('')}><ArrowLeft size={14} /> All clubs</button><span>BETTING AT</span><strong>{selectedClub}</strong></div>
    <div className="schedule-date-row" aria-label="Meeting days" ref={dateRail}>
      <button type="button" aria-label="Previous day" onClick={() => moveMeeting(selectedIndex - 1)} disabled={selectedIndex <= 0}><ChevronLeft size={16} /></button>
      {calendarDays.map((day) => <button type="button" key={day.date} data-meeting-day={day.date} aria-label={`${formatMeetingDate(day.date)}${day.raceCount ? `, ${day.raceCount} races` : ', no scheduled races'}`} aria-pressed={dayId === day.date} className={`schedule-date${dayId === day.date ? ' selected' : ''}`} onClick={() => setDayId(day.date)}>
        <small>{new Date(`${day.date}T12:00:00`).getDate()}</small><span>{new Intl.DateTimeFormat('en-PH', { weekday: 'short' }).format(new Date(`${day.date}T12:00:00`)).toUpperCase()}</span><em>{dateStatus(day.date)}</em>
      </button>)}
      <button type="button" aria-label="Next day" onClick={() => moveMeeting(selectedIndex + 1)} disabled={selectedIndex < 0 || selectedIndex >= calendarDays.length - 1}><ChevronRight size={16} /></button>
    </div>
    <div className="schedule-filter-row" aria-label="Filter races by status">
      {filters.map((option) => <button type="button" key={option} aria-pressed={filter === option} className={filter === option ? 'selected' : ''} onClick={() => setFilter(option)}>{option}</button>)}
    </div>
    <section className="schedule-races">
      <div className="schedule-section-heading"><strong>{selectedDay ? formatMeetingDate(selectedDay.date) : 'Race day'}</strong><small>{races.length} races</small></div>
      {races.length ? races.map((race) => <RaceCard key={race.id} race={race} market={market} />) : <p className="schedule-no-races">{selectedDay?.raceCount ? 'No races match this filter.' : `No races scheduled for ${formatMeetingDate(dayId)}. Select another date to view its race card.`}</p>}
    </section></>}
  </main>;
}
