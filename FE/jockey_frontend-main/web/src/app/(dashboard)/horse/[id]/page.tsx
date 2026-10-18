import Link from 'next/link';
import { racing, type Horse } from '@web/lib/racing';
import { PersonLink, FormView } from '@web/features/racing/components/information';
import { FavoriteButton } from '@web/features/racing/components/save-favorite';
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const race = typeof q.race === 'string' && /^\d+$/.test(q.race) ? q.race : '';
  const h = await racing<Horse>(`horses/${encodeURIComponent(id)}/${race ? `?race=${race}` : ''}`);
  return <main className="web-main racing-page"><Link className="app-back-link" href={race ? `/race/${race}` : '/directory/horses'}>← {race ? 'Back to race program' : 'Horse directory'}</Link><section className="dashboard-hero"><span className="eyebrow">HORSE PROFILE</span><h1>{h.name}</h1><p>{h.birth_year ? `Born ${h.birth_year}` : 'Birth year unavailable'} · {h.sex || 'Sex unavailable'} · {h.color || 'Colour unavailable'}</p></section><FavoriteButton horseId={h.id} /><section className="web-card"><h2>Identity &amp; connections</h2><p>{h.bio || 'Biography unavailable.'}</p><div className="racing-vitals"><div><small>SIRE</small><strong>{h.sire || 'Unavailable'}</strong></div><div><small>DAM</small><strong>{h.dam || 'Unavailable'}</strong></div><div><small>CURRENT TRAINER</small><PersonLink person={h.current_trainer} kind="trainers" /></div><div><small>CURRENT OWNER</small><PersonLink person={h.current_owner} kind="owners" /></div></div><p className="racing-muted">Historical connections appear with each recorded performance below.</p></section><FormView form={h.form} /></main>;
}
