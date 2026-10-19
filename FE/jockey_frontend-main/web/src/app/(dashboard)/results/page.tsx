import Link from 'next/link';
import { racing, clock, queryString, dateLabel, type Page as ResultPage, type ResultSummary, type FilterOptions, type Query } from '@web/lib/racing';
import { RecordFilters, RecordPagination } from '@web/features/racing/components/exploration';

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const [data, options] = await Promise.all([racing<ResultPage<ResultSummary>>(`results/?${queryString(q)}`), racing<FilterOptions>('filters/')]);
  const groups = new Map<string, ResultSummary[]>();
  for (const race of data.results) { const key = `${race.race_date}-${race.venue}`; groups.set(key, [...(groups.get(key) || []), race]); }
  function placing(r: ResultSummary, position: number) {
    const horses = r.podium.filter(p => p.finish_position === position);
    return horses.length ? horses.map(p => <div key={p.horse.id}><Link className="data-name-link" href={`/horse/${p.horse.id}?race=${r.id}`}>{p.horse_number}. {p.horse.name}</Link>{p.is_dead_heat && <small>Dead heat</small>}</div>) : <span className="racing-muted">Not recorded</span>;
  }
  return <main className="web-main racing-page results-workspace">
    <section className="dashboard-hero"><span className="eyebrow">PUBLISHED RACING RECORDS</span><h1>Results &amp; dividends</h1><p>Winners, placings and race times, grouped by date and venue.</p></section>
    <section className="web-card"><RecordFilters query={q} options={options} reset="/results" results /><p className="racing-muted">{data.count.toLocaleString()} matching races. Provisional publications can change; official and corrected labels reflect the stored publication.</p></section>
    {Array.from(groups.entries()).map(([key, races]) => <section className="web-card" key={key}><div className="participant-section-heading"><h2>{races[0].venue}</h2><span>{dateLabel(races[0].race_date)}</span></div>
      <div className="data-table-scroll"><table className="data-table result-summary-table"><thead><tr><th scope="col">Race</th><th scope="col">Winner</th><th scope="col">Second</th><th scope="col">Third</th><th scope="col">Winning time</th><th scope="col">Status</th></tr></thead><tbody>{races.map(r => <tr key={r.id}>
        <th scope="row"><Link className="data-name-link" href={`/race/${r.id}?date=${r.race_date}#official-result`}>R{r.race_number} - {r.name}</Link><small>{r.distance_m} m / {r.surface}</small></th>
        <td>{placing(r, 1)}</td><td>{placing(r, 2)}</td><td>{placing(r, 3)}</td><td>{clock(r.winning_time_ms)}</td><td><span className={`publication-badge ${r.result_status}`}>{r.result_status}</span></td>
      </tr>)}</tbody></table></div>
    </section>)}
    {!data.results.length && <section className="web-card"><h2>No published results</h2><p>Try another period or reset the filters.</p></section>}
    <RecordPagination data={data} query={q} />
  </main>;
}
