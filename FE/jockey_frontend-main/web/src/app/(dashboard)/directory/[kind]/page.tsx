import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { racing, type Page as ResultPage, type Person } from '@web/lib/racing';
import { ProfileList } from '@web/features/racing/components/profile-list';

const kinds = ['horses', 'jockeys', 'trainers', 'owners'];
const labels: Record<string, string> = { horses: 'Horses', jockeys: 'Jockeys', trainers: 'Trainers', owners: 'Owners' };

export default async function Page({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { kind } = await params;
  if (!kinds.includes(kind)) notFound();
  const q = await searchParams;
  const search = typeof q.search === 'string' ? q.search : '';
  const page = Math.max(1, Number(q.page) || 1);
  const result = await racing<ResultPage<Person>>(`directory/${kind}/?search=${encodeURIComponent(search)}&page=${page}`);

  return <main className="web-main racing-page racing-directory-page">
    <section className="dashboard-hero"><span className="eyebrow">RACING DIRECTORY</span><h1>{labels[kind]}</h1><p>Profiles, connections and recorded racing history.</p></section>
    <section className="web-card directory-panel" aria-label="Racing profiles">
      <nav className="directory-tabs" aria-label="Profile categories">{kinds.map(k => <Link key={k} href={`/directory/${k}`} aria-current={k === kind ? 'page' : undefined}>{labels[k]}</Link>)}</nav>
      <div className="directory-toolbar">
        <form className="directory-search" role="search">
          <div><Search size={17} aria-hidden="true" /><input type="search" name="search" defaultValue={search} aria-label={`Search ${kind}`} placeholder={`Search ${kind} by name`} /></div>
          <button className="app-button primary" type="submit">Search</button>
          {search && <Link className="directory-clear" href={`/directory/${kind}`}>Clear</Link>}
        </form>
        <p className="directory-count"><strong>{result.count.toLocaleString()}</strong> {search ? 'matching' : 'total'} {kind}</p>
      </div>
      {result.results.length ? <ProfileList label={labels[kind]} items={result.results.map(p => ({ id: p.id, name: p.name, href: kind === 'horses' ? `/horse/${p.id}` : `/people/${kind}/${p.id}` }))} /> : <div className="directory-empty"><h2>No profiles found</h2><p>Try another name or clear your search to see all {kind}.</p></div>}
      {(result.previous || result.next) && <nav className="directory-pagination" aria-label="Directory pages">
        {result.previous ? <Link className="app-button secondary sm" href={`?search=${encodeURIComponent(search)}&page=${page - 1}`}><ChevronLeft size={15} aria-hidden="true" /> Previous</Link> : <span />}
        <span>Page {page}</span>
        {result.next ? <Link className="app-button secondary sm" href={`?search=${encodeURIComponent(search)}&page=${page + 1}`}>Next <ChevronRight size={15} aria-hidden="true" /></Link> : <span />}
      </nav>}
    </section>
  </main>;
}
