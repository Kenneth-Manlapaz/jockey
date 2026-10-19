'use client';
import Link from 'next/link';
import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Program, Entry, Person } from '@web/lib/racing';
import { clock, timeBasis } from '@web/lib/racing-format';
import { FavoriteButton } from './save-favorite';

function Connection({ person, kind }: { person: Person | null; kind: string }) {
  return person ? <Link className="racing-link" href={`/people/${kind}/${person.id}`}>{person.name}</Link> : <>Not recorded</>;
}
export function RecentFinishes({ entry }: { entry: Entry }) {
  return <span className="runner-form" aria-label="Latest finishes, newest first">{entry.form.recent.length ? entry.form.recent.map((p, i) => <Link href={`/race/${p.race_id}?date=${p.date}#official-result`} key={`${p.race_id}-${i}`} className={!p.is_disqualified && p.finish_position <= 3 ? 'placed' : ''} title={`${p.date}: ${p.is_disqualified ? 'Disqualified' : `Position ${p.finish_position}`}`}>{p.is_disqualified ? 'DQ' : p.finish_position}</Link>) : <small>No records</small>}</span>;
}
export function ProgramField({ program }: { program: Program }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [sort, setSort] = useState('number');
  const entries = [...program.entries].sort((a, b) => {
    if (sort === 'name') return a.horse.name.localeCompare(b.horse.name) || a.horse_number - b.horse_number;
    const value = (e: Entry) => sort === 'time' ? (e.form.best_time_ms ?? Infinity) : Number(e.published_odds ?? Infinity);
    return (sort === 'number' ? 0 : value(a) - value(b)) || a.horse_number - b.horse_number;
  });
  return <form action={`/race/${program.id}/compare`} method="get" className="program-field">
    <div className="field-controls"><p><strong>{program.entries.length} declared runners</strong><small>Form reads newest first. Compare two to four active runners.</small></p>
      <label>Sort field<select value={sort} onChange={e => setSort(e.target.value)}><option value="number">Horse number</option><option value="name">Horse name</option><option value="time">Best comparable time</option><option value="odds">Published odds</option></select></label>
      <button className="app-button primary sm" disabled={selected.length < 2 || selected.length > 4} type="submit">Compare ({selected.length}/4)</button>
    </div>
    <div className="data-table-scroll"><table className="data-table runner-table"><thead><tr>
      <th scope="col"><span className="visually-hidden">Compare selection</span></th><th scope="col">No. / gate</th><th scope="col">Horse</th><th scope="col">Jockey / kg</th><th scope="col" className="runner-secondary">Trainer / owner</th><th scope="col">Last five</th><th scope="col">Best comparable</th><th scope="col">Odds / status</th><th scope="col">Details</th>
    </tr></thead><tbody>{entries.map(e => {
      const out = ['scratched', 'withdrawn'].includes(e.status);
      const open = expanded.includes(e.id);
      return <Fragment key={e.id}><tr className={out ? 'runner-out' : ''}>
        <td><input type="checkbox" name="horse" value={e.horse.id} checked={selected.includes(e.horse.id)} disabled={out || (!selected.includes(e.horse.id) && selected.length >= 4)} aria-label={`Compare ${e.horse.name}`} onChange={event => setSelected(event.target.checked ? [...selected, e.horse.id] : selected.filter(id => id !== e.horse.id))} /></td>
        <td><strong className="runner-number">{e.horse_number}</strong><small>Gate {e.gate ?? '—'}</small>{e.coupled_group && <small>Group {e.coupled_group}</small>}</td>
        <th scope="row"><span className="runner-identity"><Link className="data-name-link" href={`/horse/${e.horse.id}?race=${program.id}`}>{e.horse.name}</Link><FavoriteButton compact horseId={e.horse.id} /></span><small>No. {e.horse_number} / {e.sex || 'Sex not recorded'}{out && ` / ${e.status}`}</small></th>
        <td><Connection person={e.jockey} kind="jockeys" /><small>{e.weight_kg == null ? 'Weight not recorded' : `${e.weight_kg} kg`}</small></td>
        <td className="runner-secondary"><Connection person={e.trainer} kind="trainers" /><small><Connection person={e.owner} kind="owners" /></small></td>
        <td><RecentFinishes entry={e} /></td>
        <td>{e.form.best_time_ms == null ? <span className="racing-muted" title={timeBasis(e.form)}>No eligible time</span> : clock(e.form.best_time_ms)}<small>{e.form.timed_comparable_count ?? 0} timed matches / 180 days</small></td>
        <td>{e.published_odds ?? 'Not published'}<small><span className={`publication-badge ${e.status}`}>{e.status}</span></small></td>
        <td><button type="button" className="runner-details-button" aria-expanded={open} aria-controls={`runner-detail-${e.id}`} aria-label={`${open ? 'Hide' : 'Show'} details for ${e.horse.name}`} onClick={() => setExpanded(open ? expanded.filter(id => id !== e.id) : [...expanded, e.id])}><ChevronDown size={17} aria-hidden="true" /></button></td>
      </tr>{open && <tr className="runner-expanded" id={`runner-detail-${e.id}`}><td colSpan={9}>
        <div className="runner-detail-grid"><div><strong>Connections</strong><p>Trainer: <Connection person={e.trainer} kind="trainers" /><br />Owner: <Connection person={e.owner} kind="owners" /></p></div>
          <div><strong>Comparable timing</strong><p>{timeBasis(e.form)}. Matches require the same venue, surface and distance, before this race.</p>{e.scratch_reason && <p>Scratch reason: {e.scratch_reason}</p>}</div>
          <div><strong>Declaration history</strong><details><summary>Original declaration and changes</summary>{e.original_declaration.captured_at_migration === true && <p>Original values were captured during migration; earlier changes are unavailable.</p>}{Object.entries((e.original_declaration.connections as Record<string, string | null>) || {}).map(([role, name]) => <p key={role}>{role}: {name || 'Not captured'}</p>)}<p>Horse number: {String(e.original_declaration.horse_number ?? 'Not captured')} / gate: {String(e.original_declaration.post_position ?? 'Not captured')} / weight: {String(e.original_declaration.weight_kg ?? 'Not captured')} kg</p>{e.changes.length ? e.changes.map((c, i) => <p key={i}>{new Date(c.recorded_at).toLocaleString('en-PH', { timeZone: program.timezone })}: {Object.entries(c.changes).map(([key, change]) => `${key}: ${change.before} → ${change.after}`).join('; ')}</p>) : <p>No recorded changes.</p>}</details></div>
        </div>
      </td></tr>}</Fragment>;
    })}</tbody></table></div>
    <p className="racing-muted" aria-live="polite">{selected.length} selected. Odds are published market information. Best times use recorded individual performances, excluding DQ.</p>
  </form>;
}
