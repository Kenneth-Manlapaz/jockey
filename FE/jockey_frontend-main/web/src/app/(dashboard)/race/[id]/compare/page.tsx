import Link from 'next/link';
import { racing, clock, postTime, timeBasis, type Program, type Query } from '@web/lib/racing';
import { PersonLink } from '@web/features/racing/components/information';
import { RecentFinishes } from '@web/features/racing/components/program-field';

export default async function ComparePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Query> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const program = await racing<Program>(`races/${encodeURIComponent(id)}/`);
  const values = Array.isArray(query.horse) ? query.horse : query.horse ? [query.horse] : [];
  const ids = [...new Set(values.map(Number))];
  const entries = ids.map(horseId => program.entries.find(e => e.horse.id === horseId && !['scratched', 'withdrawn'].includes(e.status)));
  const valid = ids.length >= 2 && ids.length <= 4 && entries.every(Boolean);
  return <main className="web-main racing-page comparison-page"><Link className="app-back-link" href={`/race/${program.id}#program`}>Back to program</Link>
    <section className="dashboard-hero"><span className="eyebrow">RUNNER COMPARISON / RACE {program.race_number}</span><h1>{program.name}</h1><p>{program.venue} / {postTime(program)} / {program.distance_m} m / {program.surface}</p><small>All form precedes this race. Compare recorded evidence alongside the size of each sample.</small></section>
    {!valid ? <section className="web-card"><h2>Choose two to four active runners</h2><p>Return to the program and select runners from this race to compare.</p><Link className="app-button primary" href={`/race/${program.id}#program`}>Select runners</Link></section> : <section className="web-card"><div className="data-table-scroll"><table className="data-table comparison-table"><thead><tr><th scope="col">Race context</th>{entries.map(e => e && <th scope="col" key={e.id}><small>No. {e.horse_number} / Gate {e.gate ?? 'Not recorded'}</small><PersonLink person={e.horse} kind="horses" /></th>)}</tr></thead><tbody>
      <tr><th scope="row">Latest five finishes</th>{entries.map(e => e && <td key={e.id}><RecentFinishes entry={e} /></td>)}</tr>
      <tr><th scope="row">Best individual time / 180 days</th>{entries.map(e => e && <td key={e.id}><strong>{clock(e.form.best_time_ms)}</strong><small>{timeBasis(e.form)}</small></td>)}</tr>
      <tr><th scope="row">Comparable finishes</th>{entries.map(e => e && <td key={e.id}>{e.form.comparable_count ?? 0}<small>Same venue, distance and surface</small></td>)}</tr>
      <tr><th scope="row">Jockey / assigned weight</th>{entries.map(e => e && <td key={e.id}><PersonLink person={e.jockey} kind="jockeys" /><small>{e.weight_kg == null ? 'Not recorded' : `${e.weight_kg} kg`}</small></td>)}</tr>
      <tr><th scope="row">Trainer / owner</th>{entries.map(e => e && <td key={e.id}><PersonLink person={e.trainer} kind="trainers" /><small><PersonLink person={e.owner} kind="owners" /></small></td>)}</tr>
      <tr><th scope="row">Published odds / status</th>{entries.map(e => e && <td key={e.id}>{e.published_odds ?? 'Not published'}<small>{e.status}</small></td>)}</tr>
    </tbody></table></div><p className="racing-muted">Recent finishes read newest first. DQ means disqualified. Missing times remain unavailable. Recorded form and published odds do not predict a result.</p></section>}
  </main>;
}
