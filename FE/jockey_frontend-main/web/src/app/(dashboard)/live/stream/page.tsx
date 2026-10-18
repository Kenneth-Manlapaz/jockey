import Link from 'next/link';
import { ArrowLeft, ArrowRight, Volume2 } from 'lucide-react';
import { api } from '@/lib/api/client';

export default async function LiveStreamPage() {
  const { liveRace } = await api.getHome();
  const race = await api.getRace(liveRace.id);
  const runners = [...(race?.runners ?? liveRace.runners ?? [])].sort((a, b) => a.number - b.number);
  const isLive = liveRace.isLive === true || liveRace.status === 'ongoing';
  return <main className="app-page live-stream-page">
    <header className="live-stream-top"><Link href="/live" aria-label="Back to Live Race Center"><ArrowLeft size={17} /></Link><strong>Live Stream</strong><span /></header>
    <div className="live-stream-video">
      <video title="Sample horse racing footage" autoPlay muted loop playsInline controls poster={liveRace.heroImageUrl || '/home-race-feature.jpg'}>
        <source src="https://videos.pexels.com/video-files/16794017/16794017-uhd_3840_2160_24fps.mp4" type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <span className="live-stream-badge"><i className={isLive ? 'is-live' : ''} />{isLive ? 'LIVE' : 'SAMPLE REPLAY'}</span>
    </div>
    <section className="live-stream-details"><span className="live-stream-status"><i className={isLive ? 'is-live' : ''} />{isLive ? 'LIVE' : 'RACE REPLAY'}</span><h1>Race {liveRace.number} · {liveRace.name}</h1><p>{liveRace.venue} · {liveRace.distanceM.toLocaleString()} m · {liveRace.postTime}</p><Link href="/live/updates">View race updates <ArrowRight size={15} /></Link></section>
    <p className="live-stream-note"><Volume2 size={13} /> Sample racing video for preview. Official live video is not connected yet.</p>
    <section className="live-stream-entry-list"><h2>Race entries</h2>{runners.length ? runners.map((runner) => <article key={runner.id}><span style={{ backgroundColor: runnerColor(runner.number) }}>{runner.number}</span><div><strong>{runner.horse}</strong><small>{runner.jockey}</small></div></article>) : <p>Race entries are not available yet.</p>}</section>
  </main>;
}

function runnerColor(number: number) {
  const colors = ['#5d8a72', '#5d78a6', '#82709d', '#778496', '#5b8a82', '#a56d70', '#a18b5b', '#6e8994'];
  return colors[(Math.max(number, 1) - 1) % colors.length];
}
