import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { racing, type Participant } from '@web/lib/racing';
import { FormTable } from '@web/features/racing/components/information';
import { ProfileList } from '@web/features/racing/components/profile-list';

const roles: Record<string, string> = { jockeys: 'Jockey', trainers: 'Trainer', owners: 'Owner' };

export default async function Page({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const p = await racing<Participant>(`people/${encodeURIComponent(kind)}/${encodeURIComponent(id)}/`);
  const role = roles[kind] || 'Participant';
  return <main className="web-main racing-page racing-participant-page">
    <Link className="app-back-link" href={`/directory/${kind}`}><ArrowLeft size={15} aria-hidden="true" /> Back to {kind}</Link>
    <section className="dashboard-hero"><span className="eyebrow">{role} PROFILE</span><h1>{p.name}</h1><p>{p.bio || `${role} profile, recorded performances and horse connections.`}</p></section>
    <section className="web-card participant-performance"><div className="participant-section-heading"><h2>Recorded performance</h2><span>Recorded history</span></div>
      <dl className="participant-stats">
        <div><dt>Recorded finishes</dt><dd>{p.stats.recorded_finishes.toLocaleString()}</dd></div>
        <div><dt>Wins</dt><dd>{p.stats.wins.toLocaleString()}</dd></div>
        <div><dt>Top three</dt><dd>{p.stats.top_three.toLocaleString()}</dd></div>
      </dl>
      <p className="racing-muted participant-basis">{p.basis}</p>
    </section>
    <div className="participant-connections">
      <section className="web-card"><div className="participant-section-heading"><h2>Associated horses</h2><span>{p.horses.length} horses</span></div>
        {p.horses.length ? <ProfileList compact previewCount={6} label="Associated horses" items={p.horses.map(h => ({ id: h.horse_id, name: h.horse__name, href: `/horse/${h.horse_id}` }))} /> : <p className="racing-empty">No recorded associations.</p>}
      </section>
      <section className="web-card"><div className="participant-section-heading"><h2>Horse combinations</h2><span>Finishes / wins</span></div>
        {p.combinations.length ? <ProfileList compact previewCount={6} label="Horse combinations" items={p.combinations.map(c => ({ id: c.entry__horse_id, name: c.entry__horse__name, href: `/horse/${c.entry__horse_id}`, detail: `${c.finishes} finishes / ${c.wins} wins` }))} /> : <p className="racing-empty">No recorded combinations.</p>}
      </section>
    </div>
    <section className="web-card participant-results"><div className="participant-section-heading"><h2>Recent results</h2><span>Latest recorded finishes</span></div><FormTable rows={p.recent} /></section>
  </main>;
}
