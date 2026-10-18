import Link from 'next/link';
import { ArrowLeft, Clock3, MapPin, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api/client';

export default async function LiveUpdatesPage() {
  const { liveRace } = await api.getHome();
  const runners = [...(liveRace.runners ?? [])].sort((a, b) => a.number - b.number);
  const isLive = liveRace.isLive === true || liveRace.status === 'ongoing';
  return <main className="app-page live-updates-page">
    <header className="live-updates-top"><Link href="/live" aria-label="Back to live center"><ArrowLeft size={17} /></Link><strong>Live Race Updates</strong><span /></header>
    <section className="live-updates-title"><span>RACE {liveRace.number} · {liveRace.postTime}</span><h1>Official update feed</h1><b>{isLive ? 'LIVE' : 'AT POST'}</b></section>
    <div className="live-update-facts"><div><small>RACE STATUS</small><strong>{liveRace.status.toUpperCase()}</strong></div><div><small>LAST UPDATE</small><strong>—</strong></div></div>
    <section className="live-positions"><h2>Running positions</h2><div className="live-waiting-card"><RefreshCw size={17} /><strong>Waiting for official updates</strong><p>Horse numbers, current positions, and elapsed times will appear when the race feed is available.</p></div></section>
    <section className="live-entry-monitor"><h2>Entry monitor</h2>{runners.length ? <div>{runners.map((runner) => <article key={runner.id}><span className="app-race-number" style={{ background: runner.silkColor || undefined }}>{runner.number}</span><span><strong>{runner.horse}</strong><small>{runner.jockey}</small></span><b>NO POSITION</b></article>)}</div> : <p className="app-empty">Race entries are not available yet.</p>}</section>
    <footer className="live-updates-refresh"><Clock3 size={12} /> Live feed refreshes when official updates are connected.</footer>
    <nav className="live-updates-links"><Link href={`/race/${liveRace.id}/entries`}><MapPin size={14} /> Full entries</Link><Link href="/live/stream">Watch stream <ArrowLeft size={14} /></Link></nav>
  </main>;
}
