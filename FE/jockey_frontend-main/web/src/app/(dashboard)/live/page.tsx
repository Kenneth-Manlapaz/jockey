import Link from 'next/link';
import { ArrowRight, CalendarClock, Radio, Rows3, Trophy, TrendingUp, Video } from 'lucide-react';
import { api, markets } from '@/lib/api/client';

export default async function LivePage() {
  const { liveRace, liveSeries } = await api.getHome();
  const games = await api.getRaceGames(liveRace.id);
  const isLive = liveRace.isLive === true || liveRace.status === 'ongoing';
  const poster = liveRace.heroImageUrl || '/home-race-feature.jpg';
  return <main className="app-page live-center-page">
    <header className="live-center-hero">
      <div className="live-center-top"><Link href="/dashboard" aria-label="Home"><Trophy size={15} /></Link><strong>Live Race Center</strong><span><i className={isLive ? 'is-live' : ''} />{isLive ? 'LIVE' : 'RACE DAY'}</span></div>
      <div className="live-center-heading"><span>{liveSeries} · RACE {liveRace.number}</span><h1>{liveRace.name}</h1><p><CalendarClock size={12} /> Racing starts {liveRace.postTime} · {liveRace.distanceM.toLocaleString()} m</p></div>
    </header>
    <Link className="live-preview" href="/live/stream" style={{ backgroundImage: `linear-gradient(0deg,rgba(5,25,21,.85),rgba(5,25,21,.04) 70%),url("${poster}")` }}>
      <span className="live-preview-badge"><i className={isLive ? 'is-live' : ''} />{isLive ? 'LIVE' : 'RACE REPLAY'}</span><span className="live-preview-play"><Video size={18} /></span><span className="live-preview-caption"><strong>Today’s Racing</strong><small>{isLive ? 'Watch the race in progress' : 'Open the race stream and updates'}</small></span><ArrowRight className="live-preview-arrow" size={16} />
    </Link>
    <div className="live-center-status"><span><i className={isLive ? 'is-live' : ''} /> {isLive ? 'LIVE NOW' : 'AT POST'}</span><span>Stream status: <strong>{isLive ? 'available' : 'replay available'}</strong></span></div>
    <nav className="live-quick-actions" aria-label="Live race tools">
      <Link href="/live/updates"><Radio size={17} /><strong>Live Updates</strong><small>Official race feed</small></Link>
      <Link href={`/race/${liveRace.id}/entries`}><Rows3 size={17} /><strong>Entries</strong><small>{liveRace.entries} runners</small></Link>
      <Link href="/totalizer/race-3"><TrendingUp size={17} /><strong>Totalizer</strong><small>Pool totals</small></Link>
    </nav>
    <section className="live-games-section"><div><h2>Available games</h2><Link href="/games">View all <ArrowRight size={12} /></Link></div><nav className="live-games-grid" aria-label="Available betting games">{(games.length ? games.map((game) => ({ code: game.code, name: game.name })) : markets.map((code) => ({ code, name: code.replaceAll('_', ' ') }))).map((game, index) => <Link href={`/selection/${liveRace.id}?market=${encodeURIComponent(game.code)}`} key={game.code}><span>{index + 1}</span><strong>{game.name}</strong><ArrowRight size={13} /></Link>)}</nav></section>
    <p className="live-center-disclaimer">Video and live positions are demo previews until an official race feed is connected.</p>
  </main>;
}
