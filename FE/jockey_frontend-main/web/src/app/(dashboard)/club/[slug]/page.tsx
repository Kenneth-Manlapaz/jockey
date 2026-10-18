import Link from 'next/link';
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { api } from '@/lib/api/client';

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function displayName(slug: string) {
  return slug.split('-').filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
}

export default async function ClubProfilePage({ params }: PageProps<'/club/[slug]'>) {
  const { slug } = await params;
  const data = await api.getHome();
  const races = data.todayRaces.filter((race) => toSlug(race.clubName || race.venue) === slug);
  const featuredRace = races.find((race) => race.status === 'upcoming' || race.status === 'ongoing') ?? races[0];
  const clubName = featuredRace?.clubName || featuredRace?.venue || displayName(slug);

  return <main className="app-page club-profile-page">
    <section className="club-profile-hero" style={{ backgroundImage: `linear-gradient(0deg,rgba(8,32,26,.95),rgba(8,32,26,.12) 80%),url("${featuredRace?.heroImageUrl || '/home-race-feature.jpg'}")` }}>
      <Link className="club-profile-back" href="/races" aria-label="Back to race schedule"><ArrowLeft size={18} /></Link>
      <div><span>RACING CLUB</span><h1>{clubName}</h1><p><MapPin size={13} /> {featuredRace?.venue || 'Philippines'}</p></div>
    </section>
    <section className="club-profile-body">
      <div className="club-profile-tabs"><a className="active" href="#overview">Overview</a><a href="#club-races">Race card</a><Link href="/races">All clubs</Link></div>
      <section id="overview" className="club-overview-copy"><span>ABOUT THE CLUB</span><h2>Race day at {clubName}</h2><p>Explore the scheduled races and participating horses for this club.</p></section>
      <div className="club-profile-facts"><span><small>MEETING</small><strong>{data.dateLabel}</strong></span><span><small>RACES TODAY</small><strong>{races.length}</strong></span></div>
      <div className="club-races-title" id="club-races"><h2>Club race card</h2><span>{races.length} races</span></div>
      <div className="club-race-list">{races.length ? races.map((race) => <Link href={`/race/${race.id}`} className="club-race-card" key={race.id}><span className="app-race-number">{race.number}</span><span><strong>{race.name}</strong><small>{race.postTime} · {race.distanceM.toLocaleString()} m · {race.entries} entries</small></span><span className="app-status">{race.status}</span><ArrowRight size={15} /></Link>) : <p className="app-empty">There are no races scheduled for this club yet.</p>}</div>
      {featuredRace && <Link className="race-profile-entries-button" href={`/race/${featuredRace.id}`}>Open featured race <ArrowRight size={16} /></Link>}
    </section>
  </main>;
}
