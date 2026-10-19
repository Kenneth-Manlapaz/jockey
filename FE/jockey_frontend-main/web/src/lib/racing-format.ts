import type { Form, Race, Query } from './racing';

export function queryString(query: Query, changes: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (typeof value === 'string' && value) params.set(key, value);
  for (const [key, value] of Object.entries(changes)) { if (value === undefined || value === '') params.delete(key); else params.set(key, String(value)); }
  return params.toString();
}
export function timeBasis(form: Form) {
  if (form.best_time_ms != null) return `${form.timed_comparable_count ?? 0} timed matches in 180 days`;
  if (form.best_time_reason === 'race_context_required') return 'Select a race to compare times';
  if (form.best_time_reason === 'no_comparable_records') return 'No matching venue, surface and distance records';
  return 'No eligible individual time in the 180-day window';
}

export function todayManila() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function clock(value: number | null) { if (value == null) return 'Unavailable'; return `${Math.floor(value / 60000)}:${((value % 60000) / 1000).toFixed(2).padStart(5, '0')}`; }
export function postTime(race: Race) { return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: race.timezone }).format(new Date(race.post_time)); }
export function dateLabel(date: string) { return new Intl.DateTimeFormat('en-PH', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)); }
export function calendarLink(date: string) { return `/?date=${date}&year=${date.slice(0, 4)}&month=${Number(date.slice(5, 7))}`; }
export function sourceLabel(source: string | null | undefined) { return !source ? 'Unavailable' : /sample|fictional|development/i.test(source) ? 'JOCKEY program archive' : source; }
