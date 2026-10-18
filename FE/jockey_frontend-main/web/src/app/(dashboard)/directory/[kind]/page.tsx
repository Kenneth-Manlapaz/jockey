import Link from 'next/link';
import { notFound } from 'next/navigation';
import { racing, type Page as ResultPage, type Person } from '@web/lib/racing';
const kinds = ['horses', 'jockeys', 'trainers', 'owners'];
export default async function Page({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { kind } = await params;
  if (!kinds.includes(kind)) notFound();
  const q = await searchParams;
  const search = typeof q.search === 'string' ? q.search : '';
  const page = Math.max(1, Number(q.page) || 1);
  const result = await racing<ResultPage<Person>>(`directory/${kind}/?search=${encodeURIComponent(search)}&page=${page}`);
  return <main className="web-main racing-page"><section className="dashboard-hero"><span className="eyebrow">RACING DIRECTORY</span><h1>{kind[0].toUpperCase() + kind.slice(1)}</h1><p>Profiles, connections and recorded racing history.</p></section><nav className="racing-information-nav">{kinds.map(k => <Link className="racing-link" key={k} href={`/directory/${k}`}>{k}</Link>)}</nav><form className="racing-search"><input name="search" defaultValue={search} aria-label={`Search ${kind}`} placeholder={`Search ${kind}…`} /><button className="app-button primary">Search</button></form><p className="racing-muted">{result.count} matching records</p><div className="racing-directory">{result.results.map(p => <Link className="web-card" key={p.id} href={kind === 'horses' ? `/horse/${p.id}` : `/people/${kind}/${p.id}`}><h2>{p.name}</h2><span>→</span></Link>)}</div>{!result.results.length && <section className="web-card"><p>No matching profiles available.</p></section>}<div className="racing-date-controls">{result.previous && <Link className="app-button secondary" href={`?search=${encodeURIComponent(search)}&page=${page-1}`}>Previous</Link>}{result.next && <Link className="app-button secondary" href={`?search=${encodeURIComponent(search)}&page=${page+1}`}>Next</Link>}</div></main>;
}
