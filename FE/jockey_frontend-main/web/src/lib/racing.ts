/** Public information contracts owned by Django apps.racing_info. No mock fallback. */
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export type Person = { id: number; name: string };
export type RecordedStats = { recorded_finishes: number; wins: number; top_three: number; seconds?: number; thirds?: number; win_rate?: number | null; top_three_rate?: number | null; first_date?: string | null; last_date?: string | null };
export type DirectoryPerson = Person & { sex?: string | null; birth_year?: number | null; color?: string | null; country_of_origin?: string | null; current_owner?: Person | null; current_trainer?: Person | null; stats?: RecordedStats };
export type FilterOptions = { venues: Person[]; surfaces: string[]; sexes: string[] };
export type Query = Record<string, string | string[] | undefined>;
export type Performance = {
  race_id: number; race_number: number; horse_number?: number; horse: Person; date: string; venue: string;
  distance_m: number; surface: string; classification: string | null;
  finish_position: number; time_ms: number | null; margin_lengths: string | null;
  is_dead_heat: boolean; is_disqualified: boolean; jockey: Person | null;
  trainer: Person | null; owner: Person | null; weight_kg: string | null; gate: number | null;
  intermediate_positions: Record<string, number>; status: string; is_demo: boolean;
  sectionals: { label: string; sequence: number; time_ms: number }[];
};
export type Form = {
  recent: Performance[]; comparable: Performance[]; best_time_ms: number | null;
  best_time_window_days: number; basis: string;
  stats: RecordedStats; trend: Performance[];
  comparable_count?: number; timed_comparable_count?: number; best_time_reason?: string | null;
};
export type Race = {
  id: number; meeting_id: number; race_number: number; name: string; race_date: string;
  venue: string; post_time: string; timezone: string; distance_m: number; surface: string;
  status: string; entries_count: number; is_demo: boolean;
};
export type Dividend = {
  id: number; combination: string; amount: string | null; unit_stake: string | null;
  currency: string; status: string; source: string; published_at: string | null;
  supersedes_id: number | null; correction_reason: string;
};
export type RacingEvent = {
  id: number; meeting_id: number; label: string; type: string; definition: string | null;
  rules_source: string | null; is_multi_race: boolean; status: string; is_demo: boolean;
  source: string; pool_total: string | null; distribution: string | null;
  legs: { sequence: number; race_id: number; race_number: number; race_name: string }[];
  dividends: Dividend[];
};
export type Announcement = { race_id?: number | null; title: string; content: string; source: string };
export type Meeting = { id: number; name: string; venue: string; date: string; timezone: string;
  status: string; source: string; is_demo: boolean; race_count: number };
export type MeetingDetail = Meeting & { races: Race[]; events: RacingEvent[]; announcements: Announcement[] };
export type Calendar = { year: number; month: number; today: string; selected_date: string; timezone: string;
  days: { race_date: string; meeting_count: number; race_count: number }[];
  previous_date: string | null; next_date: string | null; meetings: Meeting[] };
export type Entry = { id: number; horse: Person; horse_number: number; gate: number | null;
  sex: string | null; age: number | null; jockey: Person | null; trainer: Person | null;
  owner: Person | null; weight_kg: string | null; morning_odds: string | null;
  published_odds: string | null; status: string; scratch_reason: string | null; scratched_at: string | null;
  coupled_group: string; original_declaration: Record<string, unknown>;
  changes: { changes: Record<string, { before: string; after: string }>; recorded_at: string }[]; form: Form };
export type Program = Race & { conditions: string | null; classification: string | null;
  age_restriction: string | null; track_condition: string | null; purse_amount: string | null;
  purse_currency: string; entries: Entry[]; announcements: Announcement[]; events: RacingEvent[];
  tips: { tipster: string; raw_selection: string; note: string; sheet__source: string }[];
  result: { status: string; winning_time_ms: number | null; source: string | null;
    replay_url: string | null; decision: string | null; protest_filed: boolean;
    published_at: string | null; official_at: string | null; placements: Performance[];
    sectionals: { entry_id: number | null; label: string; sequence: number; time_ms: number }[];
    revision_count: number } | null };
export type Horse = { id: number; name: string; sex: string | null; birth_year: number | null;
  color: string | null; sire: string | null; dam: string | null; bio: string | null;
  is_demo: boolean; current_owner: Person | null; current_trainer: Person | null; form: Form };
export type Participant = Person & { kind: string; bio: string | null; stats: Form['stats']; basis: string;
  horses: { horse_id: number; horse__name: string }[]; recent: Performance[];
  horses_count?: number; current_horses?: Person[]; current_horses_count?: number; combinations_count?: number;
  combinations: { entry__horse_id: number; entry__horse__name: string; finishes: number; wins: number }[] };
export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };
export type HistoryPage = Page<Performance> & { stats: RecordedStats; basis: string };
export type ResultSummary = Race & { result_status: string; winning_time_ms: number | null; winners: { horse: Person; horse_number: number; is_dead_heat: boolean }[]; podium: { horse: Person; horse_number: number; finish_position: number; is_dead_heat: boolean }[] };

export class RacingApiError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function racing<T>(path: string, options: { gate?: boolean } = {}): Promise<T> {
  const base = (process.env.JOCKEY_API_BASE_URL ?? API_BASE_URL).replace(/\/+$/, '');
  let response: Response;
  const token = path.startsWith('calendar/') ? undefined : (await cookies()).get('jockey_access')?.value;
  try { response = await fetch(`${base}/racing/${path}`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(10000) }); }
  catch { throw new RacingApiError(503, 'The racing information service is unavailable. Please try again.'); }
  if (response.status === 404) notFound();
  if ([401, 403].includes(response.status)) {
    if (options.gate === false) throw new RacingApiError(response.status, 'Choose a subscription to open this race program.');
    const target = '/' + path.replace(/^horses\//, 'horse/').replace(/^meetings\//, 'meeting/').replace(/^races\//, 'race/').replace(/^events\//, 'event/').replace(/\/(?=\?|$)/, '');
    redirect(`/subscribe?next=${encodeURIComponent(target)}`);
  }
  if (!response.ok) throw new RacingApiError(response.status, response.status === 400 ? 'Check the requested date or filter and try again.' : 'Racing information could not be loaded.');
  return response.json() as Promise<T>;
}
export { queryString, timeBasis, todayManila, clock, postTime, dateLabel, calendarLink, sourceLabel } from './racing-format';
