import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Search } from 'lucide-react';
import { racing, queryString, type Page as ResultPage, type DirectoryPerson, type FilterOptions, type Query } from '@web/lib/racing';
import { PersonLink } from '@web/features/racing/components/information';
import { RecordPagination } from '@web/features/racing/components/exploration';

const kinds = ['horses', 'jockeys', 'trainers', 'owners'];
const labels: Record<string, string> = { horses: 'Horses', jockeys: 'Jockeys', trainers: 'Trainers', owners: 'Owners' };
export default async function Page({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<Query> }) {
  const { kind } = await params;
  if (!kinds.includes(kind)) notFound();
  const q = await searchParams;
  const value = (key: string) => typeof q[key] === 'string' ? q[key] as string : '';
  const horse = kind === 'horses';
  const [result, options] = await Promise.all([
    racing<ResultPage<DirectoryPerson>>(`directory/${kind}/?${queryString(q)}`), racing<FilterOptions>('filters/'),
  ]);
  return <main className="web-main racing-page racing-directory-page">
    <section className="dashboard-hero"><span className="eyebrow">RACING DIRECTORY</span><h1>{labels[kind]}</h1><p>{horse ? 'Identity and current connections, together in one searchable list.' : 'Search participants and compare their scoped recorded performances.'}</p></section>
    <section className="web-card directory-panel" aria-label="Racing profiles">
      <nav className="directory-tabs" aria-label="Profile categories">{kinds.map(k => <Link key={k} href={`/directory/${k}`} aria-current={k === kind ? 'page' : undefined}>{labels[k]}</Link>)}</nav>
      <form className="directory-data-filters" role="search">
        <label className="directory-name-search"><span>Search {kind}</span><div><Search size={16} aria-hidden="true" /><input type="search" name="search" defaultValue={value('search')} aria-label={`Search ${kind}`} placeholder="Search by name" /></div></label>
        {horse ? <>
          <label>Current trainer<input name="trainer" defaultValue={value('trainer')} placeholder="Any trainer" /></label>
          <label>Current owner<input name="owner" defaultValue={value('owner')} placeholder="Any owner" /></label>
          <label>Sex<select name="sex" defaultValue={value('sex')}><option value="">All</option>{options.sexes.map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Colour<input name="color" defaultValue={value('color')} placeholder="Any colour" /></label>
          <label>Birth year<input type="number" name="birth_year" min="1" max="9998" defaultValue={value('birth_year')} placeholder="Any year" /></label>
        </> : <>
          <label>Records from<input type="date" name="from" defaultValue={value('from')} /></label>
          <label>Records to<input type="date" name="to" defaultValue={value('to')} /></label>
          <label>Venue<select name="venue" defaultValue={value('venue')}><option value="">All venues</option>{options.venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
        </>}
        <label>Sort<select name="sort" defaultValue={value('sort') || 'name'}><option value="name">Name A-Z</option><option value="-name">Name Z-A</option>{horse && <><option value="-birth_year">Birth year: newest</option><option value="birth_year">Birth year: oldest</option><option value="trainer">Trainer name</option><option value="owner">Owner name</option></>}</select></label>
        <div className="record-filter-actions"><button className="app-button primary" type="submit">Search</button><Link className="app-button secondary" href={`/directory/${kind}`}>Reset</Link></div>
      </form>
      <div className="directory-table-heading"><strong>{result.count.toLocaleString()} matching {kind}</strong><span>{horse ? 'Connections are current assignments. Birth year is not an exact age.' : 'Statistics use official/corrected finishes in the selected period and venue.'}</span></div>
      {result.results.length ? <div className="data-table-scroll"><table className="data-table directory-data-table"><thead><tr><th scope="col">{horse ? 'Horse' : 'Name'}</th>{horse ? <><th scope="col">Current trainer</th><th scope="col">Current owner</th><th scope="col">Sex</th><th scope="col">Birth year</th><th scope="col">Colour / origin</th></> : <><th scope="col">Finishes</th><th scope="col">Wins</th><th scope="col">Seconds</th><th scope="col">Thirds</th><th scope="col">Win rate</th><th scope="col">Top-three rate</th></>}</tr></thead><tbody>{result.results.map(p => <tr key={p.id}>
        <th scope="row"><Link className="data-name-link" href={horse ? `/horse/${p.id}` : `/people/${kind}/${p.id}`}>{p.name}</Link></th>
        {horse ? <><td><PersonLink person={p.current_trainer || null} kind="trainers" /></td><td><PersonLink person={p.current_owner || null} kind="owners" /></td><td>{p.sex || 'Unavailable'}</td><td>{p.birth_year ?? 'Unavailable'}</td><td>{p.color || 'Unavailable'}<small>{p.country_of_origin || 'Origin unavailable'}</small></td></> : <><td>{p.stats?.recorded_finishes ?? 0}</td><td>{p.stats?.wins ?? 0}</td><td>{p.stats?.seconds ?? 0}</td><td>{p.stats?.thirds ?? 0}</td><td>{p.stats?.win_rate == null ? 'No records' : `${p.stats.win_rate.toFixed(1)}%`}</td><td>{p.stats?.top_three_rate == null ? 'No records' : `${p.stats.top_three_rate.toFixed(1)}%`}</td></>}
      </tr>)}</tbody></table></div> : <div className="directory-empty"><h2>No profiles found</h2><p>Try another name or reset the filters.</p></div>}
      {!horse && <p className="directory-stat-note">Rates use recorded finishes, including DQ records in the denominator. Wins/placings exclude DQ. Dead heats count at their recorded position; top three includes wins.</p>}
      <RecordPagination data={result} query={q} />
    </section>
  </main>;
}
