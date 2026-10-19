import Link from 'next/link';
import { racing, queryString, type Query, type RecordedStats, type FilterOptions, type HistoryPage } from '@web/lib/racing';
import { FormTable } from './information';

export function Statistics({ stats }: { stats: RecordedStats }) {
  return <dl className="record-statistics">{[
    ['Recorded finishes', stats.recorded_finishes.toLocaleString()], ['Wins', stats.wins.toLocaleString()],
    ['Seconds', (stats.seconds ?? 0).toLocaleString()], ['Thirds', (stats.thirds ?? 0).toLocaleString()],
    ['Win rate', stats.win_rate == null ? '—' : `${stats.win_rate.toFixed(1)}%`],
    ['Top-three rate', stats.top_three_rate == null ? '—' : `${stats.top_three_rate.toFixed(1)}%`],
  ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function RecordFilters({ query, options, reset, history = false, results = false }: { query: Query; options: FilterOptions; reset: string; history?: boolean; results?: boolean }) {
  const value = (key: string) => typeof query[key] === 'string' ? query[key] as string : '';
  return <form className="record-filters" role="search" aria-label="Filter recorded performances">
    {value('race') && <input type="hidden" name="race" value={value('race')} />}
    {results && <label>Exact date<input type="date" name="date" defaultValue={value('date')} /></label>}
    <label>From<input type="date" name="from" defaultValue={value('from')} /></label>
    <label>To<input type="date" name="to" defaultValue={value('to')} /></label>
    <label>Venue<select name="venue" defaultValue={value('venue')}><option value="">All venues</option>{options.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
    {(history || results) && <>
      <label>Year<input type="number" name="year" min="1" max="9998" placeholder="All years" defaultValue={value('year')} /></label>
      <label>Distance (m)<input type="number" name="distance" min="1" max="100000" placeholder="Any distance" defaultValue={value('distance')} /></label>
      <label>Surface<select name="surface" defaultValue={value('surface')}><option value="">All surfaces</option>{options.surfaces.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Status<select name="status" defaultValue={value('status')}><option value="">All published</option>{(results ? ['provisional', 'official', 'corrected'] : ['official', 'corrected']).map(s => <option key={s}>{s}</option>)}</select></label>
    </>}
    {history && <>
      <label>Horse<input name="horse" placeholder="Search horse" defaultValue={value('horse')} /></label>
      <label>Sort<select name="sort" defaultValue={value('sort') || '-date'}><option value="-date">Newest first</option><option value="date">Oldest first</option><option value="finish">Finishing position</option></select></label>
    </>}
    <div className="record-filter-actions"><button className="app-button primary" type="submit">Apply filters</button><Link className="app-button secondary" href={reset}>Reset</Link></div>
  </form>;
}

export function RecordPagination({ data, query }: { data: { next: string | null; previous: string | null }; query: Query }) {
  const page = Math.max(1, Number(query.page) || 1);
  return (data.next || data.previous) ? <nav className="directory-pagination" aria-label="Record pages">
    {data.previous ? <Link className="app-button secondary sm" href={`?${queryString(query, { page: page - 1 })}`}>Previous</Link> : <span />}
    <span>Page {page}</span>
    {data.next ? <Link className="app-button secondary sm" href={`?${queryString(query, { page: page + 1 })}`}>Next</Link> : <span />}
  </nav> : null;
}

export async function HistoryBrowser({ endpoint, back, title, query }: { endpoint: string; back: string; title: string; query: Query }) {
  const [data, options] = await Promise.all([racing<HistoryPage>(`${endpoint}?${queryString(query)}`), racing<FilterOptions>('filters/')]);
  const reset = query.race ? `?race=${encodeURIComponent(String(query.race))}` : '?';
  return <main className="web-main racing-page record-history-page">
    <Link className="app-back-link" href={`${back}${query.race ? `?race=${encodeURIComponent(String(query.race))}` : ''}`}>← Back to profile</Link>
    <section className="dashboard-hero"><span className="eyebrow">PUBLISHED HISTORY</span><h1>{title}</h1><p>Search the recorded archive by period, venue and race conditions.</p>{query.race && <small>Only performances before the selected race are included.</small>}</section>
    <section className="web-card"><RecordFilters history query={query} options={options} reset={reset} /></section>
    <section className="web-card"><div className="participant-section-heading"><h2>{data.count.toLocaleString()} matching finishes</h2><span>{data.stats.first_date || 'No records'}{data.stats.last_date && ` – ${data.stats.last_date}`}</span></div><Statistics stats={data.stats} /><p className="racing-muted">{data.basis}</p></section>
    <section className="web-card"><FormTable rows={data.results} /><RecordPagination data={data} query={query} /></section>
  </main>;
}
