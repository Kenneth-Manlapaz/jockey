import Link from 'next/link';
import { racing, type Page as ResultPage, type Race } from '@web/lib/racing';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const date = typeof q.date === 'string' ? q.date : '';
  const page = Math.max(1, Number(q.page) || 1);
  const data = await racing<ResultPage<Race & { result_status: string }>>(`results/?page=${page}${date ? `&date=${encodeURIComponent(date)}` : ''}`);
  return <main className="web-main racing-page"><section className="dashboard-hero"><span className="eyebrow">PUBLISHED RACING RECORDS</span><h1>Results &amp; dividends</h1><p>Finishing records and associated pool publications.</p></section><form className="racing-search"><input type="date" name="date" defaultValue={date} aria-label="Filter results by racing date" /><button className="app-button primary">Filter</button><Link className="app-button secondary" href="/results">All</Link></form><div className="racing-directory">{data.results.map(r => <article className="web-card" key={r.id}><div><Link className="racing-link" href={`/race/${r.id}?date=${r.race_date}#official-result`}><h2>Race {r.race_number} · {r.name}</h2></Link><p className="racing-muted">{r.race_date} · {r.venue} · {r.result_status}</p></div></article>)}</div>{!data.results.length && <section className="web-card"><h2>No published results</h2><p>Results will appear when racing records are published.</p></section>}<div className="racing-date-controls">{data.previous && <Link className="app-button secondary" href={`?page=${page-1}&date=${date}`}>Previous</Link>}{data.next && <Link className="app-button secondary" href={`?page=${page+1}&date=${date}`}>Next</Link>}</div></main>;
}
