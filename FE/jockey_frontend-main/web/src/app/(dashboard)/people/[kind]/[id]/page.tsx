import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { racing, queryString, type Participant, type FilterOptions, type Query } from '@web/lib/racing';
import { FormTable } from '@web/features/racing/components/information';
import { ProfileList } from '@web/features/racing/components/profile-list';
import { Statistics, RecordFilters } from '@web/features/racing/components/exploration';
const roles: Record<string, string> = { jockeys: 'Jockey', trainers: 'Trainer', owners: 'Owner' };
export default async function Page({ params, searchParams }: { params: Promise<{ kind: string; id: string }>; searchParams: Promise<Query> }) {
  const { kind, id } = await params;
  const q = await searchParams;
  const [p, options] = await Promise.all([racing<Participant>(`people/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/?${queryString(q)}`), racing<FilterOptions>('filters/')]);
  const role = roles[kind] || 'Participant';
  const history = `/people/${kind}/${id}/history?${queryString(q, { page: undefined })}`;
  const currentDirectory = `/directory/horses?${kind === 'owners' ? 'owner' : 'trainer'}=${encodeURIComponent(p.name)}`;
  return <main className="web-main racing-page racing-participant-page">
    <Link className="app-back-link" href={`/directory/${kind}`}><ArrowLeft size={15} aria-hidden="true" /> Back to {kind}</Link>
    <section className="dashboard-hero"><span className="eyebrow">{role} PROFILE</span><h1>{p.name}</h1><p>{p.bio || `${role} profile, recorded performances and horse connections.`}</p></section>
    <section className="web-card participant-performance"><div className="participant-section-heading"><h2>Recorded performance</h2><Link className="racing-link" href={history}>Search full history</Link></div>
      <RecordFilters query={q} options={options} reset={`/people/${kind}/${id}`} />
      <Statistics stats={p.stats} /><p className="racing-muted">{p.stats.first_date || 'No matching records'}{p.stats.last_date && ` to ${p.stats.last_date}`}</p><p className="racing-muted participant-basis">{p.basis}</p>
    </section>
    {kind !== 'jockeys' && <section className="web-card"><div className="participant-section-heading"><h2>Current {kind === 'owners' ? 'ownership' : 'training'} assignments</h2><span>{p.current_horses_count ?? 0} horses</span></div>
      <p className="racing-muted">Current assignments are independent of the selected record filters. Historical result connections remain preserved.</p>
      {p.current_horses?.length ? <ProfileList compact previewCount={6} label="Current horse assignments" items={p.current_horses.map(h => ({ ...h, href: `/horse/${h.id}` }))} /> : <p className="racing-empty">No current assignments recorded.</p>}
      <Link className="racing-link" href={currentDirectory}>Browse current assignments in the horse directory</Link>
    </section>}
    <div className="participant-connections">
      <section className="web-card"><div className="participant-section-heading"><h2>Declared &amp; recorded associations</h2><span>{p.horses_count ?? p.horses.length} horses</span></div><p className="racing-muted">Declared assignments plus connections in the filtered finishing history. This is not a list of current ownership.</p>
        {p.horses.length ? <ProfileList compact previewCount={6} label="Associated horses" items={p.horses.map(h => ({ id: h.horse_id, name: h.horse__name, href: `/horse/${h.horse_id}` }))} /> : <p className="racing-empty">No recorded associations.</p>}
        {(p.horses_count ?? 0) > p.horses.length && <p className="racing-muted">Showing the first {p.horses.length} associated horses.</p>}
      </section>
      <section className="web-card"><div className="participant-section-heading"><h2>Historical horse combinations</h2><span>{p.combinations_count ?? p.combinations.length} combinations</span></div><p className="racing-muted">Scoped to the selected record period and venue. Sorted by wins, then horse name.</p>
        {p.combinations.length ? <ProfileList compact previewCount={6} label="Horse combinations" items={p.combinations.map(c => ({ id: c.entry__horse_id, name: c.entry__horse__name, href: `/horse/${c.entry__horse_id}`, detail: `${c.finishes} finishes / ${c.wins} wins` }))} /> : <p className="racing-empty">No recorded combinations.</p>}
        {(p.combinations_count ?? 0) > p.combinations.length && <Link className="racing-link" href={history}>Search the full finishing history</Link>}
      </section>
    </div>
    <section className="web-card participant-results"><div className="participant-section-heading"><h2>Recent results</h2><Link className="racing-link" href={history}>View all matching finishes</Link></div><FormTable rows={p.recent} /></section>
  </main>;
}
