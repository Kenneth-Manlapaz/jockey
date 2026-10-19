import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { racing, todayManila, calendarLink, dateLabel, RacingApiError, type Calendar, type MeetingDetail } from '@web/lib/racing';
import { ConnectionError, RaceRows } from './information';

type Query = Record<string, string | string[] | undefined>;
export async function RacingCalendar({ query }: { query: Query }) {
  const rawDate = typeof query.date === 'string' ? query.date : todayManila();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) && !Number.isNaN(Date.parse(rawDate));
  const selected = validDate ? rawDate : todayManila();
  const year = Number(query.year ?? selected.slice(0, 4));
  const month = Number(query.month ?? selected.slice(5, 7));
  if (!Number.isInteger(year) || year < 1900 || year > 9998 || !Number.isInteger(month) || month < 1 || month > 12) return <main className="web-main racing-page"><ConnectionError message="Choose a valid calendar year and month." /></main>;
  let data: Calendar;
  try { data = await racing<Calendar>(`calendar/?year=${year}&month=${month}&date=${selected}`); }
  catch (error) { return <main className="web-main racing-page"><header className="app-page-heading"><span>PHILIPPINE JOCKEY</span><h1>Racing calendar</h1></header><ConnectionError message={error instanceof Error ? error.message : 'Unable to load calendar.'} /></main>; }
  const first = new Date(Date.UTC(year, month - 1, 1));
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = new Map(data.days.map(d => [d.race_date, d]));
  const shiftMonth = (delta: number) => { const d = new Date(Date.UTC(year, month - 1 + delta, 1)); return `/?date=${selected}&year=${d.getUTCFullYear()}&month=${d.getUTCMonth() + 1}`; };
  const meetings = await Promise.all(data.meetings.map(async m => {
    try { return { meeting: m, detail: await racing<MeetingDetail>(`meetings/${m.id}/`, { gate: false }), error: '', locked: false }; }
    catch (cause) { return { meeting: m, detail: null, locked: cause instanceof RacingApiError && [401, 403].includes(cause.status), error: 'This meeting could not be loaded. Try opening it again.' }; }
  }));
  return <main className="web-main racing-page">
    <section className="dashboard-hero"><span className="eyebrow">PHILIPPINE JOCKEY · RACING INFORMATION</span><h1>Your race day, at a glance.</h1><p>Find a meeting, read the program, and follow the form.</p><small>Explore the calendar. Unlock race programs and racing statistics with a membership.</small></section>
    <div className="racing-calendar-layout"><section className="web-card racing-calendar" aria-label="Racing calendar"><span className="racing-kicker">RACE CALENDAR</span><h2>Find a race meeting</h2>
      <div className="racing-month-nav"><Link className="app-button secondary sm" href={shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></Link><h3>{first.toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h3><Link className="app-button secondary sm" href={shiftMonth(1)} aria-label="Next month"><ChevronRight size={18} /></Link></div>
      <form className="racing-jump" action="/"><input type="hidden" name="date" value={selected} /><label>Month<select name="month" defaultValue={month}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(Date.UTC(2025, i, 1)).toLocaleDateString('en-PH', { month: 'long', timeZone: 'UTC' })}</option>)}</select></label><label>Year<input aria-label="Year" name="year" type="number" min="1900" max="9998" defaultValue={year} required /></label><button className="app-button secondary sm">Go</button></form>
      <div className="racing-calendar-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span className="racing-weekday" key={d}>{d}</span>)}{Array.from({ length: first.getUTCDay() }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: dayCount }, (_, i) => { const date = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`; const available = days.get(date); return <Link href={calendarLink(date)} key={date} aria-current={date === selected ? 'date' : undefined} aria-label={`${date}${available ? `, ${available.meeting_count} meetings, ${available.race_count} races` : ', no scheduled races'}`} className={`racing-day${available ? ' available' : ''}${date === selected ? ' selected' : ''}${date === data.today ? ' today' : ''}`}><span>{i + 1}</span>{available && <i aria-hidden="true" />}</Link>; })}</div>
      <p className="racing-muted">Gold dots indicate published racing dates. Calendar dates use Philippine time (Asia/Manila).</p><div className="racing-date-controls">{data.previous_date ? <Link className="app-button secondary sm" href={calendarLink(data.previous_date)}>← Previous Race</Link> : <span className="racing-muted">No earlier racing date</span>}{data.next_date ? <Link className="app-button secondary sm" href={calendarLink(data.next_date)}>Upcoming Race →</Link> : <span className="racing-muted">No later racing date</span>}</div>
      <Link className="racing-link" href={calendarLink(data.today)}>Today · {data.today}</Link>
    </section><section className="racing-meetings" aria-live="polite"><header className="app-page-heading"><span>SELECTED RACING DATE</span><h1>{new Date(`${selected}T00:00:00Z`).toLocaleDateString('en-PH', { day: 'numeric', month: 'long', timeZone: 'UTC' })}</h1><p>{dateLabel(selected)}</p></header>{meetings.length ? meetings.map(({ meeting: m, detail, error, locked }) => <article className="web-card" key={m.id}><div className="section-head"><h2><Link href={`/meeting/${m.id}?date=${selected}`}>{m.name}</Link></h2><span className="status">{m.status}</span></div><p className="racing-muted">{m.venue} · {m.race_count} races · {m.timezone}</p>{detail ? <><RaceRows races={detail.races} />{detail.announcements.filter(a => !a.race_id).map(a => <p key={a.title}><strong>{a.title}</strong> · {a.content}</p>)}</> : <div>{locked ? <><p>Unlock the complete race program, horse form, results and dividends.</p><Link className="app-button primary" href={`/subscribe?next=${encodeURIComponent(`/meeting/${m.id}?date=${selected}`)}`}>View membership plans</Link></> : <p role="alert">{error}</p>}</div>}<Link className="racing-link" href={`/meeting/${m.id}?date=${selected}`}>Open complete meeting →</Link></article>) : <section className="web-card"><h2>No meetings scheduled</h2><p>No race meeting has been published for this date. Use Previous Race or Upcoming Race to find an available program.</p></section>}</section></div>
  </main>;
}
